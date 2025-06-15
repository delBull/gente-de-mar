import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { QrCode, Download, Share2, Copy, MapPin, Calendar, Users, Clock, CheckCircle, AlertCircle, Smartphone, Wallet, Star, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import QRCodeLib from "qrcode";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface TicketProps {
  booking: {
    id: number;
    qrCode: string;
    alphanumericCode: string;
    customerName: string;
    customerPhone: string;
    bookingDate: string;
    adults: number;
    children: number;
    totalAmount: string;
    status: string;
    tour?: {
      name: string;
      location: string;
      duration?: string;
      departureTime?: string;
      description?: string;
      imageUrl?: string;
    };
  };
}

export default function DigitalTicket({ booking }: TicketProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const { toast } = useToast();

  // Detect device type for wallet buttons
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  useEffect(() => {
    // Generate QR code automatically when component mounts
    generateQRCode();
  }, []);

  // Sparkle effect for successful actions
  const triggerSparkles = () => {
    setShowSparkles(true);
    setTimeout(() => setShowSparkles(false), 2000);
  };

  const generateQRCode = async () => {
    if (qrCodeDataUrl) return qrCodeDataUrl;

    setIsGeneratingQR(true);
    try {
      const qrData = JSON.stringify({
        bookingId: booking.id,
        qrCode: booking.qrCode,
        alphanumericCode: booking.alphanumericCode,
        customerName: booking.customerName,
        tourName: booking.tour?.name || 'Tour',
        bookingDate: booking.bookingDate
      });

      const dataUrl = await QRCodeLib.toDataURL(qrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff',
        },
      });

      setQrCodeDataUrl(dataUrl);
      return dataUrl;
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar el código QR",
        variant: "destructive",
      });
      return "";
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado",
        description: `${label} copiado al portapapeles`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar al portapapeles",
        variant: "destructive",
      });
    }
  };

  const downloadTicket = async () => {
    setIsDownloading(true);
    try {
      const ticketElement = document.getElementById('digital-ticket-content');
      if (!ticketElement) return;

      const canvas = await html2canvas(ticketElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        height: ticketElement.scrollHeight,
        width: ticketElement.scrollWidth,
      });

      // Create download link
      const link = document.createElement('a');
      link.download = `ticket-${booking.tour?.name?.replace(/\s+/g, '-') || 'tour'}-${booking.alphanumericCode}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();

      triggerSparkles();
      toast({
        title: "¡Descarga exitosa!",
        description: "Tu ticket se ha descargado con un diseño premium",
      });
    } catch (error) {
      toast({
        title: "Error en la descarga",
        description: "No se pudo descargar el ticket. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const addToAppleWallet = () => {
    const passData = {
      formatVersion: 1,
      passTypeIdentifier: "pass.com.gentedemar.ticket",
      serialNumber: booking.alphanumericCode,
      teamIdentifier: "GENTEDEMAR",
      organizationName: "Gente de Mar",
      description: booking.tour?.name || "Tour Ticket",
      backgroundColor: "rgb(0, 123, 191)",
      foregroundColor: "rgb(255, 255, 255)",
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
            value: new Date(booking.bookingDate).toLocaleDateString('es-MX')
          },
          {
            key: "guests",
            label: "PERSONAS",
            value: `${booking.adults} adultos${booking.children > 0 ? `, ${booking.children} niños` : ''}`
          }
        ],
        auxiliaryFields: [
          {
            key: "code",
            label: "CÓDIGO",
            value: booking.alphanumericCode
          }
        ],
        backFields: [
          {
            key: "customer",
            label: "Cliente",
            value: booking.customerName
          },
          {
            key: "phone",
            label: "Teléfono",
            value: booking.customerPhone
          }
        ]
      }
    };

    const dataStr = "data:application/vnd.apple.pkpass+json," + encodeURIComponent(JSON.stringify(passData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `ticket-${booking.alphanumericCode}.pkpass`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    toast({
      title: "Generando pase para Apple Wallet",
      description: "Se ha iniciado la descarga del pase",
    });
  };

  const addToGoogleWallet = () => {
    const googlePassData = {
      iss: "gentedemar@tickets.com",
      aud: "google",
      typ: "savetowallet",
      payload: {
        genericObjects: [
          {
            id: `${booking.id}-${booking.alphanumericCode}`,
            classId: "3388000000022125855.gente_de_mar_ticket",
            genericType: "GENERIC_TYPE_UNSPECIFIED",
            hexBackgroundColor: "#007bbf",
            logo: {
              sourceUri: {
                uri: "https://storage.googleapis.com/wallet-lab-tools-codelab-artifacts-public/pass_google_logo.jpg"
              }
            },
            cardTitle: {
              defaultValue: {
                language: "es-MX",
                value: "Gente de Mar"
              }
            },
            subheader: {
              defaultValue: {
                language: "es-MX",
                value: booking.tour?.name || "Tour"
              }
            },
            header: {
              defaultValue: {
                language: "es-MX",
                value: booking.customerName
              }
            },
            textModulesData: [
              {
                id: "date",
                header: "Fecha",
                body: new Date(booking.bookingDate).toLocaleDateString('es-MX')
              },
              {
                id: "guests",
                header: "Personas",
                body: `${booking.adults} adultos${booking.children > 0 ? `, ${booking.children} niños` : ''}`
              },
              {
                id: "code",
                header: "Código",
                body: booking.alphanumericCode
              }
            ],
            barcode: {
              type: "QR_CODE",
              value: booking.qrCode
            }
          }
        ]
      }
    };

    // Create a temporary link to Google Wallet
    const saveUrl = `https://pay.google.com/gp/v/save/${btoa(JSON.stringify(googlePassData))}`;
    window.open(saveUrl, '_blank');

    toast({
      title: "Abriendo Google Wallet",
      description: "Se abrirá una nueva pestaña para agregar a Google Pay",
    });
  };

  const shareTicket = async () => {
    const qrDataUrl = await generateQRCode();
    if (!qrDataUrl) return;

    const ticketData = {
      title: `Ticket - ${booking.tour?.name}`,
      text: `Mi reservación en ${booking.tour?.name}\nFecha: ${new Date(booking.bookingDate).toLocaleDateString('es-MX')}\nCódigo: ${booking.alphanumericCode}`,
      url: window.location.origin + `/booking/${booking.id}`
    };

    if (navigator.share) {
      try {
        await navigator.share(ticketData);
      } catch (error) {
        // Fallback to copying link
        copyToClipboard(ticketData.url, "Enlace del ticket");
      }
    } else {
      copyToClipboard(ticketData.url, "Enlace del ticket");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <QrCode className="w-4 h-4 mr-2" />
          Ver Ticket Digital
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center">Ticket Digital</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Status Badge */}
          <div className="flex justify-center">
            <Badge 
              variant={booking.status === 'confirmed' ? 'default' : 'destructive'}
              className={booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
            >
              {booking.status === 'confirmed' ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Confirmado
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {booking.status === 'redeemed' ? 'Usado' : 'Pendiente'}
                </>
              )}
            </Badge>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <div 
              className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors"
              onClick={generateQRCode}
            >
              {qrCodeDataUrl ? (
                <img 
                  src={qrCodeDataUrl} 
                  alt="Código QR del ticket" 
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <div className="text-center">
                  <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {isGeneratingQR ? "Generando..." : "Toca para generar QR"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tour Details */}
          <div className="space-y-3">
            <div className="text-center">
              <h3 className="font-bold text-lg">{booking.tour?.name}</h3>
              {booking.tour?.location && (
                <p className="text-gray-600 flex items-center justify-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {booking.tour.location}
                </p>
              )}
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                <span className="font-medium">{formatDate(booking.bookingDate)}</span>
              </div>

              {booking.tour?.departureTime && (
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Salida: {booking.tour.departureTime}</span>
                </div>
              )}

              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2 text-gray-500" />
                <span>
                  {booking.adults} adultos{booking.children > 0 && `, ${booking.children} niños`}
                </span>
              </div>
            </div>

            <Separator />

            {/* Customer Info */}
            <div className="text-sm">
              <p className="font-medium">{booking.customerName}</p>
              <p className="text-gray-600">{booking.customerPhone}</p>
            </div>

            {/* Codes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">Código Respaldo:</span>
                <div className="flex items-center space-x-2">
                  <code className="text-sm bg-white px-2 py-1 rounded border font-mono">
                    {booking.alphanumericCode}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(booking.alphanumericCode, "Código")}
                    className="p-1"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-lg font-bold text-blue-900">${booking.totalAmount}</p>
              <p className="text-sm text-blue-700">Total pagado</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={downloadTicket}>
              <Download className="w-4 h-4 mr-2" />
              Descargar
            </Button>
            <Button variant="outline" onClick={shareTicket}>
              <Share2 className="w-4 h-4 mr-2" />
              Compartir
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>Presenta este ticket el día del tour</p>
            <p>ID de reservación: {booking.id}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}