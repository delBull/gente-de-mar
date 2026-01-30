import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { usePublicTour } from "@/hooks/usePublicTours";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Users,
  MapPin,
  Star,
  Minus,
  Plus,
  CreditCard,
  Wallet,
  Check,
  AlertCircle,
  Heart,
  Share2
} from "lucide-react";
import { format, addDays, isAfter, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";

interface Tour {
  id: number;
  name: string;
  location: string;
  price: string;
  imageUrl?: string;
  description?: string;
  capacity: number;
  duration?: string;
  departureTime?: string;
  includes?: string[];
  requirements?: string;
  category: string;
  gallery?: string[];
}

export default function Booking() {
  const [, params] = useRoute("/book/:id");
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1); // 1: Info, 2: Fecha/Huéspedes, 3: Datos, 4: Pago

  // Formulario
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [healthIssues, setHealthIssues] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const tourId = params?.id ? parseInt(params.id) : null;

  const { data: tour, isLoading } = usePublicTour(tourId!);

  const bookingMutation = useMutation({
    mutationFn: async (data: {
      tourId: number;
      bookingDate: Date;
      adults: number;
      children: number;
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      specialRequests: string;
      totalAmount: string;
    }): Promise<any> => {
      return await apiRequest("POST", "/api/bookings", data);
    },
    onSuccess: (booking) => {
      toast({
        title: "¡Reserva exitosa!",
        description: "Tu ticket ha sido generado correctamente",
      });
      setLocation(`/ticket/${booking.id}`);
    },
    onError: () => {
      toast({
        title: "Error en la reserva",
        description: "No se pudo completar tu reserva. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  const totalGuests = adults + children;
  const pricePerPerson = tour ? parseFloat(tour.price) : 0;
  const totalPrice = pricePerPerson * totalGuests;

  const tomorrow = addDays(new Date(), 1);

  const handleDateSelect = (date: Date | undefined) => {
    if (date && (isTomorrow(date) || isAfter(date, tomorrow))) {
      setSelectedDate(date);
    }
  };

  const handleBooking = () => {
    if (!selectedDate || !customerName || !customerPhone) {
      toast({
        title: "Información incompleta",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    bookingMutation.mutate({
      tourId: tourId!,
      bookingDate: selectedDate,
      adults,
      children,
      customerName,
      customerEmail,
      customerPhone,
      specialRequests: `${specialRequests}${healthIssues ? `\nProblemas de salud: ${healthIssues}` : ''}`,
      totalAmount: totalPrice.toString(),
    });
  };

  const getDefaultImage = (tourName: string) => {
    if (tourName?.toLowerCase().includes('marietas')) {
      return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";
    }
    if (tourName?.toLowerCase().includes('pesca')) {
      return "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";
    }
    return "https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";
  };

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return '$0 MXN';
    return `$${numPrice.toLocaleString('es-MX')} MXN`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-6">
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Tour no encontrado</h2>
          <p className="text-muted-foreground mb-4">El tour que buscas no está disponible</p>
          <Button onClick={() => setLocation('/customer')} className="bg-primary hover:bg-primary/90">
            Volver a tours
          </Button>
        </div>
      </div>
    );

  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-border sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/customer')}
                className="w-10 h-10 rounded-xl p-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg font-bold text-foreground">Reservar Tour</h1>
                <p className="text-xs text-muted-foreground">Paso {step} de 4</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="w-10 h-10 rounded-xl p-0">
                <Heart className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="w-10 h-10 rounded-xl p-0">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="px-4 py-2">
        <div className="flex items-center space-x-2">
          {[1, 2, 3, 4].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center flex-1">
              <div className={`w-full h-2 rounded-full ${stepNumber <= step ? 'bg-primary' : 'bg-muted'
                }`} />
              {stepNumber < 4 && <div className="w-2" />}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pb-6">
        {/* Información del Tour */}
        <Card className="mb-6 overflow-hidden bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <div className="relative h-48">
            <img
              src={(tour as any).imageUrl || getDefaultImage((tour as any).name)}
              alt={(tour as any).name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <Badge className="bg-white/90 text-gray-800 text-xs mb-2">
                {(tour as any).category}
              </Badge>
              <h2 className="text-xl font-bold text-white mb-1">
                {(tour as any).name}
              </h2>
              <div className="flex items-center text-white/90 text-sm">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{(tour as any).location}</span>
              </div>
            </div>
          </div>

          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                {(tour as any).duration && (
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{(tour as any).duration}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  <span>Máx {(tour as any).capacity}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {formatPrice((tour as any).price)}
                </div>
                <div className="text-xs text-gray-500">por persona</div>
              </div>
            </div>

            <div className="flex items-center mb-3">
              <div className="flex text-yellow-400 mr-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-sm text-gray-600">4.9 (124 reseñas)</span>
            </div>

            <p className="text-gray-600 text-sm">
              {(tour as any).description}
            </p>
          </CardContent>
        </Card>

        {/* Contenido por pasos */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Incluye */}
            {(tour as any).includes && Array.isArray((tour as any).includes) && (tour as any).includes.length > 0 && (
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Check className="w-5 h-5 text-green-600 mr-2" />
                    Incluye
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-2">
                    {(tour as any).includes.map((item: any, index: any) => (
                      <div key={index} className="flex items-center text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Requisitos */}
            {(tour as any).requirements && (
              <Card className="bg-amber-50/70 backdrop-blur-sm border border-amber-200 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center text-amber-800">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Requisitos Importantes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-amber-800 text-sm">
                    {(tour as any).requirements}
                  </p>
                </CardContent>
              </Card>
            )}

            <Button
              onClick={() => setStep(2)}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white h-12 text-lg font-medium rounded-xl shadow-lg"
            >
              Continuar con la Reserva
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            {/* Selección de Fecha */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="w-5 h-5 mr-2" />
                  Selecciona la Fecha
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Solo puedes reservar para mañana en adelante
                </p>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => !isTomorrow(date) && !isAfter(date, tomorrow)}
                  locale={es}
                  className="rounded-xl"
                />
                {selectedDate && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                    <p className="text-sm font-medium text-blue-900">
                      Fecha seleccionada: {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: es })}
                    </p>
                    {tour?.departureTime && (
                      <p className="text-sm text-blue-700">
                        Hora de salida: {tour.departureTime}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Selección de Huéspedes */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Número de Huéspedes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Adultos</p>
                    <p className="text-sm text-gray-600">13 años o más</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAdults(Math.max(1, adults - 1))}
                      disabled={adults <= 1}
                      className="w-8 h-8 rounded-full p-0"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-lg font-medium w-8 text-center">{adults}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (tour && totalGuests < tour.capacity) {
                          setAdults(adults + 1);
                        }
                      }}
                      disabled={!tour || totalGuests >= tour.capacity}
                      className="w-8 h-8 rounded-full p-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Niños</p>
                    <p className="text-sm text-gray-600">2-12 años</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setChildren(Math.max(0, children - 1))}
                      disabled={children <= 0}
                      className="w-8 h-8 rounded-full p-0"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-lg font-medium w-8 text-center">{children}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (tour && totalGuests < tour.capacity) {
                          setChildren(children + 1);
                        }
                      }}
                      disabled={!tour || totalGuests >= tour.capacity}
                      className="w-8 h-8 rounded-full p-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {tour && totalGuests >= tour.capacity && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-sm text-amber-800">
                      Has alcanzado la capacidad máxima del tour ({tour.capacity} personas)
                    </p>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total</span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {adults} adulto{adults !== 1 ? 's' : ''} {children > 0 && ` + ${children} niño${children !== 1 ? 's' : ''}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatPrice(pricePerPerson)} × {totalGuests} persona{totalGuests !== 1 ? 's' : ''}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex space-x-3">
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                className="flex-1 h-12 rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm hover:bg-white hover:shadow-sm transition-all"
              >
                Atrás
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!selectedDate || totalGuests === 0}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white h-12 rounded-xl"
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            {/* Información de Contacto */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Información de Contacto</CardTitle>
                <p className="text-sm text-gray-600">
                  Necesitamos estos datos para confirmar tu reserva
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre completo *</Label>
                  <Input
                    id="name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ingresa tu nombre completo"
                    className="mt-1 h-12 rounded-xl bg-white/50 backdrop-blur-sm border-gray-200"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+52 322 123 4567"
                    className="mt-1 h-12 rounded-xl bg-white/50 backdrop-blur-sm border-gray-200"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email (opcional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="mt-1 h-12 rounded-xl bg-white/50 backdrop-blur-sm border-gray-200"
                  />
                </div>

                <div>
                  <Label htmlFor="health">Problemas de salud o alergias</Label>
                  <Textarea
                    id="health"
                    value={healthIssues}
                    onChange={(e) => setHealthIssues(e.target.value)}
                    placeholder="Menciona cualquier condición médica relevante..."
                    className="mt-1 rounded-xl bg-white/50 backdrop-blur-sm border-gray-200 text-black placeholder:text-gray-500"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="requests">Solicitudes especiales</Label>
                  <Textarea
                    id="requests"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Celebración, preferencias de asiento, etc."
                    className="mt-1 rounded-xl bg-white/50 backdrop-blur-sm border-gray-200 text-black placeholder:text-gray-500"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Resumen de Reserva en Paso 3 */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Resumen de tu Reserva</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tour:</span>
                  <span className="font-medium text-black">{tour?.name}</span>
                </div>
                {selectedDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha:</span>
                    <span className="font-medium text-black">
                      {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: es })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Huéspedes:</span>
                  <span className="font-medium text-black">
                    {adults} adulto{adults !== 1 ? 's' : ''} {children > 0 && ` + ${children} niño${children !== 1 ? 's' : ''}`}
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-black">Total:</span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 text-right">
                    {formatPrice(pricePerPerson)} × {totalGuests} persona{totalGuests !== 1 ? 's' : ''}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex space-x-3">
              <Button
                variant="ghost"
                onClick={() => setStep(2)}
                className="flex-1 h-12 rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm hover:bg-white hover:shadow-sm transition-all"
              >
                Atrás
              </Button>
              <Button
                onClick={() => setStep(4)}
                disabled={!customerName || !customerPhone}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white h-12 rounded-xl"
              >
                Continuar al Pago
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            {/* Resumen de Reserva */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Resumen de tu Reserva</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tour:</span>
                  <span className="font-medium text-black">{tour?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha:</span>
                  <span className="font-medium text-black">
                    {selectedDate ? format(selectedDate, "dd MMM yyyy", { locale: es }) : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Huéspedes:</span>
                  <span className="font-medium text-black">
                    {adults} adulto{adults !== 1 ? 's' : ''} {children > 0 && `+ ${children} niño${children !== 1 ? 's' : ''}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Contacto:</span>
                  <span className="font-medium text-black">{customerName}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-black">Total:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Opciones de Pago */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-black">Método de Pago</CardTitle>
                <p className="text-sm text-gray-600">
                  Elige cómo prefieres pagar tu reserva
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => {
                    if (!selectedDate || !customerName || !customerPhone) {
                      toast({
                        title: "Información incompleta",
                        description: "Por favor completa todos los campos requeridos",
                        variant: "destructive",
                      });
                      return;
                    }

                    const bookingPayload = {
                      tourId: tourId!,
                      bookingDate: selectedDate,
                      adults,
                      children,
                      customerName,
                      customerEmail,
                      customerPhone,
                      specialRequests: `${specialRequests}${healthIssues ? `\nProblemas de salud: ${healthIssues}` : ''}`,
                      totalAmount: totalPrice.toString(),
                    };

                    setLocation(`/payment/${encodeURIComponent(JSON.stringify(bookingPayload))}`);
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white h-14 text-lg font-medium rounded-xl shadow-lg"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Proceder al Pago Seguro
                </Button>
              </CardContent>
            </Card>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setStep(3)}
                className="flex-1 h-12 rounded-xl bg-white/50 backdrop-blur-sm border-gray-200 text-black hover:bg-white/70"
                disabled={bookingMutation.isPending}
              >
                Atrás
              </Button>
            </div>

            <div className="text-center text-xs text-gray-500">
              Al confirmar tu reserva aceptas nuestros términos y condiciones
            </div>
          </div>
        )}
      </div>
    </div>
  );
}