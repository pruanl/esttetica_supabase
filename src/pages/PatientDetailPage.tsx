import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
// Componente Table não existe, usando HTML simples
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, Phone, Mail, MapPin, FileText } from 'lucide-react'
import { patientsService } from '@/services/patientsService'
import { appointmentsService } from '@/services/appointmentsService'
import { useAuth } from '@/contexts/AuthContext'
import type { Patient, AppointmentWithDetails } from '@/types/database'

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !user) return
    loadPatientData()
  }, [id, user])

  const loadPatientData = async () => {
    if (!id || !user) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Buscar dados da paciente
      const patientData = await patientsService.getPatientById(id)
      if (!patientData) {
        setError('Paciente não encontrada')
        return
      }
      setPatient(patientData)

      // Buscar histórico de agendamentos
      const appointmentsData = await appointmentsService.getByPatientId(id, user.id)
      setAppointments(appointmentsData)
    } catch (err) {
      console.error('Erro ao carregar dados da paciente:', err)
      setError('Erro ao carregar dados da paciente')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: 'Agendado', variant: 'default' as const },
      confirmed: { label: 'Confirmado', variant: 'secondary' as const },
      completed: { label: 'Concluído', variant: 'outline' as const },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatBirthDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/patients')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">{error || 'Paciente não encontrada'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com botão voltar */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/patients')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Detalhes da Paciente</h1>
      </div>

      {/* Informações da Paciente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {patient.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patient.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{patient.phone}</span>
              </div>
            )}
            {patient.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span>{patient.email}</span>
              </div>
            )}
            {patient.birth_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>Nascimento: {formatBirthDate(patient.birth_date)}</span>
              </div>
            )}
            {patient.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>{patient.address}</span>
              </div>
            )}
          </div>
          {patient.notes && (
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Observações:</h4>
              <p className="text-gray-600">{patient.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Agendamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Agendamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhum agendamento encontrado</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Data</th>
                    <th className="text-left p-3 font-medium">Procedimento</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Anotações</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment) => (
                    <tr key={appointment.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">
                        {formatDate(appointment.appointment_date)}
                      </td>
                      <td className="p-3">{appointment.procedure?.name || 'N/A'}</td>
                      <td className="p-3">{getStatusBadge(appointment.status)}</td>
                      <td className="p-3 max-w-xs">
                        <span className="text-sm text-gray-600">
                          {appointment.notes || '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}