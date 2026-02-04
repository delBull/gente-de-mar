import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface PaymentFlowChartProps {
  data?: {
    totalRevenue: number;
    totalAppCommission: number;
    totalRetentions: number;
    totalSellerPayout: number;
  };
  isLoading: boolean;
}

export default function PaymentFlowChart({ data, isLoading }: PaymentFlowChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Safe data with defaults
  const safeData = {
    totalRevenue: Number(data?.totalRevenue) || 0,
    totalAppCommission: Number(data?.totalAppCommission) || 0,
    totalRetentions: Number(data?.totalRetentions) || 0,
    totalSellerPayout: Number(data?.totalSellerPayout) || 0,
  };

  useEffect(() => {
    if (!data || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 400;
    canvas.height = 300;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate percentages (defensive against division by zero)
    const total = safeData.totalRevenue || 1; // Avoid division by zero
    const sellerPercentage = (safeData.totalSellerPayout / total) * 100;
    const appCommissionPercentage = (safeData.totalAppCommission / total) * 100;
    const retentionsPercentage = (safeData.totalRetentions / total) * 100;

    // Draw doughnut chart
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 80;
    const innerRadius = 50;

    let startAngle = -Math.PI / 2;

    // Colors
    const colors = [
      '#60A5FA', // Blue for seller payout
      '#84CC16', // Green for app commission
      '#EF4444', // Red for retentions
    ];

    const segments = [
      { percentage: sellerPercentage, color: colors[0] },
      { percentage: appCommissionPercentage, color: colors[1] },
      { percentage: retentionsPercentage, color: colors[2] },
    ];

    segments.forEach((segment) => {
      const sliceAngle = (segment.percentage / 100) * 2 * Math.PI;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = segment.color;
      ctx.fill();

      startAngle += sliceAngle;
    });

    // Draw center text
    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 16px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Distribución', centerX, centerY - 5);
    ctx.font = '12px system-ui';
    ctx.fillText('de Fondos', centerX, centerY + 10);

  }, [data]);

  if (isLoading) {
    return (
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>Distribución de Fondos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <Skeleton className="w-80 h-60 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>Distribución de Fondos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">No hay datos disponibles</p>
        </CardContent>
      </Card>
    );
  }

  const flowSteps = [
    {
      step: 1,
      title: "Cliente Paga",
      description: `$${safeData.totalRevenue.toLocaleString()} ingresados`,
      percentage: "100%",
      color: "bg-primary",
      textColor: "text-primary",
    },
    {
      step: 2,
      title: "Comisión App",
      description: "5% retenido automáticamente",
      amount: `$${safeData.totalAppCommission.toLocaleString()}`,
      color: "bg-yellow-400",
      textColor: "text-yellow-400",
    },
    {
      step: 3,
      title: "Impuestos + Comisiones",
      description: "IVA 16% + Comisión bancaria 3%",
      amount: `$${safeData.totalRetentions.toLocaleString()}`,
      color: "bg-red-400",
      textColor: "text-red-400",
    },
    {
      step: 4,
      title: "Pago Final",
      description: "Transferido a vendedores",
      amount: `$${safeData.totalSellerPayout.toLocaleString()}`,
      color: "bg-blue-400",
      textColor: "text-blue-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>Distribución de Fondos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <canvas ref={canvasRef} className="max-w-full h-auto" />
          </div>
        </CardContent>
      </Card>

      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>Flujo de Pagos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {flowSteps.map((step) => (
              <div key={step.step} className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
                <div className={`w-8 h-8 ${step.color} rounded-full flex items-center justify-center text-primary-foreground font-bold`}>
                  {step.step}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                <p className={`font-bold ${step.textColor}`}>
                  {step.amount || step.percentage}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
