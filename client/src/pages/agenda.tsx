import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { CalendarDays, Clock, Users, XCircle, CheckCircle2, AlertCircle, MessageCircle, FileText, CheckSquare, Download } from "lucide-react";
import MobileSidebar from "@/components/mobile-sidebar";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Booking {
    id: number;
    tourId: number;
    bookingDate: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    adults: number;
    children: number;
    status: string;
    totalAmount: string;
    rescheduleReason?: string;
    rescheduleToken?: string;
    alphanumericCode?: string;
    nationality?: string;
    checkedIn?: boolean;
    qrCode?: string;
}

interface Tour {
    id: number;
    name: string;
    capacity: number;
}

interface AvailabilityOverride {
    id: number;
    tourId: number;
    date: string;
    isAvailable: boolean;
    customCapacity?: number;
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
        queryKey: selectedTourId !== 'all' ? [`/api/tours/${selectedTourId}/availability-overrides`] : ["/api/availability-overrides"], // Fetch all if 'all' to visualize blocks
    });

    // Calculations for Visual Calendar
    const dayStatus = useMemo(() => {
        if (!bookings || !tours) return {};

        const statusMap: Record<string, 'free' | 'busy' | 'full' | 'blocked'> = {};

        // This is a simplified calculation. Ideally, do this per tour.
        // If "Use All" is selected, we aggregate.

        bookings.forEach(b => {
            const dateKey = new Date(b.bookingDate).toDateString();
            // In a real app with many bookings, group by date first
        });

        return statusMap;
    }, [bookings, tours]);


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
        new Date(o.date).toDateString() === dateString &&
        (selectedTourId === 'all' || o.tourId === selectedTourId)
    );

    const isBlocked = overrideForDate && !overrideForDate.isAvailable;

    // Generate Manifest PDF
    const generateManifest = () => {
        if (!bookingsForDate || bookingsForDate.length === 0) {
            toast({ title: "Sin datos", description: "No hay reservas para generar el manifiesto.", variant: "destructive" });
            return;
        }

        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.text("Manifiesto de Pasajeros", 14, 20);

        doc.setFontSize(12);
        doc.text(`Fecha: ${format(selectedDate, "dd/MM/yyyy")}`, 14, 30);

        const tourName = selectedTourId === 'all' ? "Todos los Tours" : tours?.find(t => t.id === selectedTourId)?.name || "Tour";
        doc.text(`Tour: ${tourName}`, 14, 36);
        doc.text(`Total Pasajeros: ${bookingsForDate.reduce((acc, b) => acc + b.adults + b.children, 0)}`, 14, 42);

        // Table
        const tableData = bookingsForDate.flatMap(b => {
            // Create a row for each group, or expand if we had individual names. 
            // Since we only have "Lead Passenger", we list them.
            // Ideally we would ask for all names. For now, we list Lead Name + Count.
            return [
                [b.id, b.customerName, b.nationality || 'N/A', `${b.adults + b.children} pax`, b.checkedIn ? 'SI' : 'NO', b.qrCode?.substring(0, 8) || '-']
            ];
        });

        autoTable(doc, {
            head: [['Ref', 'Nombre Principal', 'Nacionalidad', 'Cantidad', 'Abordó', 'Ticket']],
            body: tableData,
            startY: 50,
        });

        doc.save(`Manifiesto_${format(selectedDate, "yyyy-MM-dd")}.pdf`);

        toast({ title: "Manifiesto Descargado", description: "El PDF se ha generado correctamente." });
    };

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
            case 'completed':
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100/80 border-blue-200">Completado</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    // Custom Calendar Modifiers
    // We want to highlight days with bookings
    const modifiers = {
        booked: (date: Date) => {
            return bookings?.some(b => isSameDay(new Date(b.bookingDate), date) && (selectedTourId === 'all' || b.tourId === selectedTourId));
        },
        blocked: (date: Date) => {
            return overrides?.some(o => isSameDay(new Date(o.date), date) && !o.isAvailable && (selectedTourId === 'all' || o.tourId === selectedTourId));
        }
    };

    const modifiersStyles = {
        booked: { fontWeight: 'bold', color: 'var(--primary)', textDecoration: 'underline' },
        blocked: { color: 'red', textDecoration: 'line-through' }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <MobileSidebar />

            <div className={mainContainerClasses}>
                <div className={contentClasses}>
                    <header className="bg-white border-b border-gray-200 p-4 md:p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="pl-16 md:pl-0">
                                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Agenda & Operaciones</h2>
                                <p className="text-sm text-gray-600">Control de Manifiestos, Check-in y Disponibilidad</p>
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
                                        modifiers={modifiers as any}
                                        modifiersStyles={modifiersStyles}
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

                            {/* Contenido Principal: Reservas y Manifiesto */}
                            <Card className="xl:col-span-8 border-none shadow-xl bg-white">
                                <CardHeader className="border-b bg-gray-50/50">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div>
                                            <CardTitle className="text-xl">
                                                Operaciones del {selectedDate ? format(selectedDate, "d 'de' MMMM, yyyy", { locale: es }) : ''}
                                            </CardTitle>
                                            <div className="flex gap-2 mt-1">
                                                <Badge variant="outline" className="text-gray-600">
                                                    {bookingsForDate?.length || 0} reservas
                                                </Badge>
                                                <Badge variant="outline" className="text-gray-600">
                                                    {(bookingsForDate?.reduce((acc, b) => acc + b.adults + b.children, 0)) || 0} pax
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {bookingsForDate && bookingsForDate.length > 0 && (
                                                <Button variant="outline" onClick={generateManifest} className="gap-2">
                                                    <FileText className="w-4 h-4" />
                                                    <span className="hidden sm:inline">Manifiesto (PDF)</span>
                                                </Button>
                                            )}
                                            {isBlocked && (
                                                <Badge variant="destructive" className="px-3 py-1 self-center">
                                                    <XCircle className="w-3 h-3 mr-1" /> DÍA BLOQUEADO
                                                </Badge>
                                            )}
                                        </div>
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
                                                                    {booking.checkedIn && (
                                                                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1">
                                                                            <CheckSquare className="w-3 h-3" /> Abordó
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-primary font-medium">{tourName}</p>
                                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                                    <div className="flex items-center">
                                                                        <Users className="w-3 h-3 mr-1" />
                                                                        {booking.adults} adultos, {booking.children} niños
                                                                    </div>
                                                                    <div className="flex items-center">
                                                                        <span className="font-mono bg-gray-100 px-1 rounded">{booking.qrCode?.substring(0, 8) || 'NO-QR'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-lg font-black text-gray-900">
                                                                    ${parseFloat(booking.totalAmount).toLocaleString()}
                                                                </div>
                                                                <div className="flex flex-wrap gap-2 justify-end mt-2">
                                                                    {/* WhatsApp Button */}
                                                                    {booking.customerPhone && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className="text-green-600 border-green-200 hover:bg-green-50"
                                                                            onClick={() => {
                                                                                const message = `Hola ${booking.customerName}, aquí tienes tus boletos para ${tourName}. Tu código es: ${booking.alphanumericCode || booking.qrCode}`;
                                                                                const waUrl = `https://wa.me/${booking.customerPhone?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                                                                                window.open(waUrl, '_blank');
                                                                            }}
                                                                        >
                                                                            <MessageCircle className="w-4 h-4" />
                                                                        </Button>
                                                                    )}

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
                                                                            Re-programar
                                                                        </Button>
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
                                            <h4 className="text-lg font-bold text-gray-900">Sin Operaciones</h4>
                                            <p className="text-sm text-gray-500 max-w-xs">
                                                No hay salidas programadas para este día.
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
