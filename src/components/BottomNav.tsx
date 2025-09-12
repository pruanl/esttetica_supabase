import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Calendar, Users, MoreHorizontal, Settings, LogOut, ClipboardList } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/appointments", label: "Agenda", icon: Calendar },
  { href: "/patients", label: "Pacientes", icon: Users },
];

const secondaryMenuItems = [
  { href: "/procedures", label: "Procedimentos", icon: ClipboardList },
  { href: "/settings", label: "Configurações", icon: Settings },
];

export function BottomNav() {
  const { pathname } = useLocation();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t bg-background md:hidden">
      <div className="grid h-full grid-cols-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Botão "Mais" que abre o Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="flex h-full flex-col items-center justify-center gap-1 rounded-none text-muted-foreground hover:text-primary"
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-xs font-medium">Mais</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              {secondaryMenuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-primary"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
              
              {/* Botão de Sair */}
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="flex w-full items-center justify-start gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-primary"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Sair</span>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}