import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { transactionsService } from '../services/transactionsService';
import type { CreateTransactionData } from '../services/transactionsService';
import type { Transaction } from '../types/database';
import { Loader2, X } from 'lucide-react';

interface TransactionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'income' | 'expense';
  onSuccess?: () => void;
  editingTransaction?: Transaction | null;
}

export function TransactionFormModal({ 
  open, 
  onOpenChange, 
  type, 
  onSuccess,
  editingTransaction 
}: TransactionFormModalProps) {
  const [formData, setFormData] = useState({
    description: editingTransaction?.description || '',
    amount: editingTransaction?.amount?.toString() || '',
    entry_date: editingTransaction?.entry_date || new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Atualizar formData quando editingTransaction mudar
  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        description: editingTransaction.description || '',
        amount: editingTransaction.amount?.toString() || '',
        entry_date: editingTransaction.entry_date || new Date().toISOString().split('T')[0]
      });
    } else {
      setFormData({
        description: '',
        amount: '',
        entry_date: new Date().toISOString().split('T')[0]
      });
    }
    setErrors({}); // Limpar erros ao trocar de transação
  }, [editingTransaction]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valor deve ser maior que zero';
    }

    if (!formData.entry_date) {
      newErrors.entry_date = 'Data é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const transactionData: CreateTransactionData = {
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        type,
        entry_date: formData.entry_date
      };

      if (editingTransaction) {
        await transactionsService.updateTransaction(editingTransaction.id, transactionData);
      } else {
        await transactionsService.createTransaction(transactionData);
      }
      
      // Reset form
      setFormData({
        description: '',
        amount: '',
        entry_date: new Date().toISOString().split('T')[0]
      });
      setErrors({});
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      setErrors({ submit: 'Erro ao salvar transação. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getTitle = () => {
    if (editingTransaction) {
      return type === 'income' ? 'Editar Entrada' : 'Editar Saída';
    }
    return type === 'income' ? 'Nova Entrada' : 'Nova Saída';
  };

  const getAmountLabel = () => {
    return type === 'income' ? 'Valor da Entrada' : 'Valor da Saída';
  };

  const getDescription = () => {
    if (editingTransaction) {
      return type === 'income' ? 'Edite os dados da entrada' : 'Edite os dados da saída';
    }
    return type === 'income' ? 'Registre uma nova entrada de dinheiro' : 'Registre uma nova saída de dinheiro';
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{getTitle()}</CardTitle>
              <CardDescription>
                {getDescription()}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Ex: Aporte inicial, Compra de material..."
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('description', e.target.value)}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <Label htmlFor="amount">{getAmountLabel()}</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              value={formData.amount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('amount', e.target.value)}
              className={errors.amount ? 'border-red-500' : ''}
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount}</p>
            )}
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label htmlFor="entry_date">Data</Label>
            <Input
              id="entry_date"
              type="date"
              value={formData.entry_date}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('entry_date', e.target.value)}
              className={errors.entry_date ? 'border-red-500' : ''}
            />
            {errors.entry_date && (
              <p className="text-sm text-red-500">{errors.entry_date}</p>
            )}
          </div>

          {/* Erro geral */}
          {errors.submit && (
            <p className="text-sm text-red-500">{errors.submit}</p>
          )}

          {/* Botões */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </form>
        </CardContent>
      </Card>
    </div>
  );
}