import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import type { Appointment, Patient, Procedure } from '../types/database'
import { appointmentsService } from '../services/appointmentsService'
import { patientsService } from '../services/patientsService'
import { ProceduresService } from '../services/proceduresService'
import { useAuth } from '../contexts/AuthContext'

interface AppointmentFormProps {
  appointment?: Appointment
  onSave: () => void
  onCancel: () => void
}

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = 'Textarea'

export const AppointmentForm: React.FC<AppointmentFormProps> = ({
  appointment,
  onSave,
  onCancel
}) => {
  const { user } = useAuth()
  const [patients, setPatients] = useState<Patient[]>([])
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    patient_id: appointment?.patient_id || '',
    procedure_id: appointment?.procedure_id || '',
    appointment_date: appointment?.appointment_date ? 
      new Date(appointment.appointment_date).toISOString().slice(0, 16) : '',
    duration_minutes: appointment?.duration_minutes || 60,
    status: appointment?.status || 'scheduled' as const,
    notes: appointment?.notes || '',
    total_price: appointment?.total_price || 0
  })

  useEffect(() => {
    loadPatients()
    loadProcedures()
  }, [])

  const loadPatients = async () => {
    if (!user) return
    try {
      const data = await patientsService.getPatients()
      setPatients(data)
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error)
    }
  }

  const loadProcedures = async () => {
    if (!user) return
    try {
      const data = await ProceduresService.getAll()
      setProcedures(data)
    } catch (error) {
      console.error('Erro ao carregar procedimentos:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const appointmentData = {
        ...formData,
        user_id: user.id,
        appointment_date: new Date(formData.appointment_date).toISOString(),
        duration_minutes: Number(formData.duration_minutes),
        total_price: Number(formData.total_price)
      }

      if (appointment) {
        await appointmentsService.update(appointment.id, appointmentData)
      } else {
        await appointmentsService.create(appointmentData)
      }

      onSave()
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Atualizar preço e duração automaticamente quando procedimento for selecionado
  useEffect(() => {
    if (formData.procedure_id) {
      const selectedProcedure = procedures.find(p => p.id === formData.procedure_id)
      if (selectedProcedure) {
        setFormData(prev => ({ 
          ...prev, 
          total_price: selectedProcedure.price,
          duration_minutes: selectedProcedure.duration_minutes
        }))
      }
    }
  }, [formData.procedure_id, procedures])

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {appointment ? 'Editar Agendamento' : 'Novo Agendamento'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patient_id">Paciente *</Label>
              <select
                id="patient_id"
                value={formData.patient_id}
                onChange={(e) => handleInputChange('patient_id', e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Selecione um paciente</option>
                {patients.map(patient => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="procedure_id">Procedimento *</Label>
              <select
                id="procedure_id"
                value={formData.procedure_id}
                onChange={(e) => handleInputChange('procedure_id', e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Selecione um procedimento</option>
                {procedures.map(procedure => (
                  <option key={procedure.id} value={procedure.id}>
                    {procedure.name} - R$ {procedure.price.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appointment_date">Data e Hora *</Label>
              <Input
                id="appointment_date"
                type="datetime-local"
                value={formData.appointment_date}
                onChange={(e) => handleInputChange('appointment_date', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_minutes">Duração (minutos) *</Label>
              <Input
                id="duration_minutes"
                type="number"
                min="15"
                step="15"
                value={formData.duration_minutes}
                onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value) || 60)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="scheduled">Agendado</option>
                <option value="confirmed">Confirmado</option>
                <option value="completed">Concluído</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_price">Valor Total (R$)</Label>
              <Input
                id="total_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.total_price}
                onChange={(e) => handleInputChange('total_price', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>



          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('notes', e.target.value)}
              placeholder="Observações sobre o agendamento..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}