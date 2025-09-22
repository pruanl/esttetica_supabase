import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SystemBlockerProps {
  isBlocked: boolean;
  cancellationRequestedAt: string;
  onCancellationWithdrawn: () => void;
}

export function SystemBlocker({ 
  isBlocked, 
  cancellationRequestedAt, 
  onCancellationWithdrawn 
}: SystemBlockerProps) {
  const { user } = useAuth();

  const handleWithdrawCancellation = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          cancellation_requested_at: null,
          cancellation_reason: null
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error withdrawing cancellation:', error);
        toast.error('Erro ao cancelar solicitação de cancelamento');
        return;
      }

      toast.success('Solicitação de cancelamento retirada com sucesso!');
      onCancellationWithdrawn();
    } catch (error) {
      console.error('Error withdrawing cancellation:', error);
      toast.error('Erro ao cancelar solicitação de cancelamento');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isBlocked} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <DialogTitle>Sistema Bloqueado</DialogTitle>
          </div>
          <DialogDescription className="text-left space-y-3">
            <p>
              Você solicitou o cancelamento da sua assinatura em{' '}
              <strong>{formatDate(cancellationRequestedAt)}</strong>.
            </p>
            <p>
            Cancelamento em Processamento. Sua solicitação de reembolso está em análise e será concluída em até 3 dias úteis. Enquanto isso, sua conta estará bloqueada.  </p>
            <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-orange-800">
                Você tem até 14 dias após a assinatura para cancelar sem cobrança.
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 mt-4">
          <Button
            onClick={handleWithdrawCancellation}
            variant="outline"
            className="w-full"
          >
            Retirar Solicitação de Cancelamento
          </Button>
          <p className="text-xs text-gray-500 text-center">
            Ao retirar a solicitação, você poderá usar o sistema normalmente.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}