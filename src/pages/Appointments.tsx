import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AppointmentDialog } from '@/components/AppointmentDialog'
import { appointmentsService } from '@/services/appointmentsService'
import type { AppointmentWithDetails } from '@/types/database'
import { useAuth } from '@/contexts/AuthContext'
import { Pencil, Trash2, Plus, Search, Calendar, Clock, User, FileText } from 'lucide-react'

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

  useEffect(() => {
    loadAppointments()
  }, [])

  useEffect(() => {
    filterAppointments()
  }, [appointments, searchTerm, statusFilter, dateFilter])

  const loadAppointments = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const data = await appointmentsService.getAll(user.id)
      setAppointments(data)
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error)
    } finally {
      setLoading(false)
    }
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

    // Filtro por data
    if (dateFilter) {
      const filterDate = new Date(dateFilter)
      filtered = filtered.filter(appointment => {
        const appointmentDate = new Date(appointment.appointment_date)
        return appointmentDate.toDateString() === filterDate.toDateString()
      })
    }

    setFilteredAppointments(filtered)
  }

  const handleEdit = (appointment: AppointmentWithDetails) => {
    setEditingAppointment(appointment)
    setShowDialog(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return
    
    try {
      await appointmentsService.delete(id)
      await loadAppointments()
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error)
    }
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
          Novo Agendamento
        </Button>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por paciente ou procedimento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
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

            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="Filtrar por data"
            />

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setDateFilter('')
              }}
            >
              Limpar Filtros
            </Button>
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
            <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
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
                          <Calendar className="w-4 h-4 text-gray-500" />
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
                        onClick={() => handleDelete(appointment.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
      
      <AppointmentDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        appointment={editingAppointment}
        onSave={handleSave}
      />
    </div>
  )
}