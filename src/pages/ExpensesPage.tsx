import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { expensesService } from '@/services/expensesService';
import { useAuth } from '@/contexts/AuthContext';
import type { FixedExpense } from '@/types/database';

const expenseSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  category: z.string().optional()
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

const ExpensesPage: React.FC = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<FixedExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      name: '',
      amount: 0,
      category: ''
    }
  });

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await expensesService.getAll();
      setExpenses(data);
      
      // Calcular total
      const total = data.reduce((sum, expense) => sum + expense.amount, 0);
      setTotalAmount(total);
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleSubmit = async (data: ExpenseFormData) => {
    try {
      if (editingExpense) {
        await expensesService.update(editingExpense.id, data);
      } else {
        if (!user?.id) {
          console.error('Usuário não autenticado');
          return;
        }
        
        await expensesService.create({
          name: data.name,
          amount: data.amount,
          category: data.category || undefined,
          user_id: user.id
        });
      }
      
      await loadExpenses();
      setIsDialogOpen(false);
      setEditingExpense(null);
      form.reset();
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
    }
  };

  const handleEdit = (expense: FixedExpense) => {
    setEditingExpense(expense);
    form.setValue('name', expense.name);
    form.setValue('amount', expense.amount);
    form.setValue('category', expense.category || '');
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta despesa?')) {
      try {
        await expensesService.delete(id);
        await loadExpenses();
      } catch (error) {
        console.error('Erro ao excluir despesa:', error);
      }
    }
  };

  const handleNewExpense = () => {
    setEditingExpense(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando despesas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Despesas Fixas</h1>
          <p className="text-muted-foreground">
            Gerencie seus custos fixos mensais
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewExpense}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Despesa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? 'Editar Despesa' : 'Nova Despesa'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Aluguel, Internet, Luz..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria (Opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Estrutura">Estrutura</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Equipamentos">Equipamentos</SelectItem>
                          <SelectItem value="Produtos">Produtos</SelectItem>
                          <SelectItem value="Serviços">Serviços</SelectItem>
                          <SelectItem value="Outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingExpense ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Card com resumo */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total de Despesas</p>
              <p className="text-2xl font-bold">{expenses.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Valor Total Mensal</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Média por Despesa</p>
              <p className="text-2xl font-bold">
                {expenses.length > 0 ? formatCurrency(totalAmount / expenses.length) : formatCurrency(0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de despesas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Nenhuma despesa cadastrada ainda.
              </p>
              <Button onClick={handleNewExpense}>
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar primeira despesa
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.name}</TableCell>
                    <TableCell>
                      {expense.category ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {expense.category}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(expense)}
                          title="Editar despesa"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(expense.id)}
                          title="Excluir despesa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpensesPage;