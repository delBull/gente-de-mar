import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Download,
  Share2,
  Printer,
  Calendar,
  MapPin,
  Clock,
  Users,
  Phone,
  Mail,
  Camera,
  Wallet,
  Star,
  CheckCircle,
  Anchor,
  Waves
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  TelegramShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon,
  TelegramIcon,
} from "react-share";

interface BookingDetails {
  id: number;
  tourId: number;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  bookingDate: Date;
  adults: number;
  children: number;
  totalAmount: string;
  status: string;
  qrCode: string;
  specialRequests: string | null;
  tour: {
    name: string;
    location: string;
    duration: string | null;
    departureTime: string | null;
    description: string | null;
    imageUrl: string | null;
    includes: string[] | null;
    requirements: string | null;
  } | null;
}

export default function Ticket() {
  const params = useParams();
  const bookingId = params.id ? parseInt(params.id) : null;
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const ticketRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const { data: booking, isLoading, error } = useQuery<BookingDetails>({
    queryKey: [`/api/bookings/${bookingId}`],
    enabled: !!bookingId,
  });

  useEffect(() => {
    if (booking?.qrCode && qrCanvasRef.current) {
      const qrData = JSON.stringify({
        bookingId: booking.id,
        tourName: booking.tour?.name,
        customerName: booking.customerName,
        date: booking.bookingDate,
        guests: booking.adults + booking.children,
        qrCode: booking.qrCode
      });

      QRCode.toCanvas(qrCanvasRef.current, qrData, {
        width: 180,
        margin: 2,
        color: {
          dark: '#1e40af',
          light: '#ffffff'
        }
      });
    }
  }, [booking]);

  const downloadAsImage = async () => {
    if (!ticketRef.current || !booking) return;

    setIsDownloading(true);
    try {
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });

      const link = document.createElement('a');
      link.download = `ticket-${booking.tour?.name}-${booking.id}.png`;
      link.href = canvas.toDataURL();
      link.click();

      toast({
        title: "¡Descarga completada!",
        description: "Tu ticket se ha guardado como imagen",
      });
    } catch (error) {
      toast({
        title: "Error al descargar",
        description: "No se pudo generar la imagen",
        variant: "destructive",
      });
    }
    setIsDownloading(false);
  };

  const downloadAsPDF = async () => {
    if (!ticketRef.current || !booking) return;

    setIsDownloading(true);
    try {
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`ticket-${booking.tour?.name}-${booking.id}.pdf`);

      toast({
        title: "¡PDF generado!",
        description: "Tu ticket se ha guardado como PDF",
      });
    } catch (error) {
      toast({
        title: "Error al generar PDF",
        description: "No se pudo crear el archivo PDF",
        variant: "destructive",
      });
    }
    setIsDownloading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const addToAppleWallet = () => {
    if (!booking) return;

    // Create a basic passbook pass URL for Apple Wallet
    const passData = {
      formatVersion: 1,
      passTypeIdentifier: "pass.com.bookeros.ticket",
      serialNumber: booking.id.toString(),
      teamIdentifier: "BOOKEROS",
      organizationName: "BookerOS",
      description: `Tour: ${booking.tour?.name}`,
      logoText: "BookerOS",
      foregroundColor: "rgb(255, 255, 255)",
      backgroundColor: "rgb(30, 64, 175)",
      labelColor: "rgb(255, 255, 255)",
      generic: {
        primaryFields: [
          {
            key: "tour",
            label: "TOUR",
            value: booking.tour?.name || "Tour"
          }
        ],
        secondaryFields: [
          {
            key: "date",
            label: "FECHA",
            value: format(new Date(booking.bookingDate), "dd MMM yyyy", { locale: es })
          },
          {
            key: "time",
            label: "HORA",
            value: booking.tour?.departureTime || "Por confirmar"
          }
        ],
        auxiliaryFields: [
          {
            key: "guests",
            label: "HUÉSPEDES",
            value: `${booking.adults + booking.children} personas`
          },
          {
            key: "location",
            label: "UBICACIÓN",
            value: booking.tour?.location || "Puerto Vallarta"
          }
        ]
      },
      barcode: {
        message: booking.qrCode,
        format: "PKBarcodeFormatQR",
        messageEncoding: "iso-8859-1"
      }
    };

    // For now, show instructions to user
    toast({
      title: "Apple Wallet",
      description: "Mantén presionado el código QR para agregarlo a Apple Wallet, o contacta a soporte de BookerOS para obtener el pase oficial.",
    });
  };

  const addToGoogleWallet = () => {
    if (!booking) return;

    // Google Pay API would require server-side implementation
    toast({
      title: "Google Wallet",
      description: "Guarda la imagen del ticket o contacta a soporte de BookerOS para obtener el pase oficial.",
    });
  };

  const shareText = booking ? `🌊 ¡Mi reserva confirmada en BookerOS!
🎫 Tour: ${booking.tour?.name}
📅 Fecha: ${format(new Date(booking.bookingDate), "dd 'de' MMMM yyyy", { locale: es })}
👥 ${booking.adults} adulto${booking.adults !== 1 ? 's' : ''} ${booking.children > 0 ? `+ ${booking.children} niño${booking.children !== 1 ? 's' : ''}` : ''}
📍 ${booking.tour?.location}

¡Nos vemos en el tour! 🚤✨` : '';

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ticket no encontrado</h2>
          <p className="text-gray-600 mb-6">No se pudo encontrar la información de tu reserva</p>
          <Button onClick={() => window.history.back()}>
            Volver
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #ticket-content, #ticket-content * {
            visibility: visible;
          }
          #ticket-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="container mx-auto px-4 py-8">
        {/* Header with Actions */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-center mb-8 no-print"
        >
          <div className="text-center sm:text-left mb-4 sm:mb-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">¡Reserva Confirmada!</h1>
            <p className="text-gray-600">Tu aventura gestionada por BookerOS te espera</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={downloadAsImage}
              disabled={isDownloading}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              {isDownloading ? "Generando..." : "Imagen"}
            </Button>

            <Button
              onClick={downloadAsPDF}
              disabled={isDownloading}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              PDF
            </Button>

            <Button
              onClick={handlePrint}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </Button>

            <div className="relative">
              <Button
                onClick={() => setShowShareMenu(!showShareMenu)}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Share2 className="w-4 h-4" />
                Compartir
              </Button>

              <AnimatePresence>
                {showShareMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute left-0 mt-2 p-4 bg-white rounded-lg shadow-lg border z-50 min-w-[240px]"
                  >
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <WhatsappShareButton url={shareUrl} title={shareText}>
                        <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
                          <WhatsappIcon size={20} round />
                          <span className="text-sm">WhatsApp</span>
                        </div>
                      </WhatsappShareButton>

                      <FacebookShareButton url={shareUrl}>
                        <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
                          <FacebookIcon size={20} round />
                          <span className="text-sm">Facebook</span>
                        </div>
                      </FacebookShareButton>

                      <TwitterShareButton url={shareUrl} title={shareText}>
                        <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
                          <TwitterIcon size={20} round />
                          <span className="text-sm">Twitter</span>
                        </div>
                      </TwitterShareButton>

                      <TelegramShareButton url={shareUrl} title={shareText}>
                        <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
                          <TelegramIcon size={20} round />
                          <span className="text-sm">Telegram</span>
                        </div>
                      </TelegramShareButton>
                    </div>

                    <div className="border-t pt-3 space-y-2">
                      <Button
                        onClick={addToAppleWallet}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                      >
                        <Wallet className="w-4 h-4 mr-2" />
                        Apple Wallet
                      </Button>

                      <Button
                        onClick={addToGoogleWallet}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                      >
                        <Wallet className="w-4 h-4 mr-2" />
                        Google Wallet
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Main Ticket */}
        <motion.div
          ref={ticketRef}
          id="ticket-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <Card className="overflow-hidden bg-white shadow-2xl">
            {/* Ticket Header */}
            <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 text-white">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative px-6 py-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Anchor className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black italic tracking-tighter">BookerOS</h2>
                      <p className="text-blue-100 text-xs uppercase tracking-widest font-bold">Tours & Adventures</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500 text-white border-0">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Confirmado
                  </Badge>
                </div>

                <div className="text-center">
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">{booking.tour?.name}</h1>
                  <p className="text-blue-100 text-lg">{booking.tour?.description}</p>
                </div>
              </div>

              {/* Wave decoration */}
              <div className="absolute bottom-0 left-0 w-full overflow-hidden">
                <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-8">
                  <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z" className="fill-white"></path>
                </svg>
              </div>
            </div>

            {/* Ticket Body */}
            <div className="p-6 md:p-8">
              <div className="grid md:grid-cols-3 gap-8">
                {/* Left Column - Details */}
                <div className="md:col-span-2 space-y-6">
                  {/* Tour Image */}
                  {booking.tour?.imageUrl && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                      className="relative rounded-lg overflow-hidden h-48 md:h-64"
                    >
                      <img
                        src={booking.tour.imageUrl}
                        alt={booking.tour.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    </motion.div>
                  )}

                  {/* Trip Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg"
                    >
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Fecha del Tour</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {format(new Date(booking.bookingDate), "dd 'de' MMMM, yyyy", { locale: es })}
                        </p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                      className="flex items-center space-x-3 p-4 bg-cyan-50 rounded-lg"
                    >
                      <Clock className="w-5 h-5 text-cyan-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Hora de Salida</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {booking.tour?.departureTime || "Por confirmar"}
                        </p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                      className="flex items-center space-x-3 p-4 bg-teal-50 rounded-lg"
                    >
                      <MapPin className="w-5 h-5 text-teal-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Ubicación</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {booking.tour?.location || "Puerto Vallarta"}
                        </p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 }}
                      className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg"
                    >
                      <Users className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Huéspedes</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {booking.adults} adulto{booking.adults !== 1 ? 's' : ''}
                          {booking.children > 0 && ` + ${booking.children} niño${booking.children !== 1 ? 's' : ''}`}
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Customer Info */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-gray-50 rounded-lg p-4"
                  >
                    <h3 className="font-semibold text-gray-900 mb-3">Información del Cliente</h3>
                    <div className="space-y-2">
                      <p className="text-gray-700">
                        <Users className="w-4 h-4 inline mr-2" />
                        {booking.customerName}
                      </p>
                      {booking.customerEmail && (
                        <p className="text-gray-700">
                          <Mail className="w-4 h-4 inline mr-2" />
                          {booking.customerEmail}
                        </p>
                      )}
                      {booking.customerPhone && (
                        <p className="text-gray-700">
                          <Phone className="w-4 h-4 inline mr-2" />
                          {booking.customerPhone}
                        </p>
                      )}
                    </div>
                  </motion.div>

                  {/* Special Requests */}
                  {booking.specialRequests && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 }}
                      className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
                    >
                      <h3 className="font-semibold text-gray-900 mb-2">Solicitudes Especiales</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">{booking.specialRequests}</p>
                    </motion.div>
                  )}

                  {/* What's Included */}
                  {booking.tour?.includes && booking.tour.includes.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.0 }}
                      className="bg-green-50 rounded-lg p-4"
                    >
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Star className="w-5 h-5 mr-2 text-green-600" />
                        Incluido en tu Tour
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {booking.tour.includes.map((item, index) => (
                          <div key={index} className="flex items-center text-gray-700">
                            <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Right Column - QR Code and Summary */}
                <div className="space-y-6">
                  {/* QR Code */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-center bg-gray-50 rounded-lg p-6"
                  >
                    <h3 className="font-semibold text-gray-900 mb-4">Código de Verificación</h3>
                    <div className="flex justify-center mb-4">
                      <canvas ref={qrCanvasRef} className="border-2 border-white rounded-lg shadow-md" />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">ID de Reserva</p>
                    <p className="font-mono text-lg font-semibold text-blue-600">#{booking.id}</p>
                  </motion.div>

                  {/* Booking Summary */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="bg-blue-50 rounded-lg p-6"
                  >
                    <h3 className="font-semibold text-gray-900 mb-4">Resumen de Pago</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Pagado</span>
                        <span className="font-semibold text-2xl text-blue-600">
                          ${parseFloat(booking.totalAmount).toLocaleString()} MXN
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Estado</span>
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          {booking.status === 'confirmed' ? 'Confirmado' : booking.status}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>

                  {/* Duration */}
                  {booking.tour?.duration && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 }}
                      className="bg-purple-50 rounded-lg p-6 text-center"
                    >
                      <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <h3 className="font-semibold text-gray-900 mb-1">Duración</h3>
                      <p className="text-lg font-semibold text-purple-600">{booking.tour.duration}</p>
                    </motion.div>
                  )}

                  {/* Contact Info */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 }}
                    className="bg-cyan-50 rounded-lg p-6 text-center"
                  >
                    <h3 className="font-semibold text-gray-900 mb-3">¿Necesitas Ayuda?</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>📞 +52 322 123 4567</p>
                      <p>📧 info@bookeros.com</p>
                      <p>💬 WhatsApp disponible 24/7</p>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="mt-8 pt-6 border-t border-gray-200 text-center"
              >
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <Waves className="w-5 h-5 text-blue-600" />
                  <span className="text-lg font-semibold text-gray-900">¡Que disfrutes tu aventura!</span>
                  <Waves className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-gray-600 text-sm">
                  Presenta este ticket el día de tu tour. Llega 15 minutos antes de la hora de salida.
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  Generado el {format(new Date(), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                </p>
              </motion.div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}