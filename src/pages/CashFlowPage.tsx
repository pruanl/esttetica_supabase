import { useState, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { CashFlowSummary } from '../components/CashFlowSummary';
import { TransactionFormModal } from '../components/TransactionFormModal';
import { ConfirmationAlert } from '../components/ConfirmationAlert';
import { transactionsService } from '../services/transactionsService';
import type { Transaction } from '../types/database';
import { Plus, Minus, Calendar, Edit, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { UpgradePrompt } from '@/components/UpgradePrompt';

export function CashFlowPage() {
  const { isActive } = useSubscription();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('income');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [summaryKey, setSummaryKey] = useState(0); // Para forçar re-render do CashFlowSummary
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1
    };
  });

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await transactionsService.getTransactionsByMonth(
        currentDate.year, 
        currentDate.month
      );
      setTransactions(data);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    } finally {
      setLoading(false);
    }
  }, [currentDate.year, currentDate.month]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleNewTransaction = (type: 'income' | 'expense') => {
    setModalType(type);
    setModalOpen(true);
  };

  const handleTransactionSuccess = () => {
    loadTransactions();
    setSummaryKey(prev => prev + 1); // Força re-render do CashFlowSummary
    setEditingTransaction(null); // Limpa a transação sendo editada
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setModalType(transaction.type as 'income' | 'expense');
    setModalOpen(true);
  };

  const handleDelete = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setConfirmationOpen(true);
  };

  const confirmDelete = async () => {
    if (!transactionToDelete) return;
    
    try {
      await transactionsService.deleteTransaction(transactionToDelete.id);
      handleTransactionSuccess();
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      alert('Erro ao excluir transação. Tente novamente.');
    } finally {
      setConfirmationOpen(false);
      setTransactionToDelete(null);
    }
  };

  const cancelDelete = () => {
    setConfirmationOpen(false);
    setTransactionToDelete(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      if (direction === 'next') {
        if (prev.month === 12) {
          return { year: prev.year + 1, month: 1 };
        }
        return { ...prev, month: prev.month + 1 };
      } else {
        if (prev.month === 1) {
          return { year: prev.year - 1, month: 12 };
        }
        return { ...prev, month: prev.month - 1 };
      }
    });
  };

  // Feature Gating - Verificar se tem assinatura ativa
  if (!isActive) {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Fluxo de Caixa</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Gerencie suas entradas e saídas financeiras
            </p>
          </div>
        </div>
        <UpgradePrompt 
          feature="Fluxo de Caixa"
          description="Controle completo das suas finanças com relatórios detalhados de entradas e saídas."
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Fluxo de Caixa</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gerencie suas entradas e saídas financeiras
          </p>
        </div>
        
        {/* Navegação de mês */}
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => changeMonth('prev')}
          >
            ←
          </Button>
          <div className="flex items-center space-x-2 px-3">
            <Calendar className="h-4 w-4" />
            <span className="font-medium text-sm md:text-base">
              {getMonthName(currentDate.month)} {currentDate.year}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => changeMonth('next')}
          >
            →
          </Button>
        </div>
      </div>

      {/* Resumo Financeiro */}
      <CashFlowSummary 
        key={summaryKey}
        year={currentDate.year} 
        month={currentDate.month}
        onSummaryChange={() => {}} // Podemos usar para atualizar outros componentes se necessário
      />

      {/* Botões de Ação */}
      <div className="flex flex-col space-y-3 md:flex-row md:justify-between md:space-y-0">
        <Button
          onClick={() => handleNewTransaction('expense')}
          className="bg-red-600 hover:bg-red-700 w-full md:w-auto"
        >
          <Minus className="mr-2 h-4 w-4" />
          Nova Saída
        </Button>
        <Button
          onClick={() => handleNewTransaction('income')}
          className="bg-green-600 hover:bg-green-700 w-full md:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Entrada
        </Button>
      </div>

      {/* Tabela de Transações */}
      <Card>
        <CardHeader>
          <CardTitle>Transações do Mês</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando transações...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhuma transação encontrada para este mês.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Clique em "Nova Entrada" ou "Nova Saída" para começar.
              </p>
            </div>
          ) : (
            <>
              <div className="block md:hidden space-y-3">
                {/* Layout mobile - cards */}
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(transaction.entry_date)}
                        </p>
                      </div>
                      <Badge 
                        variant={transaction.type === 'income' ? 'default' : 'destructive'}
                        className={
                          transaction.type === 'income' 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }
                      >
                        {transaction.type === 'income' ? 'Entrada' : 'Saída'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(Number(transaction.amount))}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(transaction)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(transaction)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden md:block">
                {/* Layout desktop - tabela */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {formatDate(transaction.entry_date)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {transaction.description}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={transaction.type === 'income' ? 'default' : 'destructive'}
                            className={
                              transaction.type === 'income' 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }
                          >
                            {transaction.type === 'income' ? 'Entrada' : 'Saída'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <span className={
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }>
                            {formatCurrency(Number(transaction.amount))}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(transaction)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(transaction)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Formulário */}
      <TransactionFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        type={modalType}
        onSuccess={handleTransactionSuccess}
        editingTransaction={editingTransaction}
      />

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmationAlert
        isOpen={confirmationOpen}
        title="Excluir Transação"
        description={`Tem certeza que deseja excluir a transação "${transactionToDelete?.description}"? Esta ação não pode ser desfeita.`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  );
}