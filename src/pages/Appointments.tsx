import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppointmentDialog } from '@/components/AppointmentDialog'
import { ConfirmationAlert } from '@/components/ConfirmationAlert'
import AgendaView from '@/components/AgendaView'
import { appointmentsService } from '@/services/appointmentsService'
import { transactionsService } from '@/services/transactionsService'
import { supabase } from '@/lib/supabaseClient'
import type { AppointmentWithDetails } from '@/types/database'
import { useAuth } from '@/contexts/AuthContext'
import { Pencil, Trash2, Plus, Search, Calendar as CalendarIcon, Clock, User, FileText, Filter, X, CalendarDays, Banknote, CheckCircle, Grid3X3, History } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { DateRange } from 'react-day-picker'
import { useLocation, useNavigate } from 'react-router-dom'

export const Appointments: React.FC = () => {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([])
  const [upcomingAppointments, setUpcomingAppointments] = useState<AppointmentWithDetails[]>([])
  const [pastAppointments, setPastAppointments] = useState<AppointmentWithDetails[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<AppointmentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<AppointmentWithDetails | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [launchedAppointments, setLaunchedAppointments] = useState<Set<string>>(new Set())
  const [launchingAppointment, setLaunchingAppointment] = useState<string | null>(null)
  const [completingAppointment, setCompletingAppointment] = useState<string | null>(null)
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
  const [appointmentToDelete, setAppointmentToDelete] = useState<AppointmentWithDetails | null>(null)
  const [completeConfirmationOpen, setCompleteConfirmationOpen] = useState(false)
  const [appointmentToComplete, setAppointmentToComplete] = useState<AppointmentWithDetails | null>(null)
  const [launchConfirmationOpen, setLaunchConfirmationOpen] = useState(false)
  const [appointmentToLaunch, setAppointmentToLaunch] = useState<AppointmentWithDetails | null>(null)
  const isMobile = useIsMobile()

  // Detectar aba ativa baseada na URL
  const searchParams = new URLSearchParams(location.search)
  const activeMainTab = searchParams.get('period') || 'upcoming'
  const activeViewTab = searchParams.get('view') || 'list'

  const handleMainTabChange = (value: string) => {
    const newSearchParams = new URLSearchParams(location.search)
    if (value === 'upcoming') {
      newSearchParams.delete('period')
    } else {
      newSearchParams.set('period', value)
    }
    const newSearch = newSearchParams.toString()
    navigate(`${location.pathname}${newSearch ? `?${newSearch}` : ''}`)
  }

  const handleViewTabChange = (value: string) => {
    const newSearchParams = new URLSearchParams(location.search)
    if (value === 'list') {
      newSearchParams.delete('view')
    } else {
      newSearchParams.set('view', value)
    }
    const newSearch = newSearchParams.toString()
    navigate(`${location.pathname}${newSearch ? `?${newSearch}` : ''}`)
  }

  useEffect(() => {
    loadAppointments()
  }, [])

  useEffect(() => {
    filterAppointments()
  }, [upcomingAppointments, pastAppointments, searchTerm, statusFilter, dateFilter, dateRange, activeMainTab])

  const loadAppointments = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      // Buscar agendamentos com informações de lembrete
      const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(*),
          procedure:procedures(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('appointment_date', { ascending: true })

      if (error) {
        throw error
      }

      // Verificar se é o primeiro agendamento para cada paciente
      const appointmentsWithFirstCheck = await Promise.all(
        (appointmentsData || []).map(async (appointment: any) => {
          // Buscar agendamentos anteriores do mesmo paciente
          const { data: previousAppointments } = await supabase
            .from('appointments')
            .select('id')
            .eq('patient_id', appointment.patient_id)
            .eq('user_id', user.id)
            .eq('is_active', true)
            .lt('appointment_date', appointment.appointment_date)

          const isFirstAppointment = !previousAppointments || previousAppointments.length === 0

          return {
            ...appointment,
            is_first_appointment: isFirstAppointment
          }
        })
      )

      setAppointments(appointmentsWithFirstCheck)
      
      // Separar agendamentos em próximos e anteriores
      const now = new Date()
      now.setHours(0, 0, 0, 0) // Início do dia atual
      
      const upcoming = appointmentsWithFirstCheck.filter(appointment => {
        const appointmentDate = new Date(appointment.appointment_date)
        appointmentDate.setHours(0, 0, 0, 0)
        return appointmentDate >= now
      })
      
      const past = appointmentsWithFirstCheck.filter(appointment => {
        const appointmentDate = new Date(appointment.appointment_date)
        appointmentDate.setHours(0, 0, 0, 0)
        return appointmentDate < now
      })
      
      setUpcomingAppointments(upcoming)
      setPastAppointments(past)
      
      // Verificar quais agendamentos já foram lançados no caixa
      await checkLaunchedAppointments(appointmentsWithFirstCheck)
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkLaunchedAppointments = async (appointmentsList: AppointmentWithDetails[]) => {
    const launched = new Set<string>()
    
    for (const appointment of appointmentsList) {
      if (appointment.status === 'completed') {
        try {
          const isLaunched = await transactionsService.isAppointmentAlreadyLaunched(appointment.id)
          if (isLaunched) {
            launched.add(appointment.id)
          }
        } catch (error) {
          console.error('Erro ao verificar lançamento do agendamento:', appointment.id, error)
        }
      }
    }
    
    setLaunchedAppointments(launched)
  }

  const handleCompleteAppointment = (appointment: AppointmentWithDetails) => {
    setAppointmentToComplete(appointment)
    setCompleteConfirmationOpen(true)
  }

  const confirmCompleteAppointment = async () => {
    if (!appointmentToComplete) return
    
    setCompletingAppointment(appointmentToComplete.id)
    
    try {
      await appointmentsService.update(appointmentToComplete.id, {
        status: 'completed'
      })
      
      // Recarregar a lista de agendamentos
      await loadAppointments()
    } catch (error) {
      console.error('Erro ao concluir agendamento:', error)
    } finally {
      setCompletingAppointment(null)
      setCompleteConfirmationOpen(false)
      setAppointmentToComplete(null)
    }
  }

  const cancelCompleteAppointment = () => {
    setCompleteConfirmationOpen(false)
    setAppointmentToComplete(null)
  }

  const handleLaunchToCashFlow = (appointment: AppointmentWithDetails) => {
    setAppointmentToLaunch(appointment)
    setLaunchConfirmationOpen(true)
  }

  const confirmLaunchToCashFlow = async () => {
    if (!appointmentToLaunch) return
    
    setLaunchingAppointment(appointmentToLaunch.id)
    
    try {
      const amount = appointmentToLaunch.total_price || appointmentToLaunch.procedure.price
      
      await transactionsService.createTransactionFromAppointment(
        appointmentToLaunch.id,
        appointmentToLaunch.procedure.name,
        amount,
        appointmentToLaunch.appointment_date
      )
      
      // Atualizar o estado para indicar que foi lançado
      setLaunchedAppointments(prev => new Set([...prev, appointmentToLaunch.id]))
    } catch (error) {
      console.error('Erro ao lançar no caixa:', error)
    } finally {
      setLaunchingAppointment(null)
      setLaunchConfirmationOpen(false)
      setAppointmentToLaunch(null)
    }
  }

  const cancelLaunchToCashFlow = () => {
    setLaunchConfirmationOpen(false)
    setAppointmentToLaunch(null)
  }

  const filterAppointments = () => {
    // Escolher a lista base baseada na aba ativa
    let baseList = activeMainTab === 'upcoming' ? upcomingAppointments : pastAppointments
    let filtered = baseList

    // Filtro por termo de busca (nome do paciente ou procedimento)
    if (searchTerm) {
      filtered = filtered.filter(appointment => 
        appointment.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.procedure.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.status === statusFilter)
    }

    // Filtro por data única
    if (dateFilter) {
      const filterDate = new Date(dateFilter)
      filtered = filtered.filter(appointment => {
        const appointmentDate = new Date(appointment.appointment_date)
        return appointmentDate.toDateString() === filterDate.toDateString()
      })
    }

    // Filtro por range de datas
    if (dateRange?.from) {
      filtered = filtered.filter(appointment => {
        const appointmentDate = new Date(appointment.appointment_date)
        const fromDate = new Date(dateRange.from!)
        const toDate = dateRange.to ? new Date(dateRange.to) : fromDate
        
        // Normalizar as datas para comparação (apenas data, sem hora)
        const appointmentDateOnly = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate())
        const fromDateOnly = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())
        const toDateOnly = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate())
        
        return appointmentDateOnly >= fromDateOnly && appointmentDateOnly <= toDateOnly
      })
    }

    setFilteredAppointments(filtered)
  }

  const handleEdit = (appointment: AppointmentWithDetails) => {
    setEditingAppointment(appointment)
    setShowDialog(true)
  }

  const handleDelete = (appointment: AppointmentWithDetails) => {
    setAppointmentToDelete(appointment)
    setDeleteConfirmationOpen(true)
  }

  const confirmDelete = async () => {
    if (!appointmentToDelete) return
    
    try {
      await appointmentsService.delete(appointmentToDelete.id)
      await loadAppointments()
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error)
    } finally {
      setDeleteConfirmationOpen(false)
      setAppointmentToDelete(null)
    }
  }

  const cancelDelete = () => {
    setDeleteConfirmationOpen(false)
    setAppointmentToDelete(null)
  }

  const handleSave = async () => {
    await loadAppointments()
    setShowDialog(false)
    setEditingAppointment(null)
  }



  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: 'Agendado', variant: 'secondary' as const },
      confirmed: { label: 'Confirmado', variant: 'default' as const },
      completed: { label: 'Concluído', variant: 'default' as const },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
  }



  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Agendamentos</h1>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {isMobile ? 'Novo' : 'Novo Agendamento'}
        </Button>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Título da seção de filtros */}
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">Filtros</h2>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Busca */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-1">
                    <Search className="w-4 h-4" />
                    Buscar
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder={isMobile ? "Paciente ou procedimento" : "Buscar por paciente ou procedimento..."}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                {/* Status */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-1">
                    <Badge className="w-4 h-4" />
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="all">Todos os status</option>
                    <option value="scheduled">Agendado</option>
                    <option value="confirmed">Confirmado</option>
                    <option value="completed">Concluído</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>

                {/* Range de Datas */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-1">
                    <CalendarDays className="w-4 h-4" />
                    Período
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                              {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                            </>
                          ) : (
                            format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                          )
                        ) : (
                          <span>Selecionar período</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={isMobile ? 1 : 2}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              {/* Botão Limpar Filtros */}
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                    setDateFilter('')
                    setDateRange(undefined)
                  }}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  {isMobile ? 'Limpar' : 'Limpar Filtros'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Abas Principais */}
      <Tabs value={activeMainTab} onValueChange={handleMainTabChange} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            Próximos
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Anteriores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {/* Abas de Visualização para Próximos */}
          <Tabs value={activeViewTab} onValueChange={handleViewTabChange} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list" className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                Lista
              </TabsTrigger>
              <TabsTrigger value="agenda" className="flex items-center gap-2">
                <Grid3X3 className="w-4 h-4" />
                Agenda
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="mt-6">
          {/* Lista de Agendamentos */}
          {loading ? (
            <div className="text-center py-8">
              <p>Carregando agendamentos...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {appointments.length === 0 
                    ? 'Nenhum agendamento encontrado. Crie seu primeiro agendamento!' 
                    : 'Nenhum agendamento encontrado com os filtros aplicados.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredAppointments.map((appointment) => {
                const { date, time } = formatDateTime(appointment.appointment_date)
                
                return (
                  <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{appointment.patient.name}</span>
                            </div>
                            {appointment.patient.phone && (
                          <p className="text-sm text-muted-foreground">{appointment.patient.phone}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{appointment.procedure.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          R$ {appointment.total_price?.toFixed(2) || appointment.procedure.price.toFixed(2)}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                          <span>{date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{time}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {getStatusBadge(appointment.status)}
                        {appointment.notes && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {appointment.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4 justify-end">
                      {/* Botões secundários (Editar e Excluir) */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(appointment)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(appointment)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      
                      {/* Botão Concluir - apenas para agendamentos não concluídos e não cancelados */}
                      {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleCompleteAppointment(appointment)}
                          disabled={completingAppointment === appointment.id}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {completingAppointment === appointment.id ? (
                            <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                      
                      {/* Botão Lançar no Caixa - apenas para agendamentos concluídos não lançados */}
                      {appointment.status === 'completed' && !launchedAppointments.has(appointment.id) && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleLaunchToCashFlow(appointment)}
                          disabled={launchingAppointment === appointment.id}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {launchingAppointment === appointment.id ? (
                            <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <Banknote className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
            </TabsContent>

            <TabsContent value="agenda" className="mt-6">
              <AgendaView />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {/* Lista de Agendamentos Anteriores - Sem abas, apenas lista */}
          {loading ? (
            <div className="text-center py-8">
              <p>Carregando agendamentos...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {pastAppointments.length === 0 
                    ? 'Nenhum agendamento anterior encontrado.' 
                    : 'Nenhum agendamento encontrado com os filtros aplicados.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredAppointments.map((appointment) => {
                const { date, time } = formatDateTime(appointment.appointment_date)
                
                return (
                  <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{appointment.patient.name}</span>
                            </div>
                            {appointment.patient.phone && (
                              <p className="text-sm text-muted-foreground">{appointment.patient.phone}</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{appointment.procedure.name}</span>
                            </div>
                            {appointment.duration_minutes && (
                              <p className="text-sm text-muted-foreground">
                                Duração: {appointment.duration_minutes} min
                              </p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{time}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {getStatusBadge(appointment.status)}
                            {appointment.notes && (
                              <p className="text-sm text-muted-foreground line-clamp-2">{appointment.notes}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(appointment)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(appointment)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          
                          {/* Botão Concluir - apenas para agendamentos não concluídos */}
                          {appointment.status !== 'completed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCompleteAppointment(appointment)}
                              disabled={completingAppointment === appointment.id}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              {completingAppointment === appointment.id ? (
                                <div className="w-4 h-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                          
                          {/* Botão Lançar no Caixa - apenas para agendamentos concluídos não lançados */}
                          {appointment.status === 'completed' && !launchedAppointments.has(appointment.id) && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleLaunchToCashFlow(appointment)}
                              disabled={launchingAppointment === appointment.id}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {launchingAppointment === appointment.id ? (
                                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              ) : (
                                <Banknote className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {showDialog && (
        <AppointmentDialog
          appointment={editingAppointment}
          onClose={() => setShowDialog(false)}
          onSave={handleSave}
        />
      )}

      <ConfirmationAlert
        isOpen={deleteConfirmationOpen}
        title="Confirmar exclusão"
        description={`Tem certeza que deseja excluir o agendamento do paciente "${appointmentToDelete?.patient.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        variant="destructive"
      />

      <ConfirmationAlert
        isOpen={completeConfirmationOpen}
        title="Marcar como concluído"
        description={`Tem certeza que deseja marcar o agendamento do paciente "${appointmentToComplete?.patient.name}" como concluído?`}
        onConfirm={confirmCompleteAppointment}
        onCancel={cancelCompleteAppointment}
        confirmText="Concluir"
        variant="default"
      />

      <ConfirmationAlert
        isOpen={launchConfirmationOpen}
        title="Lançar no Fluxo de Caixa"
        description={`Tem certeza que deseja lançar o agendamento do paciente "${appointmentToLaunch?.patient.name}" no fluxo de caixa?`}
        onConfirm={confirmLaunchToCashFlow}
        onCancel={cancelLaunchToCashFlow}
        confirmText="Lançar"
        variant="default"
      />
    </div>
  )
}