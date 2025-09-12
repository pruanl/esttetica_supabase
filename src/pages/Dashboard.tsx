import React from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardCalendar } from '@/components/DashboardCalendar'
import { SeedDataButton } from '@/components/SeedDataButton'
import BirthdayWidget from '@/components/BirthdayWidget'
import UpcomingAppointmentsWidget from '@/components/UpcomingAppointmentsWidget'
import { CostPerHourWidget } from '@/components/CostPerHourWidget'
import { Scissors, Users, Calendar } from 'lucide-react'

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Cards de Navegação Rápida */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <Link to="/procedures">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Scissors className="h-5 w-5" />
                Procedimentos
              </CardTitle>
              <CardDescription className="text-sm">
                Gerencie seus procedimentos estéticos
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">
                Cadastre e organize todos os seus procedimentos
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/patients">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Pacientes
              </CardTitle>
              <CardDescription className="text-sm">
                Cadastro e gestão de pacientes
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">
                Gerencie informações dos seus pacientes
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/appointments">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                Agendamentos
              </CardTitle>
              <CardDescription className="text-sm">
                Controle de consultas e procedimentos
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">
                Visualize e gerencie seus agendamentos
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Seção de Widgets e Ferramentas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <CostPerHourWidget />
          <UpcomingAppointmentsWidget />
          <BirthdayWidget />
          <SeedDataButton />
        </div>
        <div>
          <DashboardCalendar />
        </div>
      </div>
    </div>
  )
}