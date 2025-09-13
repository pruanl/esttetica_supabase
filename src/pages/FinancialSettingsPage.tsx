import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Loader2, Save, TrendingUp } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { businessSettingsService } from '@/services/businessSettingsService'
import type { BusinessSettingsData } from '@/services/businessSettingsService'
import type { BusinessSettings } from '@/types/database'

// Schema de validação
const formSchema = z.object({
  work_days_per_week: z.number().min(1, 'Deve ser pelo menos 1 dia').max(7, 'Não pode ser mais que 7 dias'),
  work_hours_per_day: z.number().min(0.5, 'Deve ser pelo menos 0.5 horas').max(24, 'Não pode ser mais que 24 horas'),
  desired_profit_margin: z.number().min(0, 'Não pode ser negativa').max(100, 'Não pode ser maior que 100%')
})

type FormData = z.infer<typeof formSchema>

export default function FinancialSettingsPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [existingSettings, setExistingSettings] = useState<BusinessSettings | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      work_days_per_week: 5,
      work_hours_per_day: 8,
      desired_profit_margin: 30
    }
  })

  // Carregar configurações existentes
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const settings = await businessSettingsService.getSettings()
        if (settings) {
          setExistingSettings(settings)
          form.reset({
            work_days_per_week: settings.work_days_per_week,
            work_hours_per_day: settings.work_hours_per_day,
            desired_profit_margin: (settings.desired_profit_margin || 0) * 100 // Converter para porcentagem
          })
        }
      } catch (err) {
        console.error('Erro ao carregar configurações:', err)
        setError('Erro ao carregar configurações existentes')
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  const onSubmit = async (data: FormData) => {
    setIsSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const settingsData: BusinessSettingsData = {
        work_days_per_week: data.work_days_per_week,
        work_hours_per_day: data.work_hours_per_day,
        desired_profit_margin: data.desired_profit_margin / 100 // Converter para decimal
      }

      await businessSettingsService.upsertSettings(settingsData)
      setSuccess(true)
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate('/settings')
      }, 2000)
    } catch (err) {
      console.error('Erro ao salvar configurações:', err)
      setError('Erro ao salvar configurações. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  const calculateWeeklyHours = () => {
    const days = form.watch('work_days_per_week')
    const hours = form.watch('work_hours_per_day')
    return days && hours ? (days * hours).toFixed(1) : '0'
  }

  const calculateMonthlyHours = () => {
    const weeklyHours = parseFloat(calculateWeeklyHours())
    return weeklyHours ? (weeklyHours * 4.33).toFixed(1) : '0'
  }

  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Carregando configurações...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-6 w-6" />
          <h1 className="text-xl sm:text-2xl font-bold">Configurações Financeiras</h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600">
          Configure os parâmetros do seu negócio para cálculos de preços e lucro
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 border border-red-200 bg-red-50 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 border border-green-200 bg-green-50 rounded-md">
          <p className="text-green-800">
            ✅ Configurações salvas com sucesso! Redirecionando...
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Parâmetros de Trabalho</CardTitle>
          <CardDescription>
            {existingSettings 
              ? 'Atualize suas configurações de trabalho e margem de lucro'
              : 'Configure seus parâmetros de trabalho pela primeira vez'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="work_days_per_week"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dias de trabalho por semana</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="7"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        placeholder="Ex: 5"
                        className="text-base"
                        inputMode="numeric"
                      />
                    </FormControl>
                    <FormDescription>
                      Quantos dias por semana você trabalha?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="work_hours_per_day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horas de trabalho por dia</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="24"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        placeholder="Ex: 8.5"
                        className="text-base"
                        inputMode="decimal"
                      />
                    </FormControl>
                    <FormDescription>
                      Quantas horas por dia você trabalha? (pode usar decimais como 8.5)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="desired_profit_margin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Margem de lucro desejada (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        placeholder="Ex: 30"
                        className="text-base"
                        inputMode="numeric"
                      />
                    </FormControl>
                    <FormDescription>
                      Qual margem de lucro você deseja ter sobre seus custos? (em %)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Resumo dos cálculos */}
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">📊 Resumo dos Cálculos</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Horas por semana:</strong> {calculateWeeklyHours()}h</p>
                  <p><strong>Horas por mês:</strong> {calculateMonthlyHours()}h</p>
                  <p><strong>Margem de lucro:</strong> {form.watch('desired_profit_margin') || 0}%</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 text-base"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {isMobile ? 'Salvar' : (existingSettings ? 'Atualizar Configurações' : 'Salvar Configurações')}
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/settings')}
                  disabled={isSaving}
                  className="text-base"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}