import React from 'react'
import BirthdayWidget from '@/components/BirthdayWidget'
import UpcomingAppointmentsWidget from '@/components/UpcomingAppointmentsWidget'
import { FinancialSummary } from '@/components/FinancialSummary'
import { TopProceduresWidget } from '@/components/TopProceduresWidget'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Star, HelpCircle, Crown, Zap, TrendingUp, Calculator } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSubscription } from '@/contexts/SubscriptionContext'

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { isActive } = useSubscription()

  const handleHelpClick = () => {
    navigate('/help')
  }

  const handleUpgradeClick = () => {
    navigate('/subscribe')
  }

  return (
    <div className="space-y-6">
      {/* Card de Upgrade para usuários sem assinatura */}
      {!isActive && (
        <Card className="border-2 border-dashed border-primary/50 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Desbloqueie Todo o Potencial</CardTitle>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                Premium
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Acesse todas as funcionalidades premium e transforme sua gestão:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span>Fluxo de Caixa Completo</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calculator className="h-4 w-4 text-blue-500" />
                <span>Calculadora de Precificação</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span>Relatórios Avançados</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MessageCircle className="h-4 w-4 text-purple-500" />
                <span>Lembretes Automáticos</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button onClick={handleUpgradeClick} className="flex-1">
                <Crown className="h-4 w-4 mr-2" />
                Fazer Upgrade Agora
              </Button>
              <Button variant="outline" onClick={() => navigate('/subscribe')} className="flex-1">
                Ver Planos
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo Financeiro */}
      <FinancialSummary />
      
      {/* Legenda dos Indicadores */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-muted-foreground">Primeiro agendamento do paciente</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-green-500" />
              <span className="text-muted-foreground">Lembrete enviado</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Lembrete não enviado</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Layout Simples - Próximos Agendamentos e Aniversariantes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <UpcomingAppointmentsWidget />
        </div>
        <div className="space-y-6">
          <BirthdayWidget />
          <TopProceduresWidget />
        </div>
      </div>
      
      {/* Barra de Ajuda */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Ajuda ou sugestão?
            </div>
            <Button 
              onClick={handleHelpClick}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <HelpCircle className="w-4 h-4" />
              Clique aqui
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}