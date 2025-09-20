import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { TrendingUp, Calendar, CalendarDays } from 'lucide-react'

interface FinancialMetrics {
  today: number
  week: number
  month: number
}

export const FinancialSummary: React.FC = () => {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    today: 0,
    week: 0,
    month: 0
  })
  const [loading, setLoading] = useState(true)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const fetchFinancialMetrics = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Datas para os cálculos
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0] // YYYY-MM-DD
      
      // Últimos 7 dias
      const weekAgo = new Date(today)
      weekAgo.setDate(today.getDate() - 6) // Inclui hoje
      const weekAgoStr = weekAgo.toISOString().split('T')[0]
      
      // Primeiro dia do mês atual
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const firstDayOfMonthStr = firstDayOfMonth.toISOString().split('T')[0]

      // Buscar transações de receita (income) para cada período
      const [todayResult, weekResult, monthResult] = await Promise.all([
        // Faturamento de hoje
        supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', user.id)
          .eq('type', 'income')
          .eq('entry_date', todayStr),
        
        // Faturamento da semana (últimos 7 dias)
        supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', user.id)
          .eq('type', 'income')
          .gte('entry_date', weekAgoStr)
          .lte('entry_date', todayStr),
        
        // Faturamento do mês atual
        supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', user.id)
          .eq('type', 'income')
          .gte('entry_date', firstDayOfMonthStr)
          .lte('entry_date', todayStr)
      ])

      // Calcular totais
      const todayTotal = todayResult.data?.reduce((sum, transaction) => sum + Number(transaction.amount), 0) || 0
      const weekTotal = weekResult.data?.reduce((sum, transaction) => sum + Number(transaction.amount), 0) || 0
      const monthTotal = monthResult.data?.reduce((sum, transaction) => sum + Number(transaction.amount), 0) || 0

      setMetrics({
        today: todayTotal,
        week: weekTotal,
        month: monthTotal
      })

    } catch (error) {
      console.error('Erro ao buscar métricas financeiras:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFinancialMetrics()
  }, [user])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {/* Faturamento de Hoje */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Faturamento de Hoje
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(metrics.today)}
          </div>
        </CardContent>
      </Card>

      {/* Faturamento da Semana */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Faturamento da Semana
          </CardTitle>
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(metrics.week)}
          </div>
          <p className="text-xs text-muted-foreground">
            Últimos 7 dias
          </p>
        </CardContent>
      </Card>

      {/* Faturamento do Mês */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Faturamento do Mês
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {formatCurrency(metrics.month)}
          </div>
          <p className="text-xs text-muted-foreground">
            Mês atual
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default FinancialSummary