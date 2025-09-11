import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardCalendar } from '@/components/DashboardCalendar'
import { SeedDataButton } from '@/components/SeedDataButton'
import { Scissors, Users, Calendar } from 'lucide-react'

export const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Esttetica</h1>
              <p className="text-sm text-gray-600">Sistema de Gestão Estética</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Olá, {user?.email}
              </span>
              <Button onClick={handleSignOut} variant="outline">
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link to="/procedures">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scissors className="h-5 w-5" />
                    Procedimentos
                  </CardTitle>
                  <CardDescription>
                    Gerencie seus procedimentos estéticos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Cadastre e organize todos os seus procedimentos
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/patients">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Pacientes
                  </CardTitle>
                  <CardDescription>
                    Cadastro e gestão de pacientes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Gerencie informações dos seus pacientes
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/appointments">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Agendamentos
                  </CardTitle>
                  <CardDescription>
                    Controle de consultas e procedimentos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Visualize e gerencie seus agendamentos
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="mt-8 space-y-6">
            <SeedDataButton />
            <DashboardCalendar />
          </div>
        </div>
      </main>
    </div>
  )
}