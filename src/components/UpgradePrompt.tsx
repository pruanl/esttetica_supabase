import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface UpgradePromptProps {
  title?: string;
  description?: string;
  feature?: string;
  className?: string;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  title = "Funcionalidade Premium",
  description = "Esta funcionalidade está disponível apenas para usuários com assinatura ativa.",
  feature,
  className = ""
}) => {
  return (
    <Card className={`border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 ${className}`}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
          <Crown className="h-6 w-6 text-amber-600" />
        </div>
        <CardTitle className="flex items-center justify-center gap-2 text-amber-800">
          <Sparkles className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription className="text-amber-700">
          {description}
        </CardDescription>
        {feature && (
          <Badge variant="secondary" className="mx-auto w-fit bg-amber-100 text-amber-800">
            {feature}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-amber-700">
            Desbloqueie todas as funcionalidades premium:
          </p>
          <ul className="text-sm text-amber-600 space-y-1">
            <li>• Calculadora de Precificação Avançada</li>
            <li>• Relatórios Detalhados</li>
            <li>• Backup Automático</li>
            <li>• Suporte Prioritário</li>
          </ul>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="bg-amber-600 hover:bg-amber-700">
            <Link to="/subscribe">
              Fazer Upgrade
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild className="border-amber-300 text-amber-700 hover:bg-amber-50">
            <Link to="/profile/billing">
              Ver Planos
            </Link>
          </Button>
        </div>
        
        <p className="text-xs text-amber-600">
          Cancele a qualquer momento • Sem compromisso
        </p>
      </CardContent>
    </Card>
  );
};