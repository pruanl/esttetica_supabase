import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AppointmentDialog } from '@/components/AppointmentDialog'
import { ConfirmationAlert } from '@/components/ConfirmationAlert'
import { appointmentsService } from '@/services/appointmentsService'
import { transactionsService } from '@/services/transactionsService'
import type { AppointmentWithDetails } from '@/types/database'
import { useAuth } from '@/contexts/AuthContext'
import { Pencil, Trash2, Plus, Search, Calendar as CalendarIcon, Clock, User, FileText, Filter, X, CalendarDays, Banknote, CheckCircle } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { DateRange } from 'react-day-picker'

export const Appointments: React.FC = () => {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([])
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

  useEffect(() => {
    loadAppointments()
  }, [])

  useEffect(() => {
    filterAppointments()
  }, [appointments, searchTerm, statusFilter, dateFilter, dateRange])

  const loadAppointments = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const data = await appointmentsService.getAll(user.id)
      setAppointments(data)
      
      // Verificar quais agendamentos já foram lançados no caixa
      await checkLaunchedAppointments(data)
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
    let filtered = appointments

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
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">Filtros</h2>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Busca */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Search className="w-4 h-4" />
                    Buscar
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
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
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
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

      {/* Lista de Agendamentos */}
      {loading ? (
        <div className="text-center py-8">
          <p>Carregando agendamentos...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <CalendarIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">
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
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{appointment.patient.name}</span>
                        </div>
                        {appointment.patient.phone && (
                          <p className="text-sm text-gray-600">{appointment.patient.phone}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{appointment.procedure.name}</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          R$ {appointment.total_price?.toFixed(2) || appointment.procedure.price.toFixed(2)}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-gray-500" />
                          <span>{date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span>{time}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {getStatusBadge(appointment.status)}
                        {appointment.notes && (
                          <p className="text-sm text-gray-600 line-clamp-2">
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