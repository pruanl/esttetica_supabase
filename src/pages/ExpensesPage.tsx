import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, DollarSign, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmationAlert } from '@/components/ConfirmationAlert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
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
  const isMobile = useIsMobile();
  const [expenses, setExpenses] = useState<FixedExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<FixedExpense | null>(null);

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      name: '',
      amount: 0,
      category: ''
    }
  });

  useEffect(() => {
    if (user) {
      loadExpenses();
    }
  }, [user]);

  useEffect(() => {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    setTotalAmount(total);
  }, [expenses]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await expensesService.getAll();
      setExpenses(data);
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
    } finally {
      setLoading(false);
    }
  };

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
          ...data,
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
    form.reset({
      name: expense.name,
      amount: expense.amount,
      category: expense.category || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (expense: FixedExpense) => {
    setExpenseToDelete(expense);
    setConfirmationOpen(true);
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;
    
    try {
      await expensesService.delete(expenseToDelete.id);
      await loadExpenses();
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
    } finally {
      setConfirmationOpen(false);
      setExpenseToDelete(null);
    }
  };

  const cancelDelete = () => {
    setConfirmationOpen(false);
    setExpenseToDelete(null);
  };

  const handleNewExpense = () => {
    setEditingExpense(null);
    form.reset({
      name: '',
      amount: 0,
      category: ''
    });
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
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <DollarSign className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Despesas Fixas</h1>
        </div>
        <Button onClick={handleNewExpense}>
          <Plus className="mr-2 h-4 w-4" />
          {isMobile ? 'Nova' : 'Nova Despesa'}
        </Button>
      </div>

      {/* Modal */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg font-semibold">
                  {editingExpense ? 'Editar Despesa' : 'Nova Despesa'}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {editingExpense ? 'Atualize as informações da despesa' : 'Adicione uma nova despesa fixa'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDialogOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>
      )}

      {/* Card com resumo */}
      <Card className="mb-6">
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
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                Nenhuma despesa cadastrada ainda.
              </p>
              <Button onClick={handleNewExpense}>
                <Plus className="mr-2 h-4 w-4" />
                {isMobile ? 'Nova' : 'Cadastrar primeira despesa'}
              </Button>
            </div>
          ) : isMobile ? (
            <div className="grid gap-4">
              {expenses.map((expense) => (
                <Card key={expense.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{expense.name}</h3>
                        {expense.category && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                            {expense.category}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
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
                          onClick={() => handleDelete(expense)}
                          title="Excluir despesa"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(expense.amount)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
                      {expense.category && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {expense.category}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium text-red-600">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
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
                          onClick={() => handleDelete(expense)}
                          title="Excluir despesa"
                          className="text-red-600 hover:text-red-700"
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

      <ConfirmationAlert
        isOpen={confirmationOpen}
        title="Confirmar exclusão"
        description={`Tem certeza que deseja excluir a despesa "${expenseToDelete?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        variant="destructive"
      />
    </div>
  );
};

export default ExpensesPage;