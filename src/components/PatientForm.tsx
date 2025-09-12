import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
// Textarea component inline
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { patientsService } from '../services/patientsService';
import type { Patient } from '../types/database';

interface PatientFormProps {
  patient?: Patient;
  onSave: (patient: Patient) => void;
  onCancel: () => void;
}

export function PatientForm({ patient, onSave, onCancel }: PatientFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birth_date: '',
    address: '',
    medical_history: '',
    allergies: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name || '',
        email: patient.email || '',
        phone: patient.phone || '',
        birth_date: patient.birth_date || '',
        address: patient.address || '',
        medical_history: patient.medical_history || '',
        allergies: patient.allergies || '',
        notes: patient.notes || ''
      });
    }
  }, [patient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validação básica
      if (!formData.name.trim()) {
        throw new Error('Nome é obrigatório');
      }

      // Verificar se email já existe (se fornecido)
      if (formData.email && formData.email.trim()) {
        const emailExists = await patientsService.checkEmailExists(
          formData.email.trim(),
          patient?.id
        );
        if (emailExists) {
          throw new Error('Este email já está cadastrado para outro paciente');
        }
      }

      let savedPatient: Patient;
      
      if (patient) {
        // Atualizar paciente existente
        savedPatient = await patientsService.updatePatient(patient.id, {
          ...formData,
          name: formData.name.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          address: formData.address.trim() || undefined,
          medical_history: formData.medical_history.trim() || undefined,
          allergies: formData.allergies.trim() || undefined,
          notes: formData.notes.trim() || undefined
        });
      } else {
        // Criar novo paciente
        savedPatient = await patientsService.createPatient({
          ...formData,
          name: formData.name.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          address: formData.address.trim() || undefined,
          medical_history: formData.medical_history.trim() || undefined,
          allergies: formData.allergies.trim() || undefined,
          notes: formData.notes.trim() || undefined
        });
      }

      onSave(savedPatient);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar paciente');
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara (11) 99999-9999
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handleChange = (field: string, value: string) => {
    if (field === 'phone') {
      value = formatPhone(value);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {patient ? 'Editar Paciente' : 'Novo Paciente'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Nome completo do paciente"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_date">Data de Nascimento</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => handleChange('birth_date', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('address', e.target.value)}
              placeholder="Endereço completo"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medical_history">Histórico Médico</Label>
            <Textarea
              id="medical_history"
              value={formData.medical_history}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('medical_history', e.target.value)}
              placeholder="Histórico médico relevante, cirurgias anteriores, etc."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="allergies">Alergias</Label>
            <Textarea
              id="allergies"
              value={formData.allergies}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('allergies', e.target.value)}
              placeholder="Alergias conhecidas a medicamentos, produtos, etc."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('notes', e.target.value)}
              placeholder="Observações adicionais"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Salvando...' : 'Criar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}