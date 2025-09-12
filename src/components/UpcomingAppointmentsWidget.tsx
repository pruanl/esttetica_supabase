import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { appointmentsService } from '@/services/appointmentsService';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock } from 'lucide-react';

// Tipo local baseado na estrutura retornada pelo appointmentsService
interface AppointmentWithDetails {
  id: string;
  appointment_date: string;
  patient: {
    name: string;
  };
  procedure: {
    name: string;
  };
}

interface UpcomingAppointment {
  id: string;
  patient_name: string;
  appointment_date: string;
  procedure_name: string;
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
      const appointments = await appointmentsService.getAll(user.id);
      
      // Filtrar apenas agendamentos futuros e ativos
      const now = new Date();
      const futureAppointments = appointments
        .filter((appointment: AppointmentWithDetails) => {
          const appointmentDateTime = new Date(appointment.appointment_date);
          return appointmentDateTime > now;
        })
        .sort((a: AppointmentWithDetails, b: AppointmentWithDetails) => {
          const dateA = new Date(a.appointment_date);
          const dateB = new Date(b.appointment_date);
          return dateA.getTime() - dateB.getTime();
        })
        .slice(0, 5) // Pegar apenas os próximos 5
        .map((appointment: AppointmentWithDetails) => ({
          id: appointment.id,
          patient_name: appointment.patient?.name || 'Paciente não informado',
          appointment_date: appointment.appointment_date,
          procedure_name: appointment.procedure?.name || 'Procedimento não informado'
        }));
      
      setUpcomingAppointments(futureAppointments);
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
            <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Nenhum agendamento próximo</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingAppointments.map((appointment) => {
              const { date, time } = formatDateTime(appointment.appointment_date);
              return (
                <div key={appointment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{appointment.patient_name}</p>
                    <p className="text-xs text-gray-600">{appointment.procedure_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{date}</p>
                    <p className="text-xs text-gray-600">{time}</p>
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