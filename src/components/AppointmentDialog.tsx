import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format, addMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { DateTimePicker } from './ui/datetime-picker'

import { useAuth } from '../contexts/AuthContext'
import { appointmentsService } from '../services/appointmentsService'
import { patientsService } from '../services/patientsService'
import { ProceduresService } from '../services/proceduresService'
import type { Patient, Procedure, Appointment } from '../types/database'

const appointmentSchema = z.object({
  patient_id: z.string().min(1, 'Selecione um paciente'),
  procedure_id: z.string().min(1, 'Selecione um procedimento'),
  appointment_date: z.date({
    message: 'Selecione uma data e hora',
  }),
  notes: z.string().optional(),
})

type AppointmentFormData = z.infer<typeof appointmentSchema>

interface AppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment?: Appointment | null
  onSave?: () => void
}

export function AppointmentDialog({
  open,
  onOpenChange,
  appointment,
  onSave,
}: AppointmentDialogProps) {
  const { user } = useAuth()
  const [patients, setPatients] = useState<Patient[]>([])
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [endTime, setEndTime] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patient_id: appointment?.patient_id || '',
      procedure_id: appointment?.procedure_id || '',
      appointment_date: appointment ? new Date(appointment.appointment_date) : undefined,
      notes: appointment?.notes || '',
    },
  })

  const watchedValues = form.watch(['procedure_id', 'appointment_date'])

  // Carregar pacientes e procedimentos
  useEffect(() => {
    if (open && user) {
      loadData()
    }
  }, [open, user])

  // Calcular end_time automaticamente
  useEffect(() => {
    const [procedureId, appointmentDate] = watchedValues
    
    if (procedureId && appointmentDate && procedures.length > 0) {
      const selectedProcedure = procedures.find(p => p.id === procedureId)
      if (selectedProcedure) {
        const calculatedEndTime = addMinutes(appointmentDate, selectedProcedure.duration_minutes)
        setEndTime(calculatedEndTime)
      } else {
        setEndTime(null)
      }
    } else {
      setEndTime(null)
    }
  }, [watchedValues[0], watchedValues[1], procedures.length])

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (appointment) {
        form.reset({
          patient_id: appointment.patient_id,
          procedure_id: appointment.procedure_id,
          appointment_date: new Date(appointment.appointment_date),
          notes: appointment.notes || '',
        })
      } else {
        form.reset({
          patient_id: '',
          procedure_id: '',
          appointment_date: undefined,
          notes: '',
        })
      }
      setEndTime(null)
    }
  }, [open, appointment, form])

  const loadData = async () => {
    if (!user) return

    try {
      const [patientsData, proceduresData] = await Promise.all([
        patientsService.getPatients(),
        ProceduresService.getAll(),
      ])
      setPatients(patientsData)
      setProcedures(proceduresData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  const onSubmit = async (data: AppointmentFormData) => {
    if (!user || !endTime) return

    setIsLoading(true)
    try {
      const selectedProcedure = procedures.find(p => p.id === data.procedure_id)
      if (!selectedProcedure) throw new Error('Procedimento não encontrado')

      const appointmentData = {
        user_id: user.id,
        patient_id: data.patient_id,
        procedure_id: data.procedure_id,
        appointment_date: data.appointment_date.toISOString(),
        duration_minutes: selectedProcedure.duration_minutes,
        total_price: selectedProcedure.price,
        notes: data.notes,
        status: 'scheduled' as const,
        is_active: true,
      }

      if (appointment) {
        await appointmentsService.update(appointment.id, appointmentData)
      } else {
        await appointmentsService.create(appointmentData)
      }

      onOpenChange(false)
        onSave?.()
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {appointment ? 'Editar Agendamento' : 'Novo Agendamento'}
          </DialogTitle>
          <DialogDescription>
            {appointment
              ? 'Edite as informações do agendamento.'
              : 'Preencha os dados para criar um novo agendamento.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="patient_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paciente *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um paciente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="procedure_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Procedimento *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um procedimento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {procedures.map((procedure) => (
                          <SelectItem key={procedure.id} value={procedure.id}>
                            {procedure.name} - {procedure.duration_minutes}min - R$ {procedure.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="appointment_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data e Hora de Início *</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        date={field.value}
                        onDateChange={field.onChange}
                        placeholder="Selecione data e hora"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Hora de Término</FormLabel>
                <FormControl>
                  <Input
                    value={endTime ? format(endTime, "PPP 'às' HH:mm", { locale: ptBR }) : ''}
                    disabled
                    placeholder="Será calculado automaticamente"
                  />
                </FormControl>
              </FormItem>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Observações sobre o agendamento..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : appointment ? 'Atualizar' : 'Criar Agendamento'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}