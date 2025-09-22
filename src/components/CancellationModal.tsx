import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertTriangle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionId: string;
  isWithin14Days: boolean;
  onCancellationRequested: () => void;
}

const CANCELLATION_REASONS = [
  'Não estou usando o suficiente',
  'Muito caro para o meu orçamento',
  'Encontrei uma alternativa melhor',
  'Problemas técnicos',
  'Mudança no meu negócio',
  'Outro motivo'
];

export function CancellationModal({
  isOpen,
  onClose,
  subscriptionId,
  isWithin14Days,
  onCancellationRequested
}: CancellationModalProps) {
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCancellation = async () => {
    if (!user || !selectedReason) return;

    setIsLoading(true);
    try {
      const reason = selectedReason === 'Outro motivo' ? customReason : selectedReason;
      
      // Atualizar a assinatura com solicitação de cancelamento
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancellation_requested',
          cancellation_requested_at: new Date().toISOString(),
          cancellation_reason: reason,
          cancel_at_period_end: !isWithin14Days // Se não está dentro de 14 dias, cancela no final do período
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      onCancellationRequested();
      onClose();
    } catch (error) {
      console.error('Erro ao solicitar cancelamento:', error);
      alert('Erro ao processar solicitação de cancelamento. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedReason('');
    setCustomReason('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Cancelar Assinatura
          </DialogTitle>
          <DialogDescription>
            {isWithin14Days ? (
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                <Clock className="h-4 w-4 text-blue-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">Cancelamento imediato disponível</p>
                  <p className="text-blue-700">
                    Como sua assinatura foi feita há menos de 14 dias, você pode cancelar 
                    imediatamente e receber reembolso total.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-orange-900">Cancelamento no final do período</p>
                  <p className="text-orange-700">
                    Sua assinatura será cancelada no final do período atual. 
                    Você continuará tendo acesso até lá.
                  </p>
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">
              Por que você está cancelando? (opcional)
            </Label>
            <RadioGroup
              value={selectedReason}
              onValueChange={setSelectedReason}
              className="mt-2"
            >
              {CANCELLATION_REASONS.map((reason) => (
                <div key={reason} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason} id={reason} />
                  <Label htmlFor={reason} className="text-sm font-normal">
                    {reason}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {selectedReason === 'Outro motivo' && (
            <div>
              <Label htmlFor="custom-reason">Descreva o motivo</Label>
              <Textarea
                id="custom-reason"
                placeholder="Conte-nos mais sobre o motivo do cancelamento..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="mt-1"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Manter Assinatura
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancellation}
            disabled={isLoading || !selectedReason}
          >
            {isLoading ? 'Processando...' : 
             isWithin14Days ? 'Cancelar e Reembolsar' : 'Solicitar Cancelamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}