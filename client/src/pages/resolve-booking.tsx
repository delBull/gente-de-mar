import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { CalendarDays, MapPin, Users, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

interface Booking {
    id: number;
    tourId: number;
    bookingDate: string;
    customerName: string;
    adults: number;
    children: number;
    status: string;
    totalAmount: string;
    proposedDate?: string;
    rescheduleReason?: string;
}

interface Tour {
    id: number;
    name: string;
    description: string;
    mainImage: string;
}

export default function ResolveBooking() {
    const [, params] = useRoute("/resolve-booking/:token");
    const token = params?.token;
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [view, setView] = useState<'decision' | 'calendar'>('decision');

    const { data, isLoading } = useQuery<{ booking: Booking; tour: Tour }>({
        queryKey: [`/api/bookings/resolve/${token}`],
        enabled: !!token,
    });

    const resolveMutation = useMutation({
        mutationFn: async (payload: { action: 'accept' | 'select_new'; selectedDate?: Date }) => {
            return await apiRequest("POST", `/api/bookings/resolve/${token}`, payload);
        },
        onSuccess: () => {
            toast({
                title: "Reserva actualizada!",
                description: "Tu reserva ha sido re-programada con éxito. Te esperamos!",
            });
            setTimeout(() => setLocation("/customer"), 2000);
        },
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <Skeleton className="h-8 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center p-8">
                    <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold">Enlace inválido o expirado</h2>
                    <p className="text-gray-500 mt-2">Por favor contacta al proveedor para recibir un nuevo enlace.</p>
                </Card>
            </div>
        );
    }

    const { booking, tour } = data;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-8">
            <div className="w-full max-w-xl space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-black text-gray-900 mb-2">Ajuste de Tu Reserva</h1>
                    <p className="text-gray-600">Hola {booking.customerName}, el proveedor ha solicitado un cambio en la fecha.</p>
                </div>

                <Card className="overflow-hidden border-none shadow-2xl">
                    <div className="relative h-48 w-full">
                        <img
                            src={tour.mainImage}
                            alt={tour.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-end p-6">
                            <h2 className="text-white text-xl font-bold">{tour.name}</h2>
                        </div>
                    </div>

                    <CardContent className="p-6 space-y-6">
                        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex gap-4">
                            <div className="bg-orange-100 p-3 rounded-full h-fit">
                                <AlertTriangle className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-orange-900">Motivo del ajuste</h4>
                                <p className="text-orange-800 text-sm">{booking.rescheduleReason || "Conflicto de disponibilidad"}</p>
                            </div>
                        </div>

                        {view === 'decision' ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl border-2 border-gray-100 bg-gray-50/50">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Fecha Original</p>
                                        <div className="flex items-center text-gray-400 line-through text-sm">
                                            <CalendarDays className="w-4 h-4 mr-2" />
                                            {format(new Date(booking.bookingDate), "d MMM, yyyy", { locale: es })}
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl border-2 border-primary bg-primary/5">
                                        <p className="text-[10px] text-primary uppercase font-bold mb-1">Nueva Propuesta</p>
                                        <div className="flex items-center text-primary font-bold text-sm">
                                            <CalendarDays className="w-4 h-4 mr-2" />
                                            {booking.proposedDate ? format(new Date(booking.proposedDate), "d MMM, yyyy", { locale: es }) : 'N/A'}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 space-y-3">
                                    <Button
                                        className="w-full h-14 text-lg font-bold shadow-lg"
                                        onClick={() => resolveMutation.mutate({ action: 'accept' })}
                                        disabled={resolveMutation.isPending}
                                    >
                                        <CheckCircle2 className="w-5 h-5 mr-2" />
                                        Aceptar Nueva Fecha
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full h-14 text-lg font-medium border-gray-200"
                                        onClick={() => setView('calendar')}
                                    >
                                        Elegir Otra Fecha
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="text-center mb-4">
                                    <h4 className="font-bold text-gray-900">Selecciona tu nueva disponibilidad</h4>
                                    <p className="text-xs text-gray-500 italic">No se aplicarán cargos adicionales</p>
                                </div>

                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    locale={es}
                                    className="rounded-md border mx-auto"
                                    disabled={(date) => date < new Date() || date.toDateString() === new Date(booking.bookingDate).toDateString()}
                                />

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        variant="ghost"
                                        className="flex-1"
                                        onClick={() => setView('decision')}
                                    >
                                        Regresar
                                    </Button>
                                    <Button
                                        className="flex-[2]"
                                        disabled={!selectedDate || resolveMutation.isPending}
                                        onClick={() => resolveMutation.mutate({ action: 'select_new', selectedDate })}
                                    >
                                        Confirmar Nueva Fecha
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="flex justify-center gap-8 text-xs text-gray-400">
                    <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        Soporte WhatsApp
                    </div>
                    <div className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        Gente De Mar
                    </div>
                </div>
            </div>
        </div>
    );
}
