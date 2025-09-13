import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { Calendar, MessageCircle, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
// import { toast } from 'sonner' // Removido temporariamente

interface ReminderAppointment {
  id: string
  appointment_date: string
  reminder_sent: boolean
  patient: {
    name: string
    phone: string
  }
  procedure: {
    name: string
  }
}

export default function RemindersPage() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<ReminderAppointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchPendingReminders()
    }
  }, [user])

  const fetchPendingReminders = async () => {
    try {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          reminder_sent,
          patient:patients(name, phone),
          procedure:procedures(name)
        `)
        .eq('user_id', user!.id)
        .eq('reminder_sent', false)
        .gte('appointment_date', today)
        .eq('is_active', true)
        .order('appointment_date', { ascending: true })

      if (error) {
        console.error('Erro ao buscar lembretes:', error)
        console.error('Erro ao carregar lembretes pendentes')
        return
      }

      setAppointments(data || [])
    } catch (error) {
      console.error('Erro:', error)
      console.error('Erro ao carregar lembretes')
    } finally {
      setLoading(false)
    }
  }

  const markReminderAsSent = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ reminder_sent: true } as any)
        .eq('id', appointmentId)

      if (error) {
        console.error('Erro ao marcar lembrete:', error)
        console.error('Erro ao marcar lembrete como enviado')
        return
      }

      console.log('Lembrete marcado como enviado!')
      fetchPendingReminders() // Recarregar a lista
    } catch (error) {
      console.error('Erro:', error)
      console.error('Erro ao atualizar lembrete')
    }
  }

  const openWhatsApp = (phone: string, patientName: string, appointmentDate: string) => {
    const formattedDate = format(new Date(appointmentDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    const message = `Olá ${patientName}! Lembrando que você tem um agendamento marcado para ${formattedDate}. Nos vemos em breve! 😊`
    const whatsappUrl = `https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="container mx-auto p-3 sm:p-6">
        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
          <h1 className="text-xl sm:text-2xl font-bold">Central de Lembretes</h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-3 sm:p-6">
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
        <h1 className="text-xl sm:text-2xl font-bold">Central de Lembretes</h1>
      </div>

      {appointments.length === 0 ? (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-green-700">Tudo em dia!</CardTitle>
            <CardDescription>
              Nenhum lembrete pendente. Todos os seus pacientes já foram notificados.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lembretes Pendentes</CardTitle>
            <CardDescription>
              {appointments.length} {appointments.length === 1 ? 'agendamento precisa' : 'agendamentos precisam'} de lembrete
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Cards para todas as telas */}
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <Card key={appointment.id}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      {/* Informações principais */}
                      <div className="flex-1 space-y-3 sm:space-y-2">
                        {/* Data e Hora */}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium text-base">
                              {format(new Date(appointment.appointment_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(appointment.appointment_date), 'HH:mm', { locale: ptBR })}
                            </div>
                          </div>
                        </div>

                        {/* Paciente e Procedimento */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Paciente</div>
                            <div className="font-medium">{appointment.patient.name}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Procedimento</div>
                            <div className="text-sm">{appointment.procedure.name}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Telefone</div>
                            <div className="text-sm">{appointment.patient.phone || 'Não informado'}</div>
                          </div>
                        </div>
                      </div>

                      {/* Botões */}
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:min-w-fit">
                        {appointment.patient.phone && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full sm:w-auto justify-center"
                            onClick={() => openWhatsApp(
                              appointment.patient.phone,
                              appointment.patient.name,
                              appointment.appointment_date
                            )}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            <span className="sm:hidden">Enviar WhatsApp</span>
                            <span className="hidden sm:inline">WhatsApp</span>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          className="w-full sm:w-auto justify-center"
                          onClick={() => markReminderAsSent(appointment.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          <span className="sm:hidden">Marcar como Enviado</span>
                          <span className="hidden sm:inline">Marcar Enviado</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}