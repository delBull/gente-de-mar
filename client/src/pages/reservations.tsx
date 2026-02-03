import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, User, MapPin, Clock, Phone, Mail, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import MobileSidebar from "@/components/mobile-sidebar";
import ValidationHistory from "@/components/validation-history";

interface Reservation {
  id: number;
  tourName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  bookingDate: string; // API returns string
  time: string; // API might not have this directly separate, usually part of date or tour details
  adults: number; // mapped from API
  children: number;
  guests?: number; // fallback
  status: string;
  totalAmount: string;
  location: string;
  tourId: number;
}

export default function Reservations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: reservations, isLoading } = useQuery<Reservation[]>({
    queryKey: ["/api/bookings"],
  });

  // Filter reservations based on search and status
  const filteredReservations = (reservations || []).filter(reservation => {
    const matchesSearch =
      (reservation.customerName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (reservation.tourName?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || reservation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-primary text-primary-foreground">Confirmada</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400/80">Pendiente</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelada</Badge>;
      case 'completed':
        return <Badge className="bg-green-500 text-white hover:bg-green-500/80">Completada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const sendTicketViaWhatsApp = (reservation: Reservation) => {
    if (!reservation.customerPhone) return;

    // Clean phone number (remove non-digits, ensure country code if missing)
    let phone = reservation.customerPhone.replace(/\D/g, '');
    if (!phone.startsWith('52')) phone = '52' + phone; // Default to MX if no country code provided

    const message = `Hola ${reservation.customerName}, aquí tienes tus boletos para ${reservation.tourName}.
    
📅 Fecha: ${new Date(reservation.bookingDate).toLocaleDateString()}
📍 Ubicación: ${reservation.location}
🎫 Ver Ticket: ${window.location.origin}/ticket/${reservation.id}

¡Nos vemos pronto!`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const { mainContainerClasses, contentClasses } = useResponsiveLayout();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <MobileSidebar />

      <div className={mainContainerClasses}>
        <div className={contentClasses}>
          <header className="bg-white border-b border-gray-200 p-4 md:p-6">
            <div className="flex justify-between items-center">
              <div className="pl-16 md:pl-0">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Reservaciones</h2>
                <p className="text-sm md:text-base text-gray-600">Gestiona las reservas de tus tours</p>
              </div>
            </div>
          </header>

          <main className="p-4 md:p-6 space-y-4 md:space-y-6">
            {/* Filters */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Buscar por cliente o tour..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="w-full md:w-48">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filtrar por estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="confirmed">Confirmadas</SelectItem>
                        <SelectItem value="pending">Pendientes</SelectItem>
                        <SelectItem value="cancelled">Canceladas</SelectItem>
                        <SelectItem value="completed">Completadas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Validation History */}
            <ValidationHistory />

            {/* Reservations List */}
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="bg-white border border-gray-200 shadow-sm">
                    <CardContent className="p-4 md:p-6">
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
                {filteredReservations.map((reservation) => (
                  <Card key={reservation.id} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-bold text-foreground text-lg">{reservation.tourName}</h3>
                              <div className="flex items-center text-muted-foreground mt-1">
                                <MapPin className="w-4 h-4 mr-1" />
                                <span className="text-sm">{reservation.location}</span>
                              </div>
                            </div>
                            {getStatusBadge(reservation.status)}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center text-muted-foreground">
                              <User className="w-4 h-4 mr-2" />
                              <div>
                                <p className="font-medium text-foreground">{reservation.customerName}</p>
                                <p>{reservation.adults + (reservation.children || 0)} huéspedes</p>
                              </div>
                            </div>

                            <div className="flex items-center text-muted-foreground">
                              <Calendar className="w-4 h-4 mr-2" />
                              <div>
                                <p className="font-medium text-foreground">
                                  {new Date(reservation.bookingDate).toLocaleDateString('es-ES')}
                                </p>
                                <p>{formatDistanceToNow(new Date(reservation.bookingDate), { addSuffix: true, locale: es })}</p>
                              </div>
                            </div>

                            <div className="flex items-center text-muted-foreground">
                              <Clock className="w-4 h-4 mr-2" />
                              <div>
                                <p className="font-medium text-foreground">{reservation.time}</p>
                                <p>Hora de salida</p>
                              </div>
                            </div>

                            <div className="flex items-center text-muted-foreground">
                              <span className="text-primary font-bold text-lg">
                                ${parseFloat(reservation.totalAmount).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Mail className="w-4 h-4 mr-1" />
                              <span>{reservation.customerEmail}</span>
                            </div>
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 mr-1" />
                              <span>{reservation.customerPhone}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => sendTicketViaWhatsApp(reservation)}
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Enviar Ticket
                          </Button>
                          <Button variant="outline" size="sm">
                            Ver Detalles
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredReservations.length === 0 && (
                  <Card className="dashboard-card">
                    <CardContent className="p-12 text-center">
                      <p className="text-muted-foreground">No se encontraron reservaciones</p>
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