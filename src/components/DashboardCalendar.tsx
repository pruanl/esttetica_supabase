import { useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { appointmentsService } from '../services/appointmentsService'
import { useAuth } from '../contexts/AuthContext'
import type { AppointmentWithDetails } from '../types/database'

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  backgroundColor?: string
  borderColor?: string
  textColor?: string
}

export function DashboardCalendar() {
  const { user } = useAuth()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const appointments = await appointmentsService.getAll(user.id)
      const calendarEvents = appointments.map((appointment: AppointmentWithDetails) => {
        const statusColors = {
          scheduled: { bg: '#3b82f6', border: '#2563eb', text: '#ffffff' },
          confirmed: { bg: '#10b981', border: '#059669', text: '#ffffff' },
          completed: { bg: '#6b7280', border: '#4b5563', text: '#ffffff' },
          cancelled: { bg: '#ef4444', border: '#dc2626', text: '#ffffff' }
        }
        
        const colors = statusColors[appointment.status as keyof typeof statusColors] || statusColors.scheduled
        
        // Calcular end_time baseado na appointment_date e duration_minutes
        const startDate = new Date(appointment.appointment_date)
        const endDate = new Date(startDate.getTime() + appointment.duration_minutes * 60000)
        
        return {
          id: appointment.id,
          title: `${appointment.patient.name} - ${appointment.procedure.name}`,
          start: appointment.appointment_date,
          end: endDate.toISOString(),
          backgroundColor: colors.bg,
          borderColor: colors.border,
          textColor: colors.text
        }
      })
      
      setEvents(calendarEvents)
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEventClick = (clickInfo: any) => {
    const appointment = clickInfo.event
    alert(`Agendamento: ${appointment.title}\nInício: ${new Date(appointment.start).toLocaleString('pt-BR')}\nFim: ${new Date(appointment.end).toLocaleString('pt-BR')}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Carregando calendário...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-3 md:p-6">
      <h2 className="text-lg md:text-xl font-semibold mb-4">Calendário de Agendamentos</h2>
      <div className="calendar-container overflow-x-auto">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next',
            center: 'title',
            right: 'today'
          }}
          footerToolbar={{
            left: '',
            center: '',
            right: 'dayGridMonth,timeGridWeek'
          }}
          events={events}
          eventClick={handleEventClick}
          height="auto"
          contentHeight="auto"
          aspectRatio={1.2}
          locale="pt-br"
          buttonText={{
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia'
          }}
          dayHeaderFormat={{ weekday: 'short' }}
          eventDisplay="block"
          displayEventTime={true}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }}
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }}
          allDaySlot={false}
          slotMinTime="08:00:00"
          slotMaxTime="20:00:00"
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5, 6],
            startTime: '08:00',
            endTime: '18:00'
          }}
          weekends={true}
          nowIndicator={true}
          eventMouseEnter={(info) => {
            info.el.style.cursor = 'pointer'
          }}
        />
      </div>
      
      {/* Legenda de cores */}
      <div className="mt-4 grid grid-cols-2 md:flex md:flex-wrap gap-2 md:gap-4 text-xs md:text-sm">
        <div className="flex items-center gap-1 md:gap-2">
          <div className="w-2 h-2 md:w-3 md:h-3 bg-blue-500 rounded"></div>
          <span>Agendado</span>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <div className="w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded"></div>
          <span>Confirmado</span>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <div className="w-2 h-2 md:w-3 md:h-3 bg-gray-500 rounded"></div>
          <span>Concluído</span>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <div className="w-2 h-2 md:w-3 md:h-3 bg-red-500 rounded"></div>
          <span>Cancelado</span>
        </div>
      </div>
    </div>
  )
}