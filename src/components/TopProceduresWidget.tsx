import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { TrendingUp, Award, DollarSign } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import type { Procedure, FixedExpense, BusinessSettings } from '../types/database'
import { expensesService } from '../services/expensesService'
import { businessSettingsService } from '../services/businessSettingsService'

interface ProcedureProfit {
  procedure: Procedure
  totalRevenue: number
  totalCost: number
  totalProfit: number
  appointmentCount: number
}

export function TopProceduresWidget() {
  const { user } = useAuth()
  const [topProcedures, setTopProcedures] = useState<ProcedureProfit[]>([])
  const [loading, setLoading] = useState(true)
  const [costPerHour, setCostPerHour] = useState<number>(0)

  useEffect(() => {
    if (user) {
      loadTopProcedures()
    }
  }, [user])

  const loadCostPerHour = async () => {
    try {
      // Buscar configurações de negócio
      const settings = await businessSettingsService.getSettings()
      if (!settings) return 0

      // Buscar despesas fixas
      const expenses = await expensesService.getAll()
      const totalMonthlyExpenses = expenses.reduce((sum: number, expense: FixedExpense) => sum + expense.amount, 0)
      
      // Calcular custo por hora
      const totalWeeklyHours = settings.work_days_per_week * settings.work_hours_per_day
      const totalMonthlyHours = totalWeeklyHours * 4.33 // Média de semanas por mês
      
      const calculatedCostPerHour = totalMonthlyHours > 0 ? totalMonthlyExpenses / totalMonthlyHours : 0
      setCostPerHour(calculatedCostPerHour)
      return calculatedCostPerHour
    } catch (error) {
      console.error('Erro ao calcular custo por hora:', error)
      return 0
    }
  }

  const loadTopProcedures = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Carregar custo por hora
      const hourCost = await loadCostPerHour()

      // Obter primeiro e último dia do mês atual
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      
      const firstDayStr = firstDay.toISOString().split('T')[0]
      const lastDayStr = lastDay.toISOString().split('T')[0]

      // Buscar agendamentos completados do mês atual com detalhes do procedimento
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          id,
          total_price,
          duration_minutes,
          procedure_id,
          procedures!inner (
            id,
            name,
            price,
            cost,
            duration_minutes
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('appointment_date', firstDayStr)
        .lte('appointment_date', lastDayStr)

      if (error) {
        console.error('Erro ao buscar agendamentos:', error)
        return
      }

      if (!appointments || appointments.length === 0) {
        setTopProcedures([])
        return
      }

      // Agrupar por procedimento e calcular lucros
      const procedureMap = new Map<string, ProcedureProfit>()

      appointments.forEach((appointment: any) => {
        const procedure = appointment.procedures
        const procedureId = procedure.id

        if (!procedureMap.has(procedureId)) {
          procedureMap.set(procedureId, {
            procedure,
            totalRevenue: 0,
            totalCost: 0,
            totalProfit: 0,
            appointmentCount: 0
          })
        }

        const procedureProfit = procedureMap.get(procedureId)!
        
        // Calcular custos
        const materialCost = procedure.cost || 0
        const timeCost = (hourCost / 60) * appointment.duration_minutes
        const totalCost = materialCost + timeCost

        // Atualizar totais
        procedureProfit.totalRevenue += appointment.total_price
        procedureProfit.totalCost += totalCost
        procedureProfit.totalProfit += (appointment.total_price - totalCost)
        procedureProfit.appointmentCount += 1
      })

      // Converter para array e ordenar por lucro total (decrescente)
      const sortedProcedures = Array.from(procedureMap.values())
        .sort((a, b) => b.totalProfit - a.totalProfit)
        .slice(0, 3) // Top 3

      setTopProcedures(sortedProcedures)

    } catch (error) {
      console.error('Erro ao carregar top procedimentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Procedimentos do Mês</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    )
  }

  if (topProcedures.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Procedimentos do Mês</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Nenhum procedimento completado este mês
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Top Procedimentos do Mês</CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-4">
          Os 3 procedimentos mais rentáveis (por lucro total)
        </CardDescription>
        <div className="space-y-3">
          {topProcedures.map((item, index) => (
            <div key={item.procedure.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {index === 0 ? <Award className="h-3 w-3" /> : index + 1}
                </div>
                <div>
                  <p className="font-medium text-sm">{item.procedure.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.appointmentCount} agendamento{item.appointmentCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm text-green-600">
                  {formatCurrency(item.totalProfit)}
                </p>
                <p className="text-xs text-muted-foreground">
                  lucro total
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <DollarSign className="h-3 w-3" />
            <span>Baseado em agendamentos completados</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}