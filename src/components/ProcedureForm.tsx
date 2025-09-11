import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { ProceduresService } from '../services/proceduresService'
import type { Procedure, ProcedureInsert, ProcedureUpdate } from '../types/database'

interface ProcedureFormProps {
  procedure?: Procedure | null
  onClose: () => void
}

export function ProcedureForm({ procedure, onClose }: ProcedureFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: 60,
    price: 0,
    category: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (procedure) {
      setFormData({
        name: procedure.name,
        description: procedure.description || '',
        duration_minutes: procedure.duration_minutes,
        price: procedure.price,
        category: procedure.category || ''
      })
    }
  }, [procedure])

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
          category: formData.category || undefined
        }
        await ProceduresService.update(procedure.id, updateData)
      } else {
        // Criar novo procedimento
        const insertData: Omit<ProcedureInsert, 'user_id'> = {
          name: formData.name,
          description: formData.description || undefined,
          duration_minutes: formData.duration_minutes,
          price: formData.price,
          category: formData.category || undefined
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
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descreva o procedimento..."
                className="w-full px-3 py-2 border rounded-md resize-none h-20"
              />
            </div>

            <div>
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                placeholder="Ex: Facial, Corporal"
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