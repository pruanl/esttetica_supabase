import React from 'react'
import BirthdayWidget from '@/components/BirthdayWidget'
import UpcomingAppointmentsWidget from '@/components/UpcomingAppointmentsWidget'
import FinancialSummary from '@/components/FinancialSummary'
import { TopProceduresWidget } from '@/components/TopProceduresWidget'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle, Star, HelpCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()

  const handleHelpClick = () => {
    navigate('/help')
  }

  return (
    <div className="space-y-6">
      {/* Resumo Financeiro */}
      <FinancialSummary />
      
      {/* Legenda dos Indicadores */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-gray-600">Primeiro agendamento do paciente</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-green-500" />
              <span className="text-gray-600">Lembrete enviado</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Lembrete não enviado</span>
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