import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import DigitalTicketPremium from "@/components/digital-ticket-premium";
import { generateBookingReceipt } from "@/lib/receipt-generator";
import { CheckCircle, ArrowLeft, Home, Calendar, Users, MapPin, Phone, Mail, FileText, Download } from "lucide-react";

interface BookingDetails {
  id: number;
  qrCode: string;
  alphanumericCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  bookingDate: string;
  adults: number;
  children: number;
  totalAmount: string;
  status: string;
  specialRequests?: string;
  tour?: {
    name: string;
    location: string;
    duration?: string;
    departureTime?: string;
    description?: string;
    imageUrl?: string;
    includes?: string[];
    requirements?: string;
  };
}

export default function BookingSuccess() {
  const [match, params] = useRoute("/booking-success/:bookingId");
  const bookingId = params?.bookingId;
  const [confettiShown, setConfettiShown] = useState(false);

  const { data: booking, isLoading, error } = useQuery<BookingDetails>({
    queryKey: [`/api/bookings/${bookingId}`],
    enabled: !!bookingId,
  });



  // Simple confetti effect
  useEffect(() => {
    if (booking && !confettiShown) {
      setConfettiShown(true);
      // Create simple celebration effect
      const duration = 3000;
      const animationEnd = Date.now() + duration;

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        // Create celebration particles
        for (let i = 0; i < 3; i++) {
          const particle = document.createElement('div');
          particle.style.position = 'fixed';
          particle.style.left = randomInRange(10, 90) + '%';
          particle.style.top = '0px';
          particle.style.width = '8px';
          particle.style.height = '8px';
          particle.style.backgroundColor = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b'][Math.floor(Math.random() * 4)];
          particle.style.borderRadius = '50%';
          particle.style.pointerEvents = 'none';
          particle.style.zIndex = '9999';
          particle.style.animation = 'fall 3s linear forwards';

          document.body.appendChild(particle);

          setTimeout(() => {
            particle.remove();
          }, 3000);
        }
      }, 150);

      // Add CSS animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);

      return () => {
        clearInterval(interval);
        style.remove();
      };
    }
  }, [booking, confettiShown]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!match) {
    return (
      <div className="container mx-auto p-4">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <p>Reservación no encontrada</p>
            <Link href="/customer">
              <Button className="mt-4">Volver al inicio</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container mx-auto p-4">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold">Error al cargar reservación</h2>
            <p className="text-gray-600">No pudimos encontrar los detalles de tu reservación</p>
            <Link href="/customer">
              <Button>Volver al inicio</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="container mx-auto p-4 space-y-6">
        {/* Header with success message */}
        <div className="text-center space-y-4 pt-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">¡Reservación Confirmada!</h1>
            <p className="text-lg text-gray-600">Tu aventura en {booking.tour?.name} está asegurada</p>
          </div>
          <Badge className="bg-green-100 text-green-800 px-4 py-2 text-sm">
            Confirmación #{booking.id}
          </Badge>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Booking Details */}
          <div className="space-y-6">
            {/* Tour Information */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span>Detalles del Tour</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {booking.tour?.imageUrl && (
                  <img
                    src={booking.tour.imageUrl}
                    alt={booking.tour.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{booking.tour?.name}</h3>
                  <p className="text-gray-600 flex items-center mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {booking.tour?.location}
                  </p>
                </div>

                {booking.tour?.description && (
                  <p className="text-gray-700">{booking.tour.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {booking.tour?.duration && (
                    <div>
                      <span className="font-medium text-gray-700">Duración:</span>
                      <p className="text-gray-900">{booking.tour.duration}</p>
                    </div>
                  )}
                  {booking.tour?.departureTime && (
                    <div>
                      <span className="font-medium text-gray-700">Salida:</span>
                      <p className="text-gray-900">{booking.tour.departureTime}</p>
                    </div>
                  )}
                </div>

                {booking.tour?.includes && booking.tour.includes.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-700 block mb-2">Incluye:</span>
                    <ul className="text-sm space-y-1">
                      {booking.tour.includes.map((item, index) => (
                        <li key={index} className="flex items-center text-gray-900">
                          <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Booking Information */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span>Información de Reserva</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Fecha del tour:</span>
                    <span className="font-medium text-gray-900">{formatDate(booking.bookingDate)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Participantes:</span>
                    <span className="font-medium flex items-center text-gray-900">
                      <Users className="w-4 h-4 mr-1" />
                      {booking.adults} adultos{booking.children > 0 && `, ${booking.children} niños`}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Contacto principal:</span>
                    <span className="font-medium text-gray-900">{booking.customerName}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Teléfono:</span>
                    <span className="font-medium flex items-center text-gray-900">
                      <Phone className="w-4 h-4 mr-1" />
                      {booking.customerPhone}
                    </span>
                  </div>

                  {booking.customerEmail && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Email:</span>
                      <span className="font-medium flex items-center text-gray-900">
                        <Mail className="w-4 h-4 mr-1" />
                        {booking.customerEmail}
                      </span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between text-lg">
                    <span className="font-bold text-gray-900">Total pagado:</span>
                    <span className="font-bold text-green-600">${booking.totalAmount}</span>
                  </div>
                </div>

                {booking.specialRequests && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium text-gray-700 block mb-1">Solicitudes especiales:</span>
                    <p className="text-sm text-gray-600">{booking.specialRequests}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Digital Ticket Section */}
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-center">Tu Ticket Digital</CardTitle>
                <p className="text-center text-gray-600">
                  Presenta este ticket el día del tour
                </p>
              </CardHeader>
              <CardContent>
                <DigitalTicketPremium booking={booking} />
              </CardContent>
            </Card>

            {/* Important Information */}
            <Card className="bg-amber-50 border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-800">Información Importante</CardTitle>
              </CardHeader>
              <CardContent className="text-amber-700 space-y-2 text-sm">
                <p>• Llega 15 minutos antes de la hora de salida</p>
                <p>• Presenta tu ticket digital o código alfanumérico</p>
                <p>• Trae identificación oficial</p>
                <p>• Se recomienda usar ropa cómoda y protector solar</p>
                {booking.tour?.requirements && (
                  <p>• {booking.tour.requirements}</p>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800">¿Necesitas ayuda?</CardTitle>
              </CardHeader>
              <CardContent className="text-blue-700 space-y-2 text-sm">
                <p>Si tienes preguntas sobre tu reservación:</p>
                <p>• WhatsApp: +52 322 123 4567</p>
                <p>• Email: info@bookeros.com</p>
                <p>• Horario: 8:00 AM - 8:00 PM</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-4 pt-6">
          <div className="flex-1">
            <Button
              onClick={() => {
                if (booking) {
                  generateBookingReceipt({
                    bookingId: booking.id,
                    customerName: booking.customerName,
                    customerEmail: booking.customerEmail,
                    tourName: booking.tour?.name || "Tour",
                    bookingDate: booking.bookingDate,
                    amount: booking.totalAmount,
                    adults: booking.adults,
                    children: booking.children
                  });
                }
              }}
              variant="outline"
              className="w-full h-12 text-blue-900 border-blue-200 bg-blue-50 hover:bg-blue-100"
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar Recibo
            </Button>
          </div>
          <Link href="/customer" className="flex-1">
            <Button variant="outline" className="w-full h-12 text-gray-900 border-gray-300 hover:bg-gray-50">
              <Home className="w-4 h-4 mr-2" />
              Volver al Inicio
            </Button>
          </Link>
          <Link href="/customer" className="flex-1">
            <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white">
              <Calendar className="w-4 h-4 mr-2" />
              Reservar Otro Tour
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}