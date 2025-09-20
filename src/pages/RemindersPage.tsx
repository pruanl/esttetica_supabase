import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Textarea } from '../components/ui/textarea'
import { Label } from '../components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Calendar, MessageCircle, CheckCircle, Settings, History, Save } from 'lucide-react'
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

interface MessageTemplate {
  id: string
  message_template: string
  template_type: string
  is_active: boolean
}

export default function RemindersPage() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<ReminderAppointment[]>([])
  const [sentAppointments, setSentAppointments] = useState<ReminderAppointment[]>([])
  const [messageTemplate, setMessageTemplate] = useState<MessageTemplate | null>(null)
  const [customMessage, setCustomMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [activeTab, setActiveTab] = useState('pending')

  useEffect(() => {
    if (user) {
      fetchPendingReminders()
      fetchSentReminders()
      fetchMessageTemplate()
    }
  }, [user])

  const fetchMessageTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('user_id', user!.id)
        .eq('template_type', 'reminder')
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar template:', error)
        return
      }

      if (data) {
        setMessageTemplate(data)
        setCustomMessage(data.message_template)
      } else {
        // Criar template padrão se não existir
        const defaultTemplate = `Olá {nome}! 👋

Este é um lembrete do seu agendamento para amanhã, dia {data}.

Nos vemos em breve! 😊

Se precisar reagendar, entre em contato conosco.`
        
        const { data: newTemplate, error: createError } = await supabase
          .from('message_templates')
          .insert({
            user_id: user!.id,
            template_type: 'reminder',
            message_template: defaultTemplate
          })
          .select()
          .single()

        if (!createError && newTemplate) {
          setMessageTemplate(newTemplate)
          setCustomMessage(newTemplate.message_template)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar template:', error)
    }
  }

  const saveMessageTemplate = async () => {
    if (!messageTemplate || !customMessage.trim()) return

    try {
      setSavingTemplate(true)
      const { error } = await supabase
        .from('message_templates')
        .update({ message_template: customMessage.trim() })
        .eq('id', messageTemplate.id)

      if (error) {
        console.error('Erro ao salvar template:', error)
        return
      }

      setMessageTemplate({ ...messageTemplate, message_template: customMessage.trim() })
      // toast.success('Template de mensagem salvo com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar template:', error)
    } finally {
      setSavingTemplate(false)
    }
  }

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

  const fetchSentReminders = async () => {
    try {
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
        .eq('reminder_sent', true)
        .eq('is_active', true)
        .order('appointment_date', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Erro ao buscar lembretes enviados:', error)
        return
      }

      setSentAppointments(data || [])
    } catch (error) {
      console.error('Erro:', error)
    }
  }

  const openWhatsApp = (phone: string, name: string, date: string) => {
    if (!phone || !messageTemplate) return

    const formattedDate = format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    
    // Substituir placeholders na mensagem personalizada
    const personalizedMessage = messageTemplate.message_template
      .replace(/{nome}/g, name)
      .replace(/{data}/g, formattedDate)

    const encodedMessage = encodeURIComponent(personalizedMessage)
    const whatsappUrl = `https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodedMessage}`
    
    window.open(whatsappUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Central de Lembretes</h1>
        </div>
        <div className="text-center py-8">Carregando lembretes...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2">
        <Calendar className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Central de Lembretes</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Pendentes ({appointments.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Enviados ({sentAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {appointments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Tudo em dia! 🎉</h3>
                <p className="text-muted-foreground">
                  Não há lembretes pendentes para enviar no momento.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <Card key={appointment.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        {/* Data do Agendamento */}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {format(new Date(appointment.appointment_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>

                        {/* Paciente e Procedimento */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Paciente</div>
                            <div className="font-medium">{appointment.patient?.name}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Procedimento</div>
                            <div className="text-sm">{appointment.procedure?.name}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Telefone</div>
                            <div className="text-sm">{appointment.patient?.phone || 'Não informado'}</div>
                          </div>
                        </div>
                      </div>

                      {/* Botões */}
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:min-w-fit">
                        {appointment.patient?.phone && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full sm:w-auto justify-center"
                            onClick={() => openWhatsApp(
                              appointment.patient?.phone,
                              appointment.patient?.name,
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
                          variant="default"
                          className="w-full sm:w-auto justify-center"
                          onClick={() => markReminderAsSent(appointment.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          <span className="sm:hidden">Marcar como Enviado</span>
                          <span className="hidden sm:inline">Enviado</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          {sentAppointments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum lembrete enviado</h3>
                <p className="text-muted-foreground">
                  Os lembretes que você marcar como enviados aparecerão aqui.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sentAppointments.map((appointment) => (
                <Card key={appointment.id} className="opacity-75">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        {/* Data do Agendamento */}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {format(new Date(appointment.appointment_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                          <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                        </div>

                        {/* Paciente e Procedimento */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Paciente</div>
                            <div className="font-medium">{appointment.patient?.name}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Procedimento</div>
                            <div className="text-sm">{appointment.procedure?.name}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Telefone</div>
                            <div className="text-sm">{appointment.patient?.phone || 'Não informado'}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center text-sm text-green-600 font-medium">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Enviado
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Personalizar Mensagem do WhatsApp
              </CardTitle>
              <CardDescription>
                Personalize a mensagem que será enviada aos pacientes. Use {'{nome}'} para o nome do paciente e {'{data}'} para a data do agendamento.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="message-template">Template da Mensagem</Label>
                <Textarea
                  id="message-template"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Digite sua mensagem personalizada..."
                  className="min-h-[150px]"
                />
                <div className="text-sm text-muted-foreground">
                  <strong>Placeholders disponíveis:</strong>
                  <ul className="list-disc list-inside mt-1">
                    <li><code>{'{nome}'}</code> - Nome do paciente</li>
                    <li><code>{'{data}'}</code> - Data e hora do agendamento</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={saveMessageTemplate}
                  disabled={savingTemplate || !customMessage.trim()}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {savingTemplate ? 'Salvando...' : 'Salvar Template'}
                </Button>
              </div>

              {messageTemplate && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Pré-visualização:</h4>
                  <div className="text-sm whitespace-pre-wrap bg-background p-3 rounded border">
                    {customMessage
                      .replace(/{nome}/g, 'Ana Silva')
                      .replace(/{data}/g, '15/01/2024 às 14:30')}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}