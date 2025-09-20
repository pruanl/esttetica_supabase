import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock, MessageCircle, Star } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

// Tipo local baseado na estrutura retornada pelo appointmentsService
interface UpcomingAppointment {
  id: string;
  patient_id: string;
  patient_name: string;
  appointment_date: string;
  procedure_name: string;
  reminder_sent: boolean;
  is_first_appointment: boolean;
}

const UpcomingAppointmentsWidget: React.FC = () => {
  const { user } = useAuth();
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUpcomingAppointments();
  }, []);

  const fetchUpcomingAppointments = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Buscar agendamentos com informações de lembrete
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          reminder_sent,
          patient_id,
          patient:patients(name),
          procedure:procedures(name)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('appointment_date', { ascending: true });

      if (error) {
        throw error;
      }
      
      // Filtrar apenas agendamentos futuros
      const now = new Date();
      const futureAppointments = (appointments || [])
        .filter((appointment: any) => {
          const appointmentDateTime = new Date(appointment.appointment_date);
          return appointmentDateTime > now;
        })
        .slice(0, 5); // Pegar apenas os próximos 5

      // Verificar se é o primeiro agendamento para cada paciente
      const appointmentsWithFirstCheck = await Promise.all(
        futureAppointments.map(async (appointment: any) => {
          // Buscar agendamentos anteriores do mesmo paciente
          const { data: previousAppointments } = await supabase
            .from('appointments')
            .select('id')
            .eq('patient_id', appointment.patient_id)
            .eq('user_id', user.id)
            .eq('is_active', true)
            .lt('appointment_date', appointment.appointment_date);

          const isFirstAppointment = !previousAppointments || previousAppointments.length === 0;

          return {
            id: appointment.id,
            patient_id: appointment.patient_id,
            patient_name: appointment.patient?.name || 'Paciente não informado',
            appointment_date: appointment.appointment_date,
            procedure_name: appointment.procedure?.name || 'Procedimento não informado',
            reminder_sent: appointment.reminder_sent || false,
            is_first_appointment: isFirstAppointment
          };
        })
      );
      
      setUpcomingAppointments(appointmentsWithFirstCheck);
    } catch (err) {
      console.error('Erro ao buscar próximos agendamentos:', err);
      setError('Erro ao carregar próximos agendamentos');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
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

  if (loading) {
    return (
      <Card className="h-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Próximos Agendamentos
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
      <Card className="h-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Próximos Agendamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <p className="text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Próximos Agendamentos
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {upcomingAppointments.length === 0 ? (
          <div className="text-center py-4">
            <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum agendamento próximo</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingAppointments.map((appointment) => {
              const { date, time } = formatDateTime(appointment.appointment_date);
              const isTodayAppointment = isToday(appointment.appointment_date);
              
              return (
                <div 
                  key={appointment.id} 
                  className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                    isTodayAppointment 
                      ? 'bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 shadow-sm' 
                      : 'bg-muted/50'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium text-sm ${
                        isTodayAppointment ? 'text-blue-900 dark:text-blue-100' : 'text-foreground'
                      }`}>
                        {appointment.patient_name}
                      </p>
                      {/* Indicador de primeira vez */}
                      {appointment.is_first_appointment && (
                        <div title="Primeira consulta">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        </div>
                      )}
                    </div>
                    <p className={`text-xs ${
                      isTodayAppointment ? 'text-blue-700 dark:text-blue-300' : 'text-muted-foreground'
                    }`}>
                      {appointment.procedure_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Indicador de lembrete WhatsApp */}
                    <div title={appointment.reminder_sent ? 'Lembrete enviado' : 'Lembrete não enviado'}>
                      <MessageCircle 
                        className={`h-4 w-4 ${
                          appointment.reminder_sent 
                            ? 'text-green-500' 
                            : 'text-muted-foreground'
                        }`}
                      />
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        isTodayAppointment ? 'text-blue-900 dark:text-blue-100' : 'text-foreground'
                      }`}>
                        {isTodayAppointment && (
                          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        )}
                        {date}
                      </p>
                      <p className={`text-xs ${
                        isTodayAppointment ? 'text-blue-700 dark:text-blue-300' : 'text-muted-foreground'
                      }`}>
                        {time}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingAppointmentsWidget;