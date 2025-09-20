import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { Calendar, Clock, MessageCircle, Star } from 'lucide-react'

// Tipo baseado na estrutura retornada pelo supabase
interface AppointmentItem {
  id: string;
  patient_name: string;
  appointment_date: string;
  procedure_name: string;
  duration_minutes?: number;
  reminder_sent?: boolean;
  patient_id?: string;
  is_first_appointment?: boolean;
}

interface AgendaViewProps {
  className?: string
}

export default function AgendaView({ className = '' }: AgendaViewProps) {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<AppointmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentItem | null>(null)

  useEffect(() => {
    if (user) {
      fetchAppointments()
    }
  }, [user])

  const fetchAppointments = async () => {
    if (!user) return;
    
    try {
      setLoading(true)
      setError(null)
      
      // Filtrar apenas agendamentos de hoje em diante
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayISO = today.toISOString()
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          duration_minutes,
          reminder_sent,
          patient_id,
          patient:patients(name),
          procedure:procedures(name)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gte('appointment_date', todayISO)
        .order('appointment_date', { ascending: true })

      if (error) {
        console.error('Erro ao buscar agendamentos:', error)
        setError('Erro ao carregar agendamentos')
        return
      }

      const formattedAppointments: AppointmentItem[] = (data || []).map((appointment: any) => ({
        id: appointment.id,
        patient_name: appointment.patient?.name || 'Paciente não informado',
        appointment_date: appointment.appointment_date,
        procedure_name: appointment.procedure?.name || 'Procedimento não informado',
        duration_minutes: appointment.duration_minutes,
        reminder_sent: appointment.reminder_sent,
        patient_id: appointment.patient_id
      }))

      // Verificar primeiro agendamento para cada paciente
      const patientIds = [...new Set(formattedAppointments.map(app => app.patient_id).filter(Boolean))]
      
      for (const patientId of patientIds) {
        const { data: firstAppointmentData } = await supabase
          .from('appointments')
          .select('id')
          .eq('patient_id', patientId)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('appointment_date', { ascending: true })
          .limit(1)

        if (firstAppointmentData && firstAppointmentData.length > 0) {
          const firstAppointmentId = firstAppointmentData[0].id
          const appointmentIndex = formattedAppointments.findIndex(app => app.id === firstAppointmentId)
          if (appointmentIndex !== -1) {
            formattedAppointments[appointmentIndex].is_first_appointment = true
          }
        }
      }

      setAppointments(formattedAppointments)
    } catch (err) {
      console.error('Erro ao carregar agendamentos:', err)
      setError('Erro ao carregar agendamentos')
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const isToday = (dateString: string) => {
    const appointmentDate = new Date(dateString);
    const today = new Date();
    
    return appointmentDate.getDate() === today.getDate() &&
           appointmentDate.getMonth() === today.getMonth() &&
           appointmentDate.getFullYear() === today.getFullYear();
  };

  const handleAppointmentClick = (appointment: AppointmentItem) => {
    setSelectedAppointment(appointment)
    setIsAlertOpen(true)
  };

  if (loading) {
    return (
      <Card className={`h-auto ${className}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Agenda de Agendamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex items-center justify-center h-16">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`h-auto ${className}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Agenda de Agendamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <p className="text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={`h-auto ${className}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Agenda de Agendamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          {appointments.length === 0 ? (
            <div className="text-center py-4">
              <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum agendamento encontrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {appointments.map((appointment) => {
                const { date, time } = formatDateTime(appointment.appointment_date);
                const isTodayAppointment = isToday(appointment.appointment_date);
                return (
                  <div 
                    key={appointment.id} 
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      isTodayAppointment 
                        ? 'bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-950/30' 
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                    onClick={() => handleAppointmentClick(appointment)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium text-sm ${isTodayAppointment ? 'text-blue-900 dark:text-blue-100' : 'text-foreground'}`}>
                          {appointment.patient_name}
                        </p>
                        {appointment.is_first_appointment && (
                          <Star className="w-4 h-4 text-yellow-500" />
                        )}
                        <MessageCircle 
                          className={`w-4 h-4 ${
                            appointment.reminder_sent 
                              ? 'text-green-500' 
                              : 'text-muted-foreground'
                          }`} 
                        />
                      </div>
                      <p className={`text-xs ${isTodayAppointment ? 'text-blue-700 dark:text-blue-300' : 'text-muted-foreground'}`}>
                        {appointment.procedure_name}
                      </p>
                      {appointment.duration_minutes && (
                        <p className={`text-xs ${isTodayAppointment ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}>
                          Duração: {appointment.duration_minutes} min
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${isTodayAppointment ? 'text-blue-900 dark:text-blue-100' : 'text-foreground'}`}>
                        {date}
                      </p>
                      <p className={`text-xs ${isTodayAppointment ? 'text-blue-700 dark:text-blue-300' : 'text-muted-foreground'}`}>
                        {time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AlertDialog do ShadCN */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Detalhes do Agendamento</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {selectedAppointment && (
                  <>
                    <div>
                      <strong>Paciente:</strong> {selectedAppointment.patient_name}
                    </div>
                    <div>
                      <strong>Procedimento:</strong> {selectedAppointment.procedure_name}
                    </div>
                    <div>
                      <strong>Data:</strong> {formatDateTime(selectedAppointment.appointment_date).date}
                    </div>
                    <div>
                      <strong>Horário:</strong> {formatDateTime(selectedAppointment.appointment_date).time}
                    </div>
                    {selectedAppointment.duration_minutes && (
                      <div>
                        <strong>Duração:</strong> {selectedAppointment.duration_minutes} minutos
                      </div>
                    )}
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsAlertOpen(false)}>
              Fechar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}