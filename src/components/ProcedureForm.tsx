import React, { useState, useEffect } from 'react'
import { X, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ProceduresService } from '@/services/proceduresService'
import { businessSettingsService } from '@/services/businessSettingsService'
import { expensesService } from '@/services/expensesService'
import { useAuth } from '@/contexts/AuthContext'
import type { Procedure, ProcedureInsert, ProcedureUpdate, FixedExpense } from '@/types/database'

interface ProcedureFormProps {
  procedure?: Procedure | null
  onClose: () => void
}

export function ProcedureForm({ procedure, onClose }: ProcedureFormProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: 60,
    price: 0,
    cost: 0,
    material_cost: 0
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [costPerHour, setCostPerHour] = useState<number>(0)
  const [profitMargin, setProfitMargin] = useState<number>(0.3)
  const [calculatorLoading, setCalculatorLoading] = useState(false)

  useEffect(() => {
    if (procedure) {
      setFormData({
        name: procedure.name,
        description: procedure.description || '',
        duration_minutes: procedure.duration_minutes,
        price: procedure.price,
        cost: procedure.cost || 0,
        material_cost: procedure.cost || 0 // Usar o campo cost existente como material_cost
      })
    }
    loadCalculatorData()
  }, [procedure])

  const loadCalculatorData = async () => {
    try {
      setCalculatorLoading(true)
      
      // Buscar configurações financeiras
      const settings = await businessSettingsService.getSettings()
      if (settings) {
        setProfitMargin(settings.desired_profit_margin || 0)
        
        // Buscar despesas fixas
        const expenses = await expensesService.getAll()
        
        // Calcular custo por hora
        const totalMonthlyHours = settings.work_hours_per_day * settings.work_days_per_week * 4.33
        const totalMonthlyExpenses = expenses.reduce((sum: number, expense: FixedExpense) => sum + expense.amount, 0)
        const calculatedCostPerHour = totalMonthlyHours > 0 ? totalMonthlyExpenses / totalMonthlyHours : 0
        
        setCostPerHour(calculatedCostPerHour)
      }
    } catch (error) {
      console.error('Erro ao carregar dados da calculadora:', error)
    } finally {
      setCalculatorLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }

    if (formData.duration_minutes <= 0) {
      newErrors.duration_minutes = 'Duração deve ser maior que zero'
    }

    if (formData.price <= 0) {
      newErrors.price = 'Preço deve ser maior que zero'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      if (procedure) {
        // Editar procedimento existente
        const updateData: ProcedureUpdate = {
          name: formData.name,
          description: formData.description || undefined,
          duration_minutes: formData.duration_minutes,
          price: formData.price,
          cost: formData.material_cost
        }
        await ProceduresService.update(procedure.id, updateData)
      } else {
        // Criar novo procedimento
        const insertData: ProcedureInsert = {
          name: formData.name,
          description: formData.description || undefined,
          duration_minutes: formData.duration_minutes,
          price: formData.price,
          cost: formData.material_cost,
          user_id: user!.id
        }
        await ProceduresService.create(insertData)
      }
      onClose()
    } catch (error) {
      console.error('Erro ao salvar procedimento:', error)
      alert('Erro ao salvar procedimento')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>
                {procedure ? 'Editar Procedimento' : 'Novo Procedimento'}
              </CardTitle>
              <CardDescription>
                {procedure ? 'Atualize as informações do procedimento' : 'Preencha os dados do novo procedimento'}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ex: Limpeza de Pele"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descreva o procedimento..."
              />
            </div>

            <div>
              <Label htmlFor="material_cost">Custo de Material (R$)</Label>
              <Input
                id="material_cost"
                type="number"
                min="0"
                step="0.01"
                value={formData.material_cost}
                onChange={(e) => handleInputChange('material_cost', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duração (min) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.duration_minutes}
                  onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value) || 0)}
                  className={errors.duration_minutes ? 'border-red-500' : ''}
                />
                {errors.duration_minutes && (
                  <p className="text-sm text-red-500 mt-1">{errors.duration_minutes}</p>
                )}
              </div>

              <div>
                <Label htmlFor="price">Preço (R$) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  className={errors.price ? 'border-red-500' : ''}
                />
                {errors.price && (
                  <p className="text-sm text-red-500 mt-1">{errors.price}</p>
                )}
              </div>
            </div>

            {/* Calculadora de Preço Sugerido */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="calculator">
                <AccordionTrigger className="text-sm">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Calculadora de Preço Sugerido
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {calculatorLoading ? (
                    <div className="text-sm text-muted-foreground">Carregando dados...</div>
                  ) : costPerHour > 0 ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Custo do Tempo de Trabalho:</span>
                          <span className="font-medium">
                            R$ {((costPerHour / 60) * formData.duration_minutes).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Custo Total do Serviço:</span>
                          <span className="font-medium">
                            R$ {(((costPerHour / 60) * formData.duration_minutes) + formData.material_cost).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-muted-foreground">Preço de Venda Sugerido:</span>
                          <span className="font-bold text-primary">
                            R$ {(((costPerHour / 60) * formData.duration_minutes + formData.material_cost) * (1 + profitMargin)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          const suggestedPrice = ((costPerHour / 60) * formData.duration_minutes + formData.material_cost) * (1 + profitMargin)
                          handleInputChange('price', parseFloat(suggestedPrice.toFixed(2)))
                        }}
                      >
                        Usar Preço Sugerido
                      </Button>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Configure suas horas de trabalho e despesas fixas para usar a calculadora.
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Salvando...' : (procedure ? 'Atualizar' : 'Criar')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}