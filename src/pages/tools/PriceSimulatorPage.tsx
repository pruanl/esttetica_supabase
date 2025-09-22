import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { businessSettingsService } from '@/services/businessSettingsService'
import { expensesService } from '@/services/expensesService'
import type { FixedExpense } from '@/types/database'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { UpgradePrompt } from '@/components/UpgradePrompt'

interface Material {
  id: string
  name: string
  cost: number
}

const PriceSimulatorPage: React.FC = () => {
  const { isActive, isPremium } = useSubscription()
  
  // Estados para dados carregados
  const [costPerHour, setCostPerHour] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  // Estados para inputs do usuário
  const [serviceMinutes, setServiceMinutes] = useState<number>(0)
  const [materials, setMaterials] = useState<Material[]>([])
  const [profitMargin, setProfitMargin] = useState<number>(30) // Percentual

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      
      // Buscar configurações de negócio
      const businessSettings = await businessSettingsService.getSettings()
      if (businessSettings?.desired_profit_margin) {
        const marginPercent = businessSettings.desired_profit_margin * 100
        setProfitMargin(marginPercent)
      }

      // Calcular custo por hora (mesma lógica do CostPerHourWidget)
      const expenses = await expensesService.getAll()
      const totalMonthlyExpenses = expenses.reduce((sum: number, expense: FixedExpense) => sum + expense.amount, 0)
      
      if (businessSettings) {
        const totalWeeklyHours = businessSettings.work_days_per_week * businessSettings.work_hours_per_day
        const totalMonthlyHours = totalWeeklyHours * 4.33 // Média de semanas por mês
        
        if (totalMonthlyHours > 0) {
          const calculatedCostPerHour = totalMonthlyExpenses / totalMonthlyHours
          setCostPerHour(calculatedCostPerHour)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error)
    } finally {
      setLoading(false)
    }
  }

  // Funções para gerenciar materiais
  const addMaterial = () => {
    const newMaterial: Material = {
      id: Date.now().toString(),
      name: '',
      cost: 0
    }
    setMaterials([...materials, newMaterial])
  }

  const removeMaterial = (id: string) => {
    setMaterials(materials.filter(material => material.id !== id))
  }

  const updateMaterial = (id: string, field: keyof Material, value: string | number) => {
    setMaterials(materials.map(material => 
      material.id === id ? { ...material, [field]: value } : material
    ))
  }

  // Cálculos em tempo real
  const calculations = useMemo(() => {
    const laborCost = (costPerHour / 60) * serviceMinutes
    const totalMaterialsCost = materials.reduce((sum, material) => sum + material.cost, 0)
    const minimumPrice = laborCost + totalMaterialsCost
    const profitValue = minimumPrice * (profitMargin / 100)
    const suggestedPrice = minimumPrice + profitValue

    return {
      laborCost,
      totalMaterialsCost,
      minimumPrice,
      profitValue,
      suggestedPrice
    }
  }, [costPerHour, serviceMinutes, materials, profitMargin])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Carregando dados...</div>
      </div>
    )
  }

  // Feature Gating - Verificar se tem assinatura ativa
  if (!isActive) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calculator className="h-8 w-8" />
            Simulador de Preços
          </h1>
          <p className="text-muted-foreground mt-2">
            Calcule o preço ideal para seus serviços em tempo real
          </p>
        </div>
        <UpgradePrompt 
          feature="Simulador de Preços"
          description="Calcule o preço ideal para seus serviços com base nos seus custos operacionais e margem de lucro desejada."
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Calculator className="h-8 w-8" />
          Simulador de Preços
        </h1>
        <p className="text-muted-foreground mt-2">
          Calcule o preço ideal para seus serviços em tempo real
        </p>
        {costPerHour > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            Custo/Hora atual: R$ {costPerHour.toFixed(2)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna de Inputs */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Serviço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="minutes">Tempo Estimado do Serviço (em minutos)</Label>
                <Input
                  id="minutes"
                  type="number"
                  min="0"
                  value={serviceMinutes}
                  onChange={(e) => setServiceMinutes(parseInt(e.target.value) || 0)}
                  placeholder="Ex: 60"
                />
              </div>

              <div>
                <Label htmlFor="profit-margin">Margem de Lucro Desejada (%)</Label>
                <Input
                  id="profit-margin"
                  type="number"
                  min="0"
                  step="0.1"
                  value={profitMargin}
                  onChange={(e) => setProfitMargin(parseFloat(e.target.value) || 0)}
                  placeholder="Ex: 30"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Materiais e Custos</CardTitle>
              <CardDescription>
                Adicione todos os materiais que serão utilizados no serviço
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {materials.map((material) => (
                  <div key={material.id} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label className="text-xs">Nome do Produto</Label>
                      <Input
                        value={material.name}
                        onChange={(e) => updateMaterial(material.id, 'name', e.target.value)}
                        placeholder="Ex: Creme hidratante"
                      />
                    </div>
                    <div className="w-32">
                      <Label className="text-xs">Custo (R$)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={material.cost}
                        onChange={(e) => updateMaterial(material.id, 'cost', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeMaterial(material.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  onClick={addMaterial}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Material
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna de Resultados */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custo do Tempo de Trabalho</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                R$ {calculations.laborCost.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">
                {serviceMinutes} minutos × R$ {(costPerHour / 60).toFixed(2)}/min
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custo Total de Materiais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                R$ {calculations.totalMaterialsCost.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">
                {materials.length} {materials.length === 1 ? 'item' : 'itens'} adicionados
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-yellow-200">
            <CardHeader>
              <CardTitle className="text-yellow-700">Preço Mínimo (Lucro Zero)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-700">
                R$ {calculations.minimumPrice.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">
                Tempo + Materiais
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Valor do Lucro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {calculations.profitValue.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">
                {profitMargin}% sobre o preço mínimo
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-700">Preço de Venda Sugerido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-700">
                R$ {calculations.suggestedPrice.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">
                Preço final recomendado
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default PriceSimulatorPage