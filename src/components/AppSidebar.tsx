import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'
import {
  Home,
  Users,
  Calendar,
  FileText,
  LogOut,
  User,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Settings,
  Calculator,
  TrendingUp,
  MessageCircle,
  Banknote,
  Brain,
  Store,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from './ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Avatar, AvatarFallback } from './ui/avatar'
import logo from '@/assets/images/logo.png'

const navigationStructure = {
  diaDia: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: Home,
      description: 'Visão geral, calendário, widgets de lembretes e aniversariantes'
    },
    {
      title: 'Agenda',
      url: '/appointments',
      icon: Calendar,
      description: 'A visão focada no calendário e na lista de compromissos'
    },
    {
      title: 'Pacientes',
      url: '/patients',
      icon: Users,
      description: 'A lista e o cadastro de todos os clientes'
    }
  ],
  gestao: [
    {
      title: 'Procedimentos',
      url: '/procedures',
      icon: FileText,
      description: 'Seu catálogo de serviços e onde a calculadora de precificação vive'
    },
    {
      title: 'Financeiro',
      icon: DollarSign,
      description: 'Centraliza todas as ferramentas financeiras',
      submenu: [
        {
          title: 'Fluxo de Caixa',
          url: '/cash-flow',
          icon: Banknote
        },
        {
          title: 'Despesas',
          url: '/expenses',
          icon: TrendingUp
        }
      ]
    },
    {
      title: 'Comunicação',
      icon: Brain,
      description: 'Centraliza as ferramentas de relacionamento',
      submenu: [
        {
          title: 'Lembretes',
          url: '/reminders',
          icon: MessageCircle
        }
      ]
    }
  ],
  ferramentas: [
    {
      title: 'Calculadora Rápida',
      url: '/tools/price-simulator',
      icon: Calculator,
      description: 'O simulador de preços que não salva dados'
    }
  ],
  configuracoes: [
    {
      title: 'Configurações',
      icon: Settings,
      description: 'Um item que agrupa tudo o que é configurado raramente',
      submenu: [
        {
          title: 'Perfil da Clínica',
          url: '/profile/clinic',
          icon: Store
        },
        {
          title: 'Financeiras',
          url: '/settings/financial',
          icon: DollarSign
        },
        {
          title: 'Gerais',
          url: '/settings',
          icon: Settings
        }
      ]
    }
  ]
}

export function AppSidebar() {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const toggleSubmenu = (menuTitle: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuTitle) 
        ? prev.filter(title => title !== menuTitle)
        : [...prev, menuTitle]
    )
  }

  const isSubmenuExpanded = (menuTitle: string) => expandedMenus.includes(menuTitle)

  const renderMenuItem = (item: any, isSubmenuItem = false) => {
       const hasSubmenu = item.submenu && item.submenu.length > 0
       const isExpanded = isSubmenuExpanded(item.title)
       const isActive = item.url && location.pathname === item.url
       const paddingClass = isSubmenuItem ? 'pl-8' : ''
   
       if (hasSubmenu) {
         return (
           <div key={item.title}>
             <SidebarMenuItem>
               <SidebarMenuButton
                 onClick={() => toggleSubmenu(item.title)}
                 className={`${paddingClass} justify-between`}
               >
                 <div className="flex items-center gap-2">
                   <item.icon className="h-4 w-4" />
                   <span>{item.title}</span>
                 </div>
                 {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
               </SidebarMenuButton>
             </SidebarMenuItem>
             {isExpanded && (
               <div className="ml-4">
                 {item.submenu.map((subItem: any) => renderMenuItem(subItem, true))}
               </div>
             )}
           </div>
         )
       }
   
       return (
         <SidebarMenuItem key={item.title}>
           <SidebarMenuButton asChild isActive={isActive} className={paddingClass}>
             <Link to={item.url}>
               <item.icon className="h-4 w-4" />
               <span>{item.title}</span>
             </Link>
           </SidebarMenuButton>
         </SidebarMenuItem>
       )
     }

  return (
    <Sidebar>
      <SidebarHeader>
        <Link to="/dashboard" className="flex items-center gap-2 font-semibold px-2 py-1">
          <img src={logo} alt="Estética" className="h-8 w-auto" />
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        {/* DIA A DIA */}
        <SidebarGroup>
          <SidebarGroupLabel>DIA A DIA</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationStructure.diaDia.map(item => renderMenuItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* GESTÃO */}
        <SidebarGroup>
          <SidebarGroupLabel>GESTÃO</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationStructure.gestao.map(item => renderMenuItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* FERRAMENTAS */}
        <SidebarGroup>
          <SidebarGroupLabel>FERRAMENTAS</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationStructure.ferramentas.map(item => renderMenuItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* CONFIGURAÇÕES */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationStructure.configuracoes.map(item => renderMenuItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                       {user?.email?.split('@')[0] || 'Usuário'}
                     </span>
                    <span className="truncate text-xs">
                      {user?.email || 'email@exemplo.com'}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}