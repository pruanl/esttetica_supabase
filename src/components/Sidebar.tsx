import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { useAuth } from '../contexts/AuthContext'
import { 
  Home, 
  Users, 
  Calendar, 
  FileText, 
  LogOut, 
  User,
  ChevronRight,
  X,
  DollarSign,
  Settings
} from 'lucide-react'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false)

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home
    },
    {
      name: 'Pacientes',
      href: '/patients',
      icon: Users
    },
    {
      name: 'Agendamentos',
      href: '/appointments',
      icon: Calendar
    },
    {
      name: 'Procedimentos',
      href: '/procedures',
      icon: FileText
    },
    {
      name: 'Despesas Fixas',
      href: '/expenses',
      icon: DollarSign
    },
    {
      name: 'Configurações',
      href: '/settings',
      icon: Settings
    }
  ]

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const handleLinkClick = () => {
    if (onClose) {
      onClose()
    }
  }

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden" 
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-background transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:block md:bg-muted/40
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link to="/dashboard" className="flex items-center gap-2 font-semibold" onClick={handleLinkClick}>
              <span className="text-lg">Estética</span>
            </Link>
            {/* Botão fechar para mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto md:hidden"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Fechar menu</span>
            </Button>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href
                
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={handleLinkClick}
                    className={`
                      flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary
                      ${isActive ? 'bg-muted text-primary' : ''}
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="mt-auto p-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user?.email || 'Usuário'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsUserPanelOpen(!isUserPanelOpen)}
                  >
                    <ChevronRight className={`h-4 w-4 transition-transform ${
                      isUserPanelOpen ? 'rotate-90' : ''
                    }`} />
                  </Button>
                </div>
                
                {isUserPanelOpen && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Email: {user?.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ID: {user?.id?.slice(0, 8)}...
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}