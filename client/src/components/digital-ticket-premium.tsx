import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { QrCode, Download, Share2, Copy, MapPin, Calendar, Users, Clock, CheckCircle, AlertCircle, Smartphone, Wallet, Star, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import QRCodeLib from "qrcode";
import html2canvas from "html2canvas";

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

export default function DigitalTicketPremium({ booking }: TicketProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const { toast } = useToast();

  // Detect device type for wallet buttons
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  useEffect(() => {
    generateQRCode();
  }, []);

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

    const saveUrl = `https://pay.google.com/gp/v/save/${btoa(JSON.stringify(googlePassData))}`;
    window.open(saveUrl, '_blank');

    toast({
      title: "Abriendo Google Wallet",
      description: "Se abrirá una nueva pestaña para agregar a Google Pay",
    });
  };

  const shareTicket = async () => {
    const ticketData = {
      title: `Ticket - ${booking.tour?.name}`,
      text: `Mi reservación en ${booking.tour?.name}\nFecha: ${new Date(booking.bookingDate).toLocaleDateString('es-MX')}\nCódigo: ${booking.alphanumericCode}`,
      url: window.location.origin + `/booking/${booking.id}`
    };

    if (navigator.share) {
      try {
        await navigator.share(ticketData);
      } catch (error) {
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
      <DialogContent className="max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center relative">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-cyan-500" />
              Ticket Digital Premium
              <Sparkles className="w-5 h-5 text-cyan-500" />
            </motion.div>
            <AnimatePresence>
              {showSparkles && (
                <motion.div
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  exit={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 2 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Star className="w-8 h-8 text-yellow-400" />
                </motion.div>
              )}
            </AnimatePresence>
          </DialogTitle>
        </DialogHeader>
        
        <motion.div
          id="digital-ticket-content"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative"
        >
          {/* Premium Ticket Card */}
          <div className="relative bg-gradient-to-br from-cyan-500 via-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-2xl overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
                <path d="M0 200L50 175L100 200L150 175L200 200L250 175L300 200L350 175L400 200V400H0V200Z" fill="white"/>
                <path d="M0 100L50 75L100 100L150 75L200 100L250 75L300 100L350 75L400 100V0H0V100Z" fill="white"/>
              </svg>
            </div>

            {/* Header */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="relative z-10 text-center mb-6"
            >
              <h2 className="text-2xl font-bold mb-1">🌊 Gente de Mar</h2>
              <p className="text-cyan-100 text-sm">Experiencias Inolvidables</p>
            </motion.div>

            {/* Status Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="flex justify-center mb-6"
            >
              <Badge 
                className={`${
                  booking.status === 'confirmed' 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-red-500 hover:bg-red-600'
                } text-white px-4 py-2 text-sm font-semibold shadow-lg`}
              >
                {booking.status === 'confirmed' ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    CONFIRMADO
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {booking.status === 'redeemed' ? 'USADO' : 'PENDIENTE'}
                  </>
                )}
              </Badge>
            </motion.div>

            {/* Tour Name */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-center mb-6"
            >
              <h3 className="text-xl font-bold mb-2">{booking.tour?.name}</h3>
              {booking.tour?.location && (
                <p className="text-cyan-100 flex items-center justify-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {booking.tour.location}
                </p>
              )}
            </motion.div>

            {/* QR Code Section */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5, duration: 0.7, ease: "easeOut" }}
              className="flex justify-center mb-6"
            >
              <div className="bg-white p-4 rounded-xl shadow-lg">
                {qrCodeDataUrl ? (
                  <img 
                    src={qrCodeDataUrl} 
                    alt="Código QR del ticket" 
                    className="w-32 h-32 rounded-lg"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: isGeneratingQR ? 360 : 0 }}
                      transition={{ duration: 1, repeat: isGeneratingQR ? Infinity : 0 }}
                    >
                      <QrCode className="w-12 h-12 text-gray-400" />
                    </motion.div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Details Grid */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="grid grid-cols-2 gap-4 mb-6"
            >
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <Calendar className="w-4 h-4 mb-1 text-cyan-200" />
                <p className="text-xs text-cyan-200">Fecha</p>
                <p className="font-semibold text-sm">{formatDate(booking.bookingDate)}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <Users className="w-4 h-4 mb-1 text-cyan-200" />
                <p className="text-xs text-cyan-200">Personas</p>
                <p className="font-semibold text-sm">
                  {booking.adults} adultos{booking.children > 0 && `, ${booking.children} niños`}
                </p>
              </div>
              {booking.tour?.departureTime && (
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                  <Clock className="w-4 h-4 mb-1 text-cyan-200" />
                  <p className="text-xs text-cyan-200">Salida</p>
                  <p className="font-semibold text-sm">{booking.tour.departureTime}</p>
                </div>
              )}
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <span className="text-2xl">💰</span>
                <p className="text-xs text-cyan-200">Total</p>
                <p className="font-bold text-lg text-yellow-300">
                  ${parseFloat(booking.totalAmount).toLocaleString('es-MX')}
                </p>
              </div>
            </motion.div>

            {/* Customer & Code */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-6"
            >
              <p className="text-cyan-200 text-xs mb-1">CLIENTE</p>
              <p className="font-semibold">{booking.customerName}</p>
              <p className="text-cyan-200 text-sm">{booking.customerPhone}</p>
              
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="text-cyan-200 text-xs">CÓDIGO DE RESPALDO</p>
                  <code className="font-mono font-bold text-yellow-300 text-sm">
                    {booking.alphanumericCode}
                  </code>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(booking.alphanumericCode, "Código alfanumérico")}
                  className="text-white hover:bg-white/20"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-6 space-y-3"
          >
            {/* Download Button */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={downloadTicket}
                disabled={isDownloading}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg"
              >
                {isDownloading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="mr-2"
                  >
                    <Download className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {isDownloading ? "Generando imagen..." : "Descargar Ticket Premium"}
              </Button>
            </motion.div>

            {/* Wallet Buttons */}
            <div className="grid grid-cols-2 gap-3">
              {isIOS && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={addToAppleWallet}
                    variant="outline"
                    className="w-full border-2 border-gray-800 bg-black text-white hover:bg-gray-800 py-3 rounded-xl"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Apple Wallet
                  </Button>
                </motion.div>
              )}
              
              {isAndroid && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={addToGoogleWallet}
                    variant="outline"
                    className="w-full border-2 border-green-600 bg-green-600 text-white hover:bg-green-700 py-3 rounded-xl"
                  >
                    <Smartphone className="w-4 h-4 mr-2" />
                    Google Pay
                  </Button>
                </motion.div>
              )}

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={shareTicket}
                  variant="outline"
                  className="w-full border-2 border-cyan-500 text-cyan-600 hover:bg-cyan-50 py-3 rounded-xl"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartir
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}