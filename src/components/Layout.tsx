import React, { useState, useEffect } from 'react'
import { AppSidebar } from './AppSidebar'
import { BottomNav } from './BottomNav'
import { ModeToggle } from './mode-toggle'
import { SystemBlocker } from './SystemBlocker'
import { SidebarProvider, SidebarTrigger } from './ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './ui/breadcrumb'
import { Separator } from './ui/separator'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'

interface LayoutProps {
  children: React.ReactNode
}

const getBreadcrumbItems = (pathname: string) => {
  const pathMap: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/patients': 'Pacientes',
    '/procedures': 'Procedimentos',
    '/appointments': 'Agendamentos',
    '/tools/price-simulator': 'Simulador de Preços',
  }
  
  return pathMap[pathname] || 'Página'
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  const { user } = useAuth()
  const currentPage = getBreadcrumbItems(location.pathname)
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadSubscriptionData()
    }
  }, [user])

  const loadSubscriptionData = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading subscription:', error)
        return
      }

      setSubscription(data)
    } catch (error) {
      console.error('Error loading subscription data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Verifica se o sistema deve ser bloqueado
  const isSystemBlocked = subscription?.status === 'cancellation_requested'

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex flex-1 flex-col pb-16 md:pb-0">
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4 flex-1">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">
                    Estética
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{currentPage}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="px-4">
            <ModeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </main>
      <BottomNav />
      
      {/* Sistema de bloqueio para cancelamentos pendentes */}
      {!loading && isSystemBlocked && (
        <SystemBlocker
          isBlocked={true}
          cancellationRequestedAt={subscription.cancellation_requested_at}
          onCancellationWithdrawn={loadSubscriptionData}
        />
      )}
    </SidebarProvider>
  )
}