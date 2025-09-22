import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Calendar, DollarSign, X, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { CancellationModal } from '@/components/CancellationModal';

interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'cancellation_requested';
  current_period_start: string;
  current_period_end: string;
  plan_type: 'monthly' | 'yearly';
  plan_name: string;
  price_id: string;
  created_at: string;
  updated_at: string;
  cancellation_requested_at?: string;
  cancellation_reason?: string;
  cancel_at_period_end?: boolean;
  canceled_at?: string;
}

export default function BillingPage() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [managingSubscription, setManagingSubscription] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadSubscriptionData();
    }
  }, [user]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading subscription:', error);
        toast.error('Erro ao carregar dados da assinatura');
        return;
      }

      if (!subscription) {
        setSubscription(null);
        return;
      }

      console.log('Subscription data loaded:', subscription);

      // Se não temos datas válidas, vamos criar datas baseadas na data de criação
      if (!subscription.current_period_end || subscription.current_period_end === '1970-01-01T00:00:00.000Z') {
        const createdAt = new Date(subscription.created_at);
        const nextBilling = new Date(createdAt);
        
        // Adicionar 1 mês para plano mensal ou 12 meses para anual
        if (subscription.plan_type === 'yearly') {
          nextBilling.setFullYear(nextBilling.getFullYear() + 1);
        } else {
          nextBilling.setMonth(nextBilling.getMonth() + 1);
        }

        // Atualizar no banco com as datas calculadas
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            current_period_start: subscription.created_at,
            current_period_end: nextBilling.toISOString()
          })
          .eq('id', subscription.id);

        if (!updateError) {
          subscription.current_period_start = subscription.created_at;
          subscription.current_period_end = nextBilling.toISOString();
        }
      }
      
      setSubscription(subscription);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      toast.error('Erro ao carregar dados da assinatura');
    } finally {
      setLoading(false);
    }
  };

  // Função para verificar se a assinatura está dentro dos 14 dias
  const isWithin14Days = (createdAt: string): boolean => {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays <= 14;
  };

  const handleManageSubscription = async () => {
    if (!subscription) {
      toast.error('Nenhuma assinatura ativa encontrada');
      return;
    }

    try {
      setManagingSubscription(true);
      
      // Get current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast.error('Você precisa estar logado para gerenciar a assinatura');
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('create-billing-portal-session', {
        body: {
          return_url: window.location.origin + '/profile/billing'
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error creating billing portal session:', error);
        toast.error('Erro ao abrir portal de faturamento');
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error('URL do portal não encontrada');
      }
    } catch (error) {
      console.error('Error managing subscription:', error);
      toast.error('Erro ao gerenciar assinatura');
    } finally {
      setManagingSubscription(false);
    }
  };

  const getCancellationDeadline = () => {
    if (!subscription?.current_period_end) return null;
    
    const periodEnd = new Date(subscription.current_period_end);
    const deadline = new Date(periodEnd);
    deadline.setDate(deadline.getDate() - 14);
    
    return deadline > new Date() ? deadline : null;
  };

  const getRefundDeadline = () => {
    if (!subscription?.created_at) return null;
    
    const createdAt = new Date(subscription.created_at);
    const refundDeadline = new Date(createdAt);
    refundDeadline.setDate(refundDeadline.getDate() + 14);
    
    return refundDeadline > new Date() ? refundDeadline : null;
  };

  const formatCancellationDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getPlanPrice = (planType: string) => {
    switch (planType) {
      case 'monthly':
        return 'R$ 49,00/mês';
      case 'yearly':
        return 'R$ 39,90/mês';
      default:
        return 'Consulte o valor';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Ativa</Badge>;
      case 'canceled':
        return <Badge variant="destructive">Cancelada</Badge>;
      case 'past_due':
        return <Badge variant="destructive">Em atraso</Badge>;
      case 'incomplete':
        return <Badge variant="secondary">Incompleta</Badge>;
      case 'cancellation_requested':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">Cancelamento Solicitado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPlanName = (planType: string) => {
    switch (planType) {
      case 'monthly':
        return 'Profissional';
      case 'yearly':
        return 'Profissional';
      default:
        return 'Profissional';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data não disponível';
    
    const date = new Date(dateString);
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      return 'Data inválida';
    }
    
    // Verificar se a data é a época Unix (31/12/1969)
    if (date.getTime() === 0 || date.getFullYear() === 1969) {
      return 'Data não definida';
    }
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <CreditCard className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Faturamento</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <CreditCard className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Faturamento</h1>
      </div>

      {subscription ? (
        <div className="grid gap-6">
          {/* Status da Assinatura */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Status da Assinatura</span>
                {getStatusBadge(subscription.status)}
              </CardTitle>
              <CardDescription>
                Informações sobre sua assinatura atual
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Plano Atual</label>
                  <p className="text-lg font-semibold">{subscription.plan_name || getPlanName(subscription.plan_type)}</p>
                  <p className="text-sm text-muted-foreground">{getPlanPrice(subscription.plan_type)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Próxima Cobrança</label>
                  <p className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(subscription.current_period_end)}
                  </p>
                </div>
              </div>
              
              {/* Aviso de Reembolso (primeiros 14 dias) */}
              {subscription.status === 'active' && getRefundDeadline() && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-800 mb-2">Período de Reembolso</h4>
                      <p className="text-sm text-green-700 mb-3">
                        Você pode cancelar sua assinatura com <strong>reembolso total</strong> até{' '}
                        <strong>{formatCancellationDate(getRefundDeadline()!)}</strong>
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-green-700 border-green-300 hover:bg-green-100"
                        onClick={() => setShowCancelModal(true)}
                      >
                        Cancelar com Reembolso
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Aviso de Cancelamento Solicitado */}
              {subscription.status === 'cancellation_requested' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-amber-800 mb-2">Cancelamento Agendado</h4>
                      <p className="text-sm text-amber-700 mb-3">
                        {subscription.cancel_at_period_end ? (
                          <>
                            Sua assinatura será cancelada automaticamente no final do período atual em{' '}
                            <strong>{formatDate(subscription.current_period_end)}</strong>.
                            {subscription.cancellation_requested_at && (
                              <span className="block mt-1">
                                Cancelamento solicitado em: {formatDate(subscription.cancellation_requested_at)}
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            Sua assinatura foi marcada para cancelamento e será processada em breve.
                            {subscription.cancellation_requested_at && (
                              <span className="block mt-1">
                                Solicitado em: {formatDate(subscription.cancellation_requested_at)}
                              </span>
                            )}
                          </>
                        )}
                      </p>
                      <p className="text-sm text-amber-600 mb-3">
                        {subscription.cancel_at_period_end 
                          ? "Você continuará tendo acesso a todas as funcionalidades premium até o final do período de cobrança."
                          : "Durante este período, você ainda tem acesso a todas as funcionalidades premium."
                        }
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-amber-700 border-amber-300 hover:bg-amber-100"
                        onClick={handleManageSubscription}
                      >
                        Gerenciar no Stripe
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Aviso de Assinatura Cancelada */}
              {subscription.status === 'canceled' && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <X className="h-5 w-5 text-gray-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 mb-2">Assinatura Cancelada</h4>
                      <p className="text-sm text-gray-700 mb-3">
                        Sua assinatura foi cancelada{subscription.canceled_at && (
                          <span> em {formatDate(subscription.canceled_at)}</span>
                        )}.
                      </p>
                      <p className="text-sm text-gray-600 mb-3">
                        Você não tem mais acesso às funcionalidades premium. Para reativar, assine novamente.
                      </p>
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => window.location.href = '/subscription'}
                      >
                        Assinar Novamente
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t">
                <Button 
                  onClick={handleManageSubscription}
                  disabled={managingSubscription}
                  className="w-full sm:w-auto"
                >
                  {managingSubscription && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Gerenciar Assinatura
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Cancelar seu plano, atualize o método de pagamento ou visualize faturas
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Histórico de Pagamentos */}
          {/* <Card>
            <CardHeader>
              <CardTitle>Histórico de Pagamentos</CardTitle>
              <CardDescription>
                Visualize e baixe suas faturas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                onClick={handleManageSubscription}
                disabled={managingSubscription}
                className="w-full sm:w-auto"
              >
                {managingSubscription && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Ver Histórico Completo
              </Button>
            </CardContent>
          </Card> */}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Nenhuma Assinatura Ativa
            </CardTitle>
            <CardDescription>
              Você não possui uma assinatura ativa no momento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Para acessar todas as funcionalidades premium, assine um de nossos planos.
            </p>
            <Button asChild>
              <a href="/subscribe">
                Ver Planos Disponíveis
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal de Cancelamento */}
       {subscription && (
         <CancellationModal
           isOpen={showCancelModal}
           onClose={() => setShowCancelModal(false)}
           subscriptionId={subscription.id}
           isWithin14Days={isWithin14Days(subscription.created_at)}
           onCancellationRequested={() => {
             setShowCancelModal(false);
             loadSubscriptionData(); // Recarrega os dados da assinatura
           }}
         />
       )}
    </div>
  );
}