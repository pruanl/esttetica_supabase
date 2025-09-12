import React from 'react'
import { AppSidebar } from './AppSidebar'
import { BottomNav } from './BottomNav'
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
  const currentPage = getBreadcrumbItems(location.pathname)

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex flex-1 flex-col pb-16 md:pb-0">
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
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
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </main>
      <BottomNav />
    </SidebarProvider>
  )
}