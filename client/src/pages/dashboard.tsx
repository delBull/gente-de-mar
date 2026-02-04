import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MobileSidebar from "@/components/mobile-sidebar";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import StaticLogo from "@/components/static-logo";
import FinancialOverview from "@/components/financial-overview";
import PaymentFlowChart from "@/components/payment-flow-chart";
import RecentTransactions from "@/components/recent-transactions";
import ActiveTours from "@/components/active-tours";
import RetentionConfig from "@/components/retention-config";
import ReferralsCard from "@/components/referrals-card";
import StripeConnectCard from "@/components/stripe-connect-card";
import { Bell, Smartphone, Monitor, Users, Settings as SettingsIcon, BookOpen, BarChart3, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const { mainContainerClasses, headerClasses, mainClasses } = useResponsiveLayout();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: financialSummary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ["/api/financial-summary"],
  });

  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["/api/transactions"],
  });

  const { data: tours, isLoading: isLoadingTours } = useQuery({
    queryKey: ["/api/tours"],
  });

  const { data: retentionConfig, isLoading: isLoadingConfig } = useQuery({
    queryKey: ["/api/retention-config"],
  });

  return (
    <div className="flex min-h-screen bg-background">
      {/* Unified Sidebar */}
      <MobileSidebar />

      {/* Main Content with Mobile/Desktop Layout Toggle */}
      <div className={mainContainerClasses}>
        {/* Header */}
        <header className="bg-card/80 backdrop-blur-md border-b border-border p-4 md:p-6 sticky top-0 z-10">
          <div className={headerClasses}>
            <div className="pl-20 lg:pl-0 flex items-center space-x-4">
              <StaticLogo size="sm" showText={false} />
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground">¡Hola!</h2>
                <p className="text-sm md:text-base text-muted-foreground">Panel de control financiero</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={isMobileLayout ? "default" : "ghost"}
                size="sm"
                onClick={() => setIsMobileLayout(!isMobileLayout)}
                className="text-xs flex items-center space-x-2"
              >
                {isMobileLayout ? (
                  <>
                    <Monitor className="w-4 h-4" />
                    <span className="hidden sm:inline">Desktop</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="w-4 h-4" />
                    <span className="hidden sm:inline">Móvil</span>
                  </>
                )}
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900">
                <Bell className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content - Mobile Layout */}
        {isMobileLayout ? (
          <main className="p-4 space-y-6">
            {/* Provider Role - Simplified Dashboard */}
            {user?.role === 'provider' ? (
              <>
                <div className="text-center pb-4">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Panel Provider</h1>
                  <p className="text-gray-600">Canjeo de tickets y resumen</p>
                </div>

                <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-700">
                      <QrCode className="w-6 h-6" />
                      Canjear Ticket
                    </CardTitle>
                    <CardDescription>Función principal - Escanear QR</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      size="lg"
                      onClick={() => setLocation('/redeem')}
                    >
                      <QrCode className="w-5 h-5 mr-2" />
                      Ir a Canjear Ticket
                    </Button>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>Tickets Hoy</CardDescription>
                      <CardTitle className="text-2xl">0</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>Esta Semana</CardDescription>
                      <CardTitle className="text-2xl">0</CardTitle>
                    </CardHeader>
                  </Card>
                </div>
              </>
            ) : (
              <>
                {/* Mobile-style Header */}
                <div className="text-center pb-4">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Panel Control</h1>
                  <p className="text-gray-600">Resumen general de tu negocio</p>
                </div>

                {/* Admin Portal Cards - Mobile */}
                {user?.role === 'master_admin' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Portal de Administración</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Card
                        className="cursor-pointer hover:border-blue-500 transition-all"
                        onClick={() => setLocation('/users')}
                      >
                        <CardHeader className="pb-3">
                          <Users className="h-8 w-8 text-purple-600 mb-2" />
                          <CardTitle className="text-sm">Usuarios</CardTitle>
                        </CardHeader>
                      </Card>
                      <Card
                        className="cursor-pointer hover:border-blue-500 transition-all"
                        onClick={() => setLocation('/settings')}
                      >
                        <CardHeader className="pb-3">
                          <SettingsIcon className="h-8 w-8 text-gray-600 mb-2" />
                          <CardTitle className="text-sm">Configuración</CardTitle>
                        </CardHeader>
                      </Card>
                      <Card
                        className="cursor-pointer hover:border-blue-500 transition-all"
                        onClick={() => setLocation('/guide')}
                      >
                        <CardHeader className="pb-3">
                          <BookOpen className="h-8 w-8 text-blue-600 mb-2" />
                          <CardTitle className="text-sm">Guía</CardTitle>
                        </CardHeader>
                      </Card>
                      <Card
                        className="cursor-pointer hover:border-blue-500 transition-all"
                        onClick={() => setLocation('/reports')}
                      >
                        <CardHeader className="pb-3">
                          <BarChart3 className="h-8 w-8 text-green-600 mb-2" />
                          <CardTitle className="text-sm">Reportes</CardTitle>
                        </CardHeader>
                      </Card>
                    </div>
                  </div>
                )}

                {/* Mobile Layout - Single Column Stack */}
                <div className="space-y-6">
                  <FinancialOverview
                    data={financialSummary as any}
                    isLoading={isLoadingSummary}
                  />

                  <PaymentFlowChart
                    data={financialSummary as any}
                    isLoading={isLoadingSummary}
                  />

                  <RecentTransactions
                    transactions={transactions as any}
                    isLoading={isLoadingTransactions}
                  />

                  <ActiveTours
                    tours={tours as any}
                    isLoading={isLoadingTours}
                  />

                  <RetentionConfig
                    config={retentionConfig as any}
                    isLoading={isLoadingConfig}
                  />
                  <ReferralsCard />
                  <StripeConnectCard />
                </div>
              </>
            )}
          </main>
        ) : (
          /* Desktop Layout - 2 Column Grid */
          <main className={mainClasses}>
            {/* Admin Portal Cards - Desktop */}
            {user?.role === 'master_admin' && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4">Portal de Administración</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card
                    className="cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
                    onClick={() => setLocation('/users')}
                  >
                    <CardHeader>
                      <Users className="h-10 w-10 text-purple-600 mb-2" />
                      <CardTitle className="text-base">Usuarios</CardTitle>
                      <CardDescription>Gestionar usuarios del sistema</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card
                    className="cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
                    onClick={() => setLocation('/settings')}
                  >
                    <CardHeader>
                      <SettingsIcon className="h-10 w-10 text-gray-600 mb-2" />
                      <CardTitle className="text-base">Configuración</CardTitle>
                      <CardDescription>Ajustes del sistema</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card
                    className="cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
                    onClick={() => setLocation('/guide')}
                  >
                    <CardHeader>
                      <BookOpen className="h-10 w-10 text-blue-600 mb-2" />
                      <CardTitle className="text-base">Guía de Uso</CardTitle>
                      <CardDescription>Documentación interna</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card
                    className="cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
                    onClick={() => setLocation('/reports')}
                  >
                    <CardHeader>
                      <BarChart3 className="h-10 w-10 text-green-600 mb-2" />
                      <CardTitle className="text-base">Reportes</CardTitle>
                      <CardDescription>Análisis y métricas</CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </div>
            )}

            <FinancialOverview
              data={financialSummary as any}
              isLoading={isLoadingSummary}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <PaymentFlowChart
                data={financialSummary as any}
                isLoading={isLoadingSummary}
              />
              <RecentTransactions
                transactions={transactions as any}
                isLoading={isLoadingTransactions}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <ActiveTours
                tours={tours as any}
                isLoading={isLoadingTours}
              />
              <RetentionConfig
                config={retentionConfig as any}
                isLoading={isLoadingConfig}
              />
              <ReferralsCard />
              <StripeConnectCard />
            </div>
          </main>
        )}
      </div>
    </div>
  );
}