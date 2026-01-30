import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import AuthModal from "@/components/auth-modal";
import AnimatedLogo from "@/components/animated-logo";
import StaticLogo from "@/components/static-logo";
import { useSidebarContext } from "@/providers/SidebarProvider";
import {
  LayoutDashboard,
  MapPin,
  Calendar,
  CreditCard,
  BarChart3,
  Settings,
  QrCode,
  LogOut,
  LogIn,
  User,
  Users,
  Shield,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Globe,
  ShoppingCart,
  Camera
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, section: "dashboard" },
  { name: "Tours", href: "/tours", icon: MapPin, section: "tours" },
  { name: "Reservaciones", href: "/reservations", icon: Calendar, section: "reservations" },
  { name: "Pagos", href: "/payments", icon: CreditCard, section: "payments" },
  { name: "Reportes", href: "/reports", icon: BarChart3, section: "reports" },
  { name: "Portal de Reservas", href: "/customer", icon: ShoppingCart, section: "customer" },
  { name: "Configuración", href: "/settings", icon: Settings, section: "settings" },
  { name: "Canjear Ticket", href: "/redeem", icon: QrCode, section: "redeem" },
];

export default function MobileSidebar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { isCollapsed, setIsCollapsed } = useSidebarContext();

  const { user, isAuthenticated, logout, canAccessSection } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cerrar sesión",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'master_admin':
        return <Shield className="w-4 h-4" />;
      case 'business':
        return <Briefcase className="w-4 h-4" />;
      case 'manager':
        return <User className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'master_admin':
        return 'Administrador Master';
      case 'business':
        return 'Usuario de Negocio';
      case 'manager':
        return 'Manager';
      default:
        return 'Usuario';
    }
  };

  // Desktop Sidebar Component
  const DesktopSidebar = () => (
    <div className={`hidden lg:flex fixed left-0 top-0 h-full bg-sidebar-background border-r border-sidebar-border z-40 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'
      }`}>
      <div className="flex flex-col w-full">
        {/* Header con botón de colapso */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <StaticLogo size="sm" showText={false} />
              <h1 className="text-lg font-semibold text-sidebar-foreground">Gente de Mar</h1>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        {/* Navigation y Logo */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Logo animado cuando no hay usuario logueado */}
          {!isAuthenticated && !isCollapsed && (
            <div className="flex-1 flex items-center justify-center">
              <AnimatedLogo />
            </div>
          )}

          {/* Navegación cuando está autenticado */}
          {isAuthenticated && (
            <nav className="flex-1 p-4 space-y-2">
              {navigation.map((item) => {
                if (!canAccessSection(item.section)) return null;

                const isActive = location === item.href;
                const Icon = item.icon;

                return (
                  <Link key={item.name} href={item.href}>
                    <div
                      className={`flex items-center p-3 rounded-lg transition-colors cursor-pointer ${isActive
                        ? 'bg-sidebar-accent text-primary font-medium'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        } ${isCollapsed ? 'justify-center' : ''}`}
                      onClick={() => {
                        setTimeout(() => {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }, 100);
                      }}
                    >
                      <Icon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'} flex-shrink-0`} />
                      {!isCollapsed && <span>{item.name}</span>}
                    </div>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Footer con usuario y logout */}
          {isAuthenticated && (
            <div className="border-t border-gray-200 p-4 space-y-3">
              {/* Información del usuario */}
              {!isCollapsed && (
                <div className="flex items-center space-x-3 p-3 bg-sidebar-accent rounded-lg">
                  {getRoleIcon(user?.role || '')}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {user?.fullName}
                    </p>
                    <p className="text-xs text-primary">
                      {getRoleLabel(user?.role || '')}
                    </p>
                  </div>
                </div>
              )}
              <Button
                onClick={handleLogout}
                variant="ghost"
                className={`${isCollapsed ? 'w-10 h-10 p-0' : 'w-full'} bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`}
              >
                <LogOut className="w-4 h-4 mr-0" />
                {!isCollapsed && <span className="ml-2">Cerrar Sesión</span>}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Mobile Sidebar Content
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-semibold text-sidebar-foreground">Gente de Mar</h1>
        </div>
        <div className="flex items-center space-x-2">
          {isAuthenticated && (user?.role === 'business' || user?.role === 'manager') && (
            <Link href="/redeem">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="p-2"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-3 overflow-y-auto">
        {!isAuthenticated && (
          <div className="text-center py-8">
            <AnimatedLogo />
          </div>
        )}

        {isAuthenticated && navigation.map((item) => {
          if (!canAccessSection(item.section)) return null;

          const isActive = location === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.name} href={item.href}>
              <div
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer ${isActive
                    ? 'bg-sidebar-accent text-primary font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                onClick={() => {
                  setIsOpen(false);
                  setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }, 100);
                }}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}

        {isAuthenticated && canAccessSection('customers') && (
          <Link href="/customers">
            <div
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer ${location === '/customers'
                  ? 'bg-sidebar-accent text-primary font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              onClick={() => {
                setIsOpen(false);
                setTimeout(() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 100);
              }}
            >
              <Users className="w-5 h-5 mr-3 flex-shrink-0" />
              <span>Clientes</span>
            </div>
          </Link>
        )}

        {!isAuthenticated ? (
          <button
            onClick={() => { setShowAuthModal(true); setIsOpen(false); }}
            className="btn-ocean-primary w-full"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Iniciar Sesión
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-sidebar-accent rounded-lg">
              {getRoleIcon(user?.role || '')}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.fullName}
                </p>
                <p className="text-xs text-primary">
                  {getRoleLabel(user?.role || '')}
                </p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        )}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Mobile & Tablet Menu Button - Innovative Vertical Design */}
      <div className="lg:hidden fixed left-0 top-0 h-full z-50 flex items-center">
        <div className="relative h-full">
          {/* Gradient Background Bar */}
          <div
            className="w-12 h-full bg-gradient-to-b from-cyan-500 via-blue-600 to-blue-700 shadow-lg flex items-center justify-center cursor-pointer transition-all duration-300 hover:w-14"
            onClick={() => setIsOpen(true)}
            style={{
              marginTop: '1rem',
              marginBottom: '1rem',
              height: 'calc(100vh - 2rem)',
              borderRadius: '0 12px 12px 0',
            }}
          >
            {/* Ocean Wave Pattern Overlay */}
            <div className="absolute inset-0 opacity-20">
              <svg viewBox="0 0 24 400" className="w-full h-full">
                <path
                  d="M0,100 Q12,80 24,100 T48,100 T72,100 T96,100 T120,100 T144,100 T168,100 T192,100 T216,100 T240,100 L240,400 L0,400 Z"
                  fill="white"
                />
              </svg>
            </div>

            {/* Menu Icon - Centered Burger Lines */}
            <div className="relative z-10 flex flex-col space-y-1.5">
              <div className="w-6 h-0.5 bg-white rounded"></div>
              <div className="w-6 h-0.5 bg-white rounded"></div>
              <div className="w-6 h-0.5 bg-white rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <div className="hidden" />
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-80">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}