import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, DollarSign, Calendar, User, Download, Filter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import MobileSidebar from "@/components/mobile-sidebar";

interface Payment {
  id: number;
  transactionId: string;
  customerName: string;
  tourName: string;
  amount: number;
  method: string;
  status: string;
  date: Date;
  commission: number;
  taxes: number;
  sellerPayout: number;
}

// Sample payment data
const samplePayments: Payment[] = [
  {
    id: 1,
    transactionId: "TXN-001-2025",
    customerName: "María González",
    tourName: "Tour Bahía de Banderas",
    amount: 1200,
    method: "tarjeta",
    status: "completed",
    date: new Date(Date.now() - 2 * 60 * 60 * 1000),
    commission: 60,
    taxes: 192,
    sellerPayout: 888
  },
  {
    id: 2,
    transactionId: "TXN-002-2025",
    customerName: "Carlos Rivera",
    tourName: "Snorkel en Los Arcos",
    amount: 850,
    method: "transferencia",
    status: "completed",
    date: new Date(Date.now() - 5 * 60 * 60 * 1000),
    commission: 42.5,
    taxes: 136,
    sellerPayout: 629
  },
  {
    id: 3,
    transactionId: "TXN-003-2025",
    customerName: "Ana Martínez",
    tourName: "Catamarán Sunset",
    amount: 2400,
    method: "efectivo",
    status: "pending",
    date: new Date(Date.now() - 24 * 60 * 60 * 1000),
    commission: 120,
    taxes: 384,
    sellerPayout: 1776
  },
  {
    id: 4,
    transactionId: "TXN-004-2025",
    customerName: "Roberto López",
    tourName: "Pesca Deportiva",
    amount: 3200,
    method: "tarjeta",
    status: "failed",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    commission: 160,
    taxes: 512,
    sellerPayout: 2368
  }
];

export default function Payments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [isLoading] = useState(false);

  // Filter payments based on search, status, and method
  const filteredPayments = samplePayments.filter(payment => {
    const matchesSearch = payment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.tourName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    const matchesMethod = methodFilter === "all" || payment.method === methodFilter;
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-primary text-primary-foreground">Completado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400/80">Pendiente</Badge>;
      case 'failed':
        return <Badge variant="destructive">Fallido</Badge>;
      case 'refunded':
        return <Badge className="bg-gray-500 text-white hover:bg-gray-500/80">Reembolsado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'tarjeta':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Tarjeta</Badge>;
      case 'transferencia':
        return <Badge variant="outline" className="text-green-600 border-green-600">Transferencia</Badge>;
      case 'efectivo':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">Efectivo</Badge>;
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const completedPayments = filteredPayments.filter(p => p.status === 'completed');
  const totalCommission = completedPayments.reduce((sum, payment) => sum + payment.commission, 0);

  const { mainContainerClasses, contentClasses } = useResponsiveLayout();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <MobileSidebar />
      
      <div className={mainContainerClasses}>
        <div className={contentClasses}>
          <header className="bg-white border-b border-gray-200 p-4 md:p-6">
            <div className="flex justify-between items-center max-w-7xl mx-auto">
              <div className="pl-16 md:pl-0">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Pagos</h2>
                <p className="text-sm md:text-base text-gray-600">Gestiona los pagos y transacciones</p>
              </div>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </header>

        <main className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-7xl mx-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Total Procesado</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${totalAmount.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">{filteredPayments.length} transacciones</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Comisiones Ganadas</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      ${totalCommission.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">{completedPayments.length} completadas</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Tasa de Éxito</p>
                    <p className="text-2xl font-bold text-green-400">
                      {filteredPayments.length > 0 ? Math.round((completedPayments.length / filteredPayments.length) * 100) : 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">Pagos exitosos</p>
                  </div>
                  <div className="w-12 h-12 bg-green-400/20 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar por cliente, tour o ID de transacción..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="completed">Completado</SelectItem>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="failed">Fallido</SelectItem>
                      <SelectItem value="refunded">Reembolsado</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={methodFilter} onValueChange={setMethodFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payments List */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="dashboard-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPayments.map((payment) => (
                <Card key={payment.id} className="dashboard-card">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-foreground text-lg">{payment.tourName}</h3>
                            <p className="text-sm text-muted-foreground">ID: {payment.transactionId}</p>
                          </div>
                          <div className="flex gap-2">
                            {getStatusBadge(payment.status)}
                            {getMethodBadge(payment.method)}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center text-muted-foreground">
                            <User className="w-4 h-4 mr-2" />
                            <div>
                              <p className="font-medium text-foreground">{payment.customerName}</p>
                              <p>Cliente</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center text-muted-foreground">
                            <Calendar className="w-4 h-4 mr-2" />
                            <div>
                              <p className="font-medium text-foreground">
                                {payment.date.toLocaleDateString('es-ES')}
                              </p>
                              <p>{formatDistanceToNow(payment.date, { addSuffix: true, locale: es })}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center text-muted-foreground">
                            <DollarSign className="w-4 h-4 mr-2" />
                            <div>
                              <p className="font-medium text-primary text-lg">
                                ${payment.amount.toLocaleString()}
                              </p>
                              <p>Monto total</p>
                            </div>
                          </div>
                          
                          <div className="text-muted-foreground">
                            <p className="font-medium text-foreground">
                              Comisión: ${payment.commission.toLocaleString()}
                            </p>
                            <p>Pago vendedor: ${payment.sellerPayout.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm">
                          Ver Detalles
                        </Button>
                        {payment.status === 'completed' && (
                          <Button variant="outline" size="sm">
                            Recibo
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredPayments.length === 0 && (
                <Card className="dashboard-card">
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">No se encontraron pagos</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </main>
        </div>
      </div>
    </div>
  );
}