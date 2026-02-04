import { DollarSign, Percent, MinusCircle, HandCoins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface FinancialOverviewProps {
  data?: {
    totalRevenue: number;
    totalAppCommission: number;
    totalRetentions: number;
    totalSellerPayout: number;
  };
  isLoading: boolean;
}

export default function FinancialOverview({ data, isLoading }: FinancialOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="dashboard-card">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="w-12 h-12 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-4 md:p-6">
            <p className="text-muted-foreground">No hay datos financieros disponibles</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Defensive check: ensure all required properties exist with defaults
  const safeData = {
    totalRevenue: Number(data?.totalRevenue) || 0,
    totalAppCommission: Number(data?.totalAppCommission) || 0,
    totalRetentions: Number(data?.totalRetentions) || 0,
    totalSellerPayout: Number(data?.totalSellerPayout) || 0,
  };

  const metrics = [
    {
      title: "Ingresos Totales",
      value: `$${data.totalRevenue.toLocaleString()}`,
      change: "↗ +12.5% vs mes anterior",
      icon: DollarSign,
      colorClass: "metric-green",
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Comisión App",
      value: `$${data.totalAppCommission.toLocaleString()}`,
      change: "5% de comisión",
      icon: Percent,
      colorClass: "metric-yellow",
      bgColor: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      title: "Retenciones",
      value: `$${data.totalRetentions.toLocaleString()}`,
      change: `${((data.totalRetentions / data.totalRevenue) * 100).toFixed(1)}% del total`,
      icon: MinusCircle,
      colorClass: "metric-red",
      bgColor: "bg-red-100",
      iconColor: "text-red-600",
    },
    {
      title: "Pago a Vendedores",
      value: `$${data.totalSellerPayout.toLocaleString()}`,
      change: `${((data.totalSellerPayout / data.totalRevenue) * 100).toFixed(1)}% del total`,
      icon: HandCoins,
      colorClass: "metric-blue",
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.title} className="bg-white border border-gray-200 shadow-sm backdrop-blur-sm">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">{metric.title}</p>
                  <p className={`financial-metric ${metric.colorClass}`}>
                    {metric.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{metric.change}</p>
                </div>
                <div className={`w-12 h-12 ${metric.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${metric.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
