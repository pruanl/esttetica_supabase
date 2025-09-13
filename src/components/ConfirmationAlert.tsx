import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationAlertProps {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

export function ConfirmationAlert({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'destructive'
}: ConfirmationAlertProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full">
        <Alert variant={variant} className="border-0 rounded-lg">
          <AlertTriangle className="h-4 w-4" />
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{title}</h3>
              <AlertDescription className="mt-2">
                {description}
              </AlertDescription>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={onCancel}
                size="sm"
              >
                {cancelText}
              </Button>
              <Button
                variant={variant === 'destructive' ? 'destructive' : 'default'}
                onClick={onConfirm}
                size="sm"
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </Alert>
      </div>
    </div>
  );
}