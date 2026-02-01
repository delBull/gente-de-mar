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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Payment {
  id: number;
  stripePaymentIntentId: string;
  amount: string;
  currency: string;
  status: string;
  paymentMethod: string;
  mode: string;
  verified: boolean;
  refundedAmount: string;
  createdAt: string;
  bookingId: number;
  metadata?: string;
}

interface BookingWithTour extends Payment {
  booking?: {
    id: number;
    customerName: string;
    tourId: number;
  };
  tour?: {
    name: string;
  };
}

// Sample payment data (removed)


export default function Payments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const { toast } = useToast();
  const { user } = useAuth();
  const isMasterAdmin = user?.role === 'master_admin';

  const { data: payments = [], isLoading } = useQuery<BookingWithTour[]>({
    queryKey: ["/api/admin/payments"],
  });

  const [refundingId, setRefundingId] = useState<number | null>(null);

  const handleRefund = async (paymentId: number) => {
    setRefundingId(paymentId);
    try {
      await apiRequest("POST", `/api/admin/payments/${paymentId}/refund`);
      toast({
        title: "Reembolso procesado",
        description: "El reembolso se ha iniciado correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar el reembolso.",
        variant: "destructive",
      });
    } finally {
      setRefundingId(null);
    }
  };

  // Filter payments based on search, status, and method
  const filteredPayments = payments.filter(payment => {
    const customerName = payment.booking?.customerName || "";
    const tourName = payment.tour?.name || "";
    const transactionId = payment.stripePaymentIntentId || "";

    const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tourName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transactionId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    const matchesMethod = methodFilter === "all" || payment.paymentMethod === methodFilter;
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <Badge className="bg-primary text-primary-foreground">Completado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400/80">Pendiente</Badge>;
      case 'failed':
        return <Badge variant="destructive">Fallido</Badge>;
      case 'refunded':
        return <Badge className="bg-gray-500 text-white hover:bg-gray-500/80">Reembolsado</Badge>;
      case 'partially_refunded':
        return <Badge className="bg-gray-400 text-white">Reembolso Parcial</Badge>;
      case 'disputed':
        return <Badge variant="destructive" className="animate-pulse">Disputado</Badge>;
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

  const totalAmount = filteredPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
  const completedPayments = filteredPayments.filter(p => p.status === 'succeeded');
  // Commission calculation is simplified here for the UI
  const totalCommission = totalAmount * 0.05;


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
                              <h3 className="font-bold text-foreground text-lg">{payment.tour?.name || "Tour"}</h3>
                              <p className="text-sm text-muted-foreground truncate max-w-xs" title={payment.stripePaymentIntentId}>
                                ID: {payment.stripePaymentIntentId}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {getStatusBadge(payment.status)}
                              {getMethodBadge(payment.paymentMethod)}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center text-muted-foreground">
                              <User className="w-4 h-4 mr-2" />
                              <div>
                                <p className="font-medium text-foreground">{payment.booking?.customerName || "Cliente"}</p>
                                <p>B# {payment.bookingId}</p>
                              </div>
                            </div>

                            <div className="flex items-center text-muted-foreground">
                              <Calendar className="w-4 h-4 mr-2" />
                              <div>
                                <p className="font-medium text-foreground">
                                  {new Date(payment.createdAt).toLocaleDateString('es-ES')}
                                </p>
                                <p>{formatDistanceToNow(new Date(payment.createdAt), { addSuffix: true, locale: es })}</p>
                              </div>
                            </div>

                            <div className="flex items-center text-muted-foreground">
                              <DollarSign className="w-4 h-4 mr-2" />
                              <div>
                                <p className="font-medium text-primary text-lg">
                                  ${parseFloat(payment.amount).toLocaleString()}
                                </p>
                                <p>Monto total</p>
                              </div>
                            </div>

                            <div className="text-muted-foreground">
                              <p className="font-medium text-foreground">
                                Modo: {payment.mode}
                              </p>
                              {parseFloat(payment.refundedAmount) > 0 && (
                                <p className="text-red-500">Reembolsado: ${payment.refundedAmount}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button variant="outline" size="sm">
                            Ver Detalles
                          </Button>
                          {payment.status === 'succeeded' && isMasterAdmin && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                                  Reembolsar
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Confirmar reembolso?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción reembolsará el monto total de ${payment.amount} al cliente.
                                    Esta operación es irreversible en Stripe.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRefund(payment.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    {refundingId === payment.id ? "Procesando..." : "Confirmar Reembolso"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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