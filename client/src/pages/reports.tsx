import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { CalendarIcon, Download, TrendingUp, DollarSign, Users, Ship, Briefcase, ShieldCheck } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import MobileSidebar from "@/components/mobile-sidebar";

// Sample data for reports
const monthlyRevenue = [
  { month: 'Ene', revenue: 15000, bookings: 45 },
  { month: 'Feb', revenue: 18000, bookings: 52 },
  { month: 'Mar', revenue: 22000, bookings: 68 },
  { month: 'Apr', revenue: 19000, bookings: 58 },
  { month: 'May', revenue: 25000, bookings: 75 },
  { month: 'Jun', revenue: 28000, bookings: 82 }
];

const tourPerformance = [
  { name: 'Tour Islas Marietas', revenue: 35000, bookings: 95, rating: 4.8 },
  { name: 'Pesca Deportiva', revenue: 28000, bookings: 42, rating: 4.6 },
  { name: 'Snorkel Los Arcos', revenue: 22000, bookings: 78, rating: 4.7 },
  { name: 'Catamarán Sunset', revenue: 18000, bookings: 35, rating: 4.9 }
];

const revenueDistribution = [
  { name: 'Pago Vendedores', value: 65, amount: 95000, color: '#60A5FA' },
  { name: 'Comisión App', value: 15, amount: 22000, color: '#84CC16' },
  { name: 'Impuestos', value: 12, amount: 17500, color: '#EF4444' },
  { name: 'Comisiones Bancarias', value: 8, amount: 11700, color: '#F59E0B' }
];

export default function Reports() {
  const [dateRange, setDateRange] = useState("last30");
  const [reportType, setReportType] = useState("overview");
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();

  const { data: financialSummary } = useQuery({
    queryKey: ["/api/financial-summary"],
  });

  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
    const today = new Date();

    switch (value) {
      case "last7":
        setFromDate(subDays(today, 7));
        setToDate(today);
        break;
      case "last30":
        setFromDate(subDays(today, 30));
        setToDate(today);
        break;
      case "thisMonth":
        setFromDate(startOfMonth(today));
        setToDate(endOfMonth(today));
        break;
      default:
        break;
    }
  };

  const { mainContainerClasses, contentClasses } = useResponsiveLayout();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <MobileSidebar />

      <div className={mainContainerClasses}>
        <div className={contentClasses}>
          <header className="bg-white border-b border-gray-200 p-4 md:p-6">
            <div className="flex justify-between items-center max-w-7xl mx-auto">
              <div className="pl-16 md:pl-0">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Reportes</h2>
                <p className="text-sm md:text-base text-gray-600">Analiza el rendimiento de tu negocio</p>
              </div>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </header>

          <main className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-7xl mx-auto">
            {/* Filters */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex gap-4">
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Tipo de reporte" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="overview">Resumen General</SelectItem>
                        <SelectItem value="revenue">Ingresos</SelectItem>
                        <SelectItem value="tours">Rendimiento Tours</SelectItem>
                        <SelectItem value="customers">Clientes</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={dateRange} onValueChange={handleDateRangeChange}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="last7">Últimos 7 días</SelectItem>
                        <SelectItem value="last30">Últimos 30 días</SelectItem>
                        <SelectItem value="thisMonth">Este mes</SelectItem>
                        <SelectItem value="custom">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {dateRange === "custom" && (
                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-[150px] justify-start text-left font-normal",
                              !fromDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {fromDate ? format(fromDate, "PPP", { locale: es }) : "Desde"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={fromDate}
                            onSelect={setFromDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-[150px] justify-start text-left font-normal",
                              !toDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {toDate ? format(toDate, "PPP", { locale: es }) : "Hasta"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={toDate}
                            onSelect={setToDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="dashboard-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Ingresos Totales</p>
                      <p className="text-2xl font-bold text-primary">
                        ${(financialSummary as any)?.totalRevenue?.toLocaleString() || '0'}
                      </p>
                      <p className="text-sm text-green-400">↗ +15.2% vs mes anterior</p>
                    </div>
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="dashboard-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Reservas Totales</p>
                      <p className="text-2xl font-bold text-blue-400">342</p>
                      <p className="text-sm text-green-400">↗ +8.1% vs mes anterior</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-400/20 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="dashboard-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Tours Activos</p>
                      <p className="text-2xl font-bold text-yellow-400">12</p>
                      <p className="text-sm text-muted-foreground">4 tours nuevos</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-400/20 rounded-lg flex items-center justify-center">
                      <Ship className="w-6 h-6 text-yellow-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="dashboard-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Tasa Conversión</p>
                      <p className="text-2xl font-bold text-green-400">76%</p>
                      <p className="text-sm text-green-400">↗ +3.2% vs mes anterior</p>
                    </div>
                    <div className="w-12 h-12 bg-green-400/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Commission Split */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="dashboard-card border-l-4 border-l-orange-400">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Comisiones Vendedores</p>
                      <p className="text-2xl font-bold text-orange-400">
                        ${(financialSummary as any)?.totalSellerCommission?.toLocaleString() || '0'}
                      </p>
                      <p className="text-sm text-muted-foreground italic text-[10px]">Pago pendiente acumulado</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-400/20 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-orange-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="dashboard-card border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Pago a Proveedores</p>
                      <p className="text-2xl font-bold text-green-500">
                        ${(financialSummary as any)?.totalProviderPayout?.toLocaleString() || '0'}
                      </p>
                      <p className="text-sm text-muted-foreground italic text-[10px]">Neto para partners</p>
                    </div>
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Ship className="w-6 h-6 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="dashboard-card border-l-4 border-l-indigo-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Tarifa Plataforma</p>
                      <p className="text-2xl font-bold text-indigo-500">
                        ${(financialSummary as any)?.totalPlatformFee?.toLocaleString() || '0'}
                      </p>
                      <p className="text-sm text-muted-foreground italic text-[10px]">Revenue BookerOS</p>
                    </div>
                    <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6 text-indigo-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <Card className="dashboard-card">
                <CardHeader>
                  <CardTitle>Ingresos Mensuales</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="revenue" fill="#84CC16" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Distribution Chart */}
              <Card className="dashboard-card">
                <CardHeader>
                  <CardTitle>Distribución de Ingresos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={revenueDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {revenueDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {revenueDistribution.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-sm text-muted-foreground">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tour Performance */}
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle>Rendimiento por Tour</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tourPerformance.map((tour, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{tour.name}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>{tour.bookings} reservas</span>
                          <span>Rating: {tour.rating}⭐</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary text-lg">
                          ${tour.revenue.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">Ingresos</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Bookings Trend */}
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle>Tendencia de Reservas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="bookings"
                      stroke="#60A5FA"
                      strokeWidth={3}
                      dot={{ fill: '#60A5FA', r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}