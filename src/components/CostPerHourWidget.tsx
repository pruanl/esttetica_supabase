import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { DollarSign, TrendingUp, Clock } from 'lucide-react';
import { businessSettingsService } from '@/services/businessSettingsService';
import { expensesService } from '@/services/expensesService';
import type { FixedExpense } from '@/types/database';

interface CostCalculation {
  totalMonthlyHours: number;
  totalMonthlyExpenses: number;
  costPerHour: number;
}

export function CostPerHourWidget() {
  const [calculation, setCalculation] = useState<CostCalculation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar configurações financeiras
      const settings = await businessSettingsService.getSettings();
      if (!settings) {
        setError('Configure suas horas de trabalho primeiro');
        return;
      }

      // Buscar despesas fixas
      const expenses = await expensesService.getAll();

      // Calcular totais
      const totalMonthlyHours = settings.work_hours_per_day * settings.work_days_per_week * 4.33;
      const totalMonthlyExpenses = expenses.reduce((sum: number, expense: FixedExpense) => sum + expense.amount, 0);
      const costPerHour = totalMonthlyHours > 0 ? totalMonthlyExpenses / totalMonthlyHours : 0;

      setCalculation({
        totalMonthlyHours,
        totalMonthlyExpenses,
        costPerHour
      });
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sua Saúde Financeira</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sua Saúde Financeira</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-600">{error}</div>
          <button 
            onClick={loadData}
            className="mt-2 text-xs text-blue-600 hover:underline"
          >
            Tentar novamente
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!calculation) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Sua Saúde Financeira</CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Total de Despesas Mensais */}
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-red-500 dark:text-red-400" />
            <div>
              <p className="text-xs text-muted-foreground">Total de Despesas Mensais</p>
              <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                {formatCurrency(calculation.totalMonthlyExpenses)}
              </p>
            </div>
          </div>

          {/* Horas Mensais */}
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            <div>
              <p className="text-xs text-muted-foreground">Horas de Trabalho Mensais</p>
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {formatHours(calculation.totalMonthlyHours)}
              </p>
            </div>
          </div>

          {/* Custo por Hora - Destaque */}
          <div className="border-t pt-4">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Custo da Sua Hora de Trabalho
              </p>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(calculation.costPerHour)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Este é o valor mínimo que você precisa cobrar por hora para cobrir suas despesas
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}