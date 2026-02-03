import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { CalendarDays, Clock, Users, XCircle, CheckCircle2, AlertCircle, MessageCircle } from "lucide-react";
import MobileSidebar from "@/components/mobile-sidebar";

interface Booking {
    id: number;
    tourId: number;
    bookingDate: string;
    customerName: string;
    customerPhone: string;
    adults: number;
    children: number;
    status: string;
    totalAmount: string;
    proposedDate?: string;
    rescheduleReason?: string;
    rescheduleToken?: string;
}

interface Tour {
    id: number;
    name: string;
}

interface AvailabilityOverride {
    id: number;
    tourId: number;
    date: string;
    isAvailable: boolean;
    reason?: string;
}

export default function Agenda() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedTourId, setSelectedTourId] = useState<number | 'all'>('all');
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { mainContainerClasses, contentClasses } = useResponsiveLayout();

    const { data: tours } = useQuery<Tour[]>({
        queryKey: ["/api/tours"],
    });

    const { data: bookings, isLoading: isLoadingBookings } = useQuery<Booking[]>({
        queryKey: ["/api/bookings"],
    });

    const { data: overrides, isLoading: isLoadingOverrides } = useQuery<AvailabilityOverride[]>({
        queryKey: selectedTourId !== 'all' ? [`/api/tours/${selectedTourId}/availability-overrides`] : [],
        enabled: selectedTourId !== 'all',
    });

    const blockDateMutation = useMutation({
        mutationFn: async (data: { tourId: number; date: Date; isAvailable: boolean }) => {
            return await apiRequest("POST", "/api/availability-overrides", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/tours/${selectedTourId}/availability-overrides`] });
            toast({
                title: "Disponibilidad actualizada",
                description: "El estado del día ha sido modificado.",
            });
        },
    });

    const unblockDateMutation = useMutation({
        mutationFn: async (id: number) => {
            return await apiRequest("DELETE", `/api/availability-overrides/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/tours/${selectedTourId}/availability-overrides`] });
            toast({
                title: "Regla eliminada",
                description: "Se ha restaurado la disponibilidad normal.",
            });
        },
    });

    const proposeRescheduleMutation = useMutation({
        mutationFn: async (data: { bookingId: number; proposedDate: Date; reason: string }) => {
            return await apiRequest("POST", `/api/bookings/${data.bookingId}/propose-reschedule`, {
                proposedDate: data.proposedDate,
                reason: data.reason
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
            toast({
                title: "Propuesta enviada",
                description: "Se ha generado un enlace de re-programación.",
            });
        },
    });

    const dateString = selectedDate?.toDateString();

    const bookingsForDate = bookings?.filter(b =>
        new Date(b.bookingDate).toDateString() === dateString &&
        (selectedTourId === 'all' || b.tourId === selectedTourId)
    );

    const overrideForDate = overrides?.find(o =>
        new Date(o.date).toDateString() === dateString
    );

    const isBlocked = overrideForDate && !overrideForDate.isAvailable;

    const handleToggleBlock = () => {
        if (selectedTourId === 'all') {
            toast({
                title: "Selecciona un tour",
                description: "Debes seleccionar un tour específico para bloquear fechas.",
                variant: "destructive",
            });
            return;
        }

        if (overrideForDate) {
            unblockDateMutation.mutate(overrideForDate.id);
        } else {
            blockDateMutation.mutate({
                tourId: selectedTourId,
                date: selectedDate,
                isAvailable: false
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'confirmed':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200">Confirmada</Badge>;
            case 'pending_payment':
                return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100/80 border-yellow-200">Pendiente</Badge>;
            case 'cancelled':
                return <Badge variant="destructive">Cancelada</Badge>;
            case 'pending_reschedule':
                return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100/80 border-orange-200">En Re-programación</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <MobileSidebar />

            <div className={mainContainerClasses}>
                <div className={contentClasses}>
                    <header className="bg-white border-b border-gray-200 p-4 md:p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="pl-16 md:pl-0">
                                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Agenda Inteligente</h2>
                                <p className="text-sm text-gray-600">Control de disponibilidad y reservas diarias</p>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-500 whitespace-nowrap">Tour:</span>
                                <select
                                    className="bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                                    value={selectedTourId}
                                    onChange={(e) => setSelectedTourId(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                                >
                                    <option value="all">Todos los Tours</option>
                                    {tours?.map(tour => (
                                        <option key={tour.id} value={tour.id}>{tour.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </header>

                    <main className="p-4 md:p-6 space-y-6">
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                            {/* Calendario Lateral */}
                            <Card className="xl:col-span-4 border-none shadow-xl overflow-hidden bg-white">
                                <CardHeader className="bg-primary text-primary-foreground p-4">
                                    <CardTitle className="text-lg flex items-center">
                                        <CalendarDays className="w-5 h-5 mr-2" />
                                        Seleccionar Fecha
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={(date) => date && setSelectedDate(date)}
                                        locale={es}
                                        className="w-full"
                                    />

                                    {selectedTourId !== 'all' && (
                                        <div className="mt-6 pt-6 border-t">
                                            <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                                                <AlertCircle className="w-4 h-4 mr-2 text-primary" />
                                                Acciones de Disponibilidad
                                            </h4>
                                            <Button
                                                variant={isBlocked ? "outline" : "destructive"}
                                                className="w-full"
                                                onClick={handleToggleBlock}
                                                disabled={blockDateMutation.isPending || unblockDateMutation.isPending}
                                            >
                                                {isBlocked ? (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                                        Habilitar Día
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="w-4 h-4 mr-2" />
                                                        Bloquear Día
                                                    </>
                                                )}
                                            </Button>
                                            <p className="text-[10px] text-gray-500 mt-2 text-center italic">
                                                {isBlocked
                                                    ? "Este día está bloqueado para nuevas reservas."
                                                    : "Haz clic para evitar que se realicen nuevas reservas en este día."}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Contenido Principal: Reservas del día */}
                            <Card className="xl:col-span-8 border-none shadow-xl bg-white">
                                <CardHeader className="border-b bg-gray-50/50">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle className="text-xl">
                                                Reservas para el {selectedDate ? format(selectedDate, "d 'de' MMMM, yyyy", { locale: es }) : ''}
                                            </CardTitle>
                                            <p className="text-sm text-gray-500">
                                                {bookingsForDate?.length || 0} reservas encontradas
                                            </p>
                                        </div>
                                        {isBlocked && (
                                            <Badge variant="destructive" className="px-3 py-1">
                                                <XCircle className="w-3 h-3 mr-1" /> DÍA BLOQUEADO
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {isLoadingBookings ? (
                                        <div className="p-8 space-y-4">
                                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                                        </div>
                                    ) : bookingsForDate && bookingsForDate.length > 0 ? (
                                        <div className="divide-y">
                                            {bookingsForDate.map((booking) => {
                                                const tourName = tours?.find(t => t.id === booking.tourId)?.name || 'Tour Desconocido';
                                                return (
                                                    <div key={booking.id} className="p-4 md:p-6 hover:bg-gray-50 transition-colors">
                                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="font-bold text-gray-900">{booking.customerName}</h4>
                                                                    {getStatusBadge(booking.status)}
                                                                </div>
                                                                <p className="text-sm text-primary font-medium">{tourName}</p>
                                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                                    <div className="flex items-center">
                                                                        <Users className="w-3 h-3 mr-1" />
                                                                        {booking.adults} adultos, {booking.children} niños
                                                                    </div>
                                                                    <div className="flex items-center">
                                                                        <Clock className="w-3 h-3 mr-1" />
                                                                        Reserva #{booking.id}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-lg font-black text-gray-900">
                                                                    ${parseFloat(booking.totalAmount).toLocaleString()}
                                                                </div>
                                                                <div className="flex gap-2 justify-end mt-2">
                                                                    {isBlocked && booking.status !== 'pending_reschedule' && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className="text-orange-600 border-orange-200 hover:bg-orange-50"
                                                                            onClick={() => {
                                                                                const tomorrow = new Date(selectedDate);
                                                                                tomorrow.setDate(tomorrow.getDate() + 1);
                                                                                proposeRescheduleMutation.mutate({
                                                                                    bookingId: booking.id,
                                                                                    proposedDate: tomorrow,
                                                                                    reason: "Conflicto de disponibilidad en la fecha original"
                                                                                });
                                                                            }}
                                                                            disabled={proposeRescheduleMutation.isPending}
                                                                        >
                                                                            Resolver Conflicto
                                                                        </Button>
                                                                    )}
                                                                    {booking.status === 'pending_reschedule' && booking.rescheduleToken && (
                                                                        <>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                className="text-green-600 border-green-200 hover:bg-green-50"
                                                                                onClick={() => {
                                                                                    const url = `${window.location.origin}/resolve-booking/${booking.rescheduleToken}`;
                                                                                    const message = `Hola ${booking.customerName}, tenemos un pequeño ajuste en tu reserva de "${tourName}". Por favor, revisa y confirma la nueva fecha aquí: ${url}`;
                                                                                    const waUrl = `https://wa.me/${booking.customerPhone?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                                                                                    window.open(waUrl, '_blank');
                                                                                }}
                                                                            >
                                                                                <MessageCircle className="w-4 h-4 mr-2" />
                                                                                Enviar WhatsApp
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                className="text-primary text-[10px]"
                                                                                onClick={() => {
                                                                                    const url = `${window.location.origin}/resolve-booking/${booking.rescheduleToken}`;
                                                                                    navigator.clipboard.writeText(url);
                                                                                    toast({ title: "Enlace copiado", description: "Envía este enlace al cliente por WhatsApp." });
                                                                                }}
                                                                            >
                                                                                Copiar Link
                                                                            </Button>
                                                                        </>
                                                                    )}
                                                                    <Button variant="ghost" size="sm" className="text-gray-500">
                                                                        Detalles
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                                                <CalendarDays className="w-8 h-8 text-primary opacity-20" />
                                            </div>
                                            <h4 className="text-lg font-bold text-gray-900">No hay reservas</h4>
                                            <p className="text-sm text-gray-500 max-w-xs">
                                                No se encontraron reservas para esta combinación de fecha y tour.
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
