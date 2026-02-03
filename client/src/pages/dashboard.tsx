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
import { Bell, Smartphone, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const { mainContainerClasses, headerClasses, mainClasses } = useResponsiveLayout();

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
                <h2 className="text-xl md:text-2xl font-bold text-foreground">¡Hola Darío!</h2>
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
            {/* Mobile-style Header */}
            <div className="text-center pb-4">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Panel Control</h1>
              <p className="text-gray-600">Resumen general de tu negocio</p>
            </div>

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
          </main>
        ) : (
          /* Desktop Layout - 2 Column Grid */
          <main className={mainClasses}>
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