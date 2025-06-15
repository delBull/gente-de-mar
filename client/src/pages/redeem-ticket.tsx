import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import MobileSidebar from "@/components/mobile-sidebar";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { QrCode, User, MapPin, Calendar, Clock, Users, CheckCircle, XCircle, Camera, Hash, Scan, AlertCircle } from "lucide-react";

interface BookingDetails {
  id: number;
  tourName: string;
  customerName: string;
  customerPhone: string;
  bookingDate: string;
  adults: number;
  children: number;
  totalAmount: string;
  status: string;
  qrCode: string;
  alphanumericCode: string;
  redeemedAt?: string;
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

export default function RedeemTicket() {
  const { mainContainerClasses, contentClasses } = useResponsiveLayout();
  const [qrCode, setQrCode] = useState("");
  const [alphanumericCode, setAlphanumericCode] = useState("");
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [redemptionMethod, setRedemptionMethod] = useState("");
  const [redemptionNotes, setRedemptionNotes] = useState("");
  const [activeTab, setActiveTab] = useState("camera");
  const { toast } = useToast();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Check camera permissions on mount
  useEffect(() => {
    navigator.permissions?.query({ name: 'camera' as PermissionName })
      .then((result) => {
        setHasPermission(result.state === 'granted');
      })
      .catch(() => {
        setHasPermission(null);
      });
  }, []);

  const handleValidateQR = async () => {
    if (!qrCode.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un código QR",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/validate-ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ qrCode: qrCode.trim() }),
      });

      if (response.ok) {
        const booking = await response.json();
        setBookingDetails(booking);
        setIsValidated(true);
        toast({
          title: "¡Ticket Válido!",
          description: "El ticket ha sido validado correctamente",
        });
      } else {
        await handleValidationError(response);
      }
    } catch (error) {
      handleNetworkError();
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateAlphanumeric = async () => {
    if (!alphanumericCode.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un código alfanumérico",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const codeToValidate = alphanumericCode.trim().toUpperCase();
    
    try {
      const response = await fetch("/api/validate-ticket-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ alphanumericCode: codeToValidate }),
      });
      
      if (response.ok) {
        const booking = await response.json();
        setBookingDetails(booking);
        setIsValidated(true);
        toast({
          title: "¡Ticket Válido!",
          description: "El ticket ha sido validado correctamente",
        });
      } else {
        await handleValidationError(response);
      }
    } catch (error) {
      handleNetworkError();
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidationError = async (response: Response) => {
    try {
      const error = await response.json();
      if (response.status === 404) {
        toast({
          title: "Ticket no encontrado",
          description: "No se encontró ningún ticket con este código",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error de validación",
          description: error.message || "Error al validar el ticket",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error de validación",
        description: "Error al validar el ticket",
        variant: "destructive",
      });
    }
    setBookingDetails(null);
    setIsValidated(false);
  };

  const handleNetworkError = () => {
    toast({
      title: "Error",
      description: "Error al conectar con el servidor",
      variant: "destructive",
    });
    setBookingDetails(null);
    setIsValidated(false);
  };

  const handleRedeemTicket = async () => {
    if (!bookingDetails) return;

    if (!redemptionMethod.trim()) {
      toast({
        title: "Error",
        description: "Por favor selecciona un método de canje",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/redeem-ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          bookingId: bookingDetails.id,
          method: redemptionMethod,
          notes: redemptionNotes.trim() || null
        }),
      });

      if (response.ok) {
        const redemption = await response.json();
        setBookingDetails({ ...bookingDetails, status: "redeemed", redeemedAt: new Date().toISOString() });
        toast({
          title: "¡Ticket Canjeado!",
          description: "El ticket ha sido canjeado exitosamente",
        });
        
        // Reset form
        resetForm();
      } else {
        const error = await response.json();
        toast({
          title: "Error al canjear",
          description: error.message || "Error al canjear el ticket",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al conectar con el servidor",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      console.log('Starting camera...');
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia no soportado en este navegador');
      }

      // Check if we're on HTTPS or localhost
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        toast({
          title: "HTTPS Requerido",
          description: "El acceso a la cámara requiere una conexión segura (HTTPS)",
          variant: "destructive",
        });
        return;
      }

      // Detener cualquier stream previo
      stopCamera();
      
      // Configuración de video optimizada para móviles
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' }, // Preferir cámara trasera
          width: { ideal: 640, max: 1920 },
          height: { ideal: 480, max: 1080 },
          frameRate: { ideal: 15, max: 30 }
        },
        audio: false
      };

      console.log('Requesting camera with constraints:', constraints);
      
      // Solicitar acceso a la cámara
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current && stream) {
        console.log('Camera stream obtained:', stream);
        videoRef.current.srcObject = stream;
        setIsScanning(true);
        setHasPermission(true);
        
        // Configurar video element para móviles
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        videoRef.current.muted = true;
        
        // Esperar a que el video esté listo antes de reproducir
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          if (videoRef.current) {
            videoRef.current.play()
              .then(() => {
                console.log('Video playing successfully');
                toast({
                  title: "Cámara iniciada",
                  description: "Apunta la cámara hacia el código QR",
                });
              })
              .catch((playError) => {
                console.error('Error playing video:', playError);
                toast({
                  title: "Error reproduciendo video",
                  description: "Intenta tocar la pantalla para activar la cámara",
                  variant: "destructive",
                });
              });
          }
        };

        // Agregar listener para errores de video
        videoRef.current.onerror = (e) => {
          console.error('Video error:', e);
          toast({
            title: "Error de video",
            description: "Problema al mostrar la cámara",
            variant: "destructive",
          });
        };
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      setHasPermission(false);
      
      let errorMessage = "No se pudo acceder a la cámara.";
      let instructions = "";
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "Permisos de cámara denegados.";
        instructions = "En tu navegador móvil:\n1. Toca el ícono de candado/información en la barra de direcciones\n2. Permite el acceso a la cámara\n3. Recarga la página";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No se encontró ninguna cámara en este dispositivo.";
      } else if (error.name === 'NotSupportedError') {
        errorMessage = "La cámara no es compatible con este navegador.";
        instructions = "Intenta usar Chrome, Safari o Firefox en tu móvil";
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = "Las configuraciones de cámara no son compatibles.";
        // Intentar con configuración más básica
        try {
          console.log('Trying basic camera configuration...');
          const basicStream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current && basicStream) {
            videoRef.current.srcObject = basicStream;
            setIsScanning(true);
            setHasPermission(true);
            videoRef.current.play();
            return;
          }
        } catch (basicError) {
          console.error('Basic camera also failed:', basicError);
        }
      }
      
      toast({
        title: "Error de cámara",
        description: instructions ? `${errorMessage}\n\n${instructions}` : errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsScanning(false);
    }
  };

  const resetForm = () => {
    setBookingDetails(null);
    setIsValidated(false);
    setQrCode("");
    setAlphanumericCode("");
    setRedemptionMethod("");
    setRedemptionNotes("");
    stopCamera();
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
    <div className="flex h-screen bg-gray-50">
      <MobileSidebar />
      
      <div className={mainContainerClasses}>
        <main className="flex-1 overflow-y-auto">
          <div className={`container mx-auto p-4 space-y-6 pl-20 lg:pl-6 ${contentClasses}`}>
            <div className="flex flex-col space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">Canjear Ticket</h1>
              <p className="text-gray-600">Valida y canjea tickets usando códigos QR o alfanuméricos</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Validation Section */}
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-black flex items-center space-x-2">
                    <Scan className="w-5 h-5" />
                    <span>Validar Ticket</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="camera">Escáner</TabsTrigger>
                <TabsTrigger value="code">Código Alfanumérico</TabsTrigger>
              </TabsList>
              


              <TabsContent value="camera" className="space-y-4">
                <div className="space-y-4">
                  {!isScanning ? (
                    <div className="text-center space-y-4">
                      <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
                        <Camera className="w-16 h-16 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-600">
                        Usa la cámara para escanear códigos QR directamente
                      </p>
                      <Button onClick={startCamera} className="w-full btn-ocean-primary">
                        <Camera className="w-4 h-4 mr-2" />
                        Iniciar Cámara
                      </Button>
                      {hasPermission === false && (
                        <div className="space-y-3">
                          <div className="flex items-start space-x-3 text-amber-700 bg-amber-50 p-4 rounded-lg border border-amber-200">
                            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            <div className="space-y-2">
                              <p className="font-medium text-sm">
                                Permisos de cámara requeridos
                              </p>
                              <div className="text-xs space-y-1">
                                <p>Para móviles:</p>
                                <ol className="list-decimal list-inside space-y-1 ml-2">
                                  <li>Toca el ícono 🔒 o ⓘ en la barra de direcciones</li>
                                  <li>Busca "Cámara" y selecciona "Permitir"</li>
                                  <li>Recarga la página si es necesario</li>
                                </ol>
                              </div>
                            </div>
                          </div>
                          <Button onClick={startCamera} variant="outline" className="w-full">
                            <Camera className="w-4 h-4 mr-2" />
                            Reintentar Acceso a Cámara
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative bg-black rounded-lg overflow-hidden">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          webkit-playsinline="true"
                          className="w-full h-64 object-cover"
                          style={{ transform: 'scaleX(-1)' }}
                        />
                        
                        {/* QR Scanner Overlay */}
                        <div className="absolute inset-0 pointer-events-none">
                          {/* Scanning frame */}
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <div className="w-48 h-48 border-2 border-white rounded-lg relative">
                              {/* Corner brackets */}
                              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-cyan-400"></div>
                              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-cyan-400"></div>
                              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-cyan-400"></div>
                              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-cyan-400"></div>
                              
                              {/* Scanning line animation */}
                              <div className="absolute top-0 left-0 w-full h-0.5 bg-cyan-400 animate-pulse"></div>
                            </div>
                          </div>
                          
                          {/* Instructions overlay */}
                          <div className="absolute bottom-4 left-4 right-4">
                            <div className="bg-black/70 backdrop-blur-sm text-white text-center py-2 px-4 rounded-lg">
                              <p className="text-sm font-medium">Centra el código QR en el marco</p>
                              <p className="text-xs opacity-75">Mantén el dispositivo estable</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Button onClick={stopCamera} variant="outline" className="w-full">
                          Detener Cámara
                        </Button>
                        <Button 
                          onClick={() => {
                            stopCamera();
                            setTimeout(startCamera, 100);
                          }}
                          variant="outline" 
                          className="w-full"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Reiniciar
                        </Button>
                      </div>
                      
                      {/* Mobile-specific tips */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-blue-700">
                            <p className="font-medium mb-1">Consejos para móviles:</p>
                            <ul className="space-y-0.5">
                              <li>• Asegúrate de tener buena iluminación</li>
                              <li>• Mantén el código QR a 15-20 cm de la cámara</li>
                              <li>• Si no funciona, usa el código alfanumérico</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="code" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="alpha-input">Código Alfanumérico</Label>
                  <Input
                    id="alpha-input"
                    placeholder="Ej: VYM5-M5K9-J3Z6-3Z54"
                    value={alphanumericCode}
                    onChange={(e) => setAlphanumericCode(e.target.value.toUpperCase())}
                    disabled={isLoading}
                    maxLength={19}
                  />
                  <p className="text-xs text-gray-500">
                    Código de respaldo de 17 caracteres con guiones (ej: VYM5-M5K9-J3Z6-3Z54)
                  </p>
                </div>
                <Button 
                  onClick={handleValidateAlphanumeric} 
                  disabled={isLoading || !alphanumericCode.trim()}
                  className="w-full btn-ocean-primary"
                >
                  {isLoading ? "Validando..." : "Validar Código"}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Ticket Details Section */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {isValidated ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <QrCode className="w-5 h-5" />
              )}
              <span className="text-black">Detalles del Ticket</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!bookingDetails ? (
              <div className="text-center py-8">
                <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  Escanea o ingresa un código para ver los detalles del ticket
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Status Badge */}
                <div className="flex justify-between items-start">
                  <Badge 
                    variant={bookingDetails.status === 'redeemed' ? 'destructive' : 'default'}
                    className={bookingDetails.status === 'redeemed' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}
                  >
                    {bookingDetails.status === 'redeemed' ? 'Ya Canjeado' : 'Válido'}
                  </Badge>
                  {bookingDetails.redeemedAt && (
                    <span className="text-xs text-gray-500">
                      Canjeado: {formatDate(bookingDetails.redeemedAt)}
                    </span>
                  )}
                </div>

                {/* Tour Information */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium">{bookingDetails.tour?.name || bookingDetails.tourName}</p>
                      <p className="text-sm text-gray-600">{bookingDetails.tour?.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium">{bookingDetails.customerName}</p>
                      <p className="text-sm text-gray-600">{bookingDetails.customerPhone}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium">{formatDate(bookingDetails.bookingDate)}</p>
                      {bookingDetails.tour?.departureTime && (
                        <p className="text-sm text-gray-600">Salida: {bookingDetails.tour.departureTime}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium">
                        {bookingDetails.adults} adultos{bookingDetails.children > 0 && `, ${bookingDetails.children} niños`}
                      </p>
                      <p className="text-sm text-gray-600">Total: ${bookingDetails.totalAmount}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Codes Display */}
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">QR:</span>
                    <code className="text-xs bg-white px-2 py-1 rounded border">
                      {bookingDetails.qrCode}
                    </code>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Código:</span>
                    <code className="text-xs bg-white px-2 py-1 rounded border font-mono">
                      {bookingDetails.alphanumericCode}
                    </code>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Redemption Section */}
      {isValidated && bookingDetails && bookingDetails.status !== 'redeemed' && (
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="text-black">Instrucciones de Uso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="method">Método de Canje *</Label>
                <Select value={redemptionMethod} onValueChange={setRedemptionMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qr-scan">Escáner QR</SelectItem>
                    <SelectItem value="manual-code">Código Manual</SelectItem>
                    <SelectItem value="phone-verification">Verificación Telefónica</SelectItem>
                    <SelectItem value="id-check">Verificación de ID</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas (Opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Observaciones adicionales..."
                  value={redemptionNotes}
                  onChange={(e) => setRedemptionNotes(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <Button
                variant="outline"
                onClick={resetForm}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleRedeemTicket}
                disabled={isLoading || !redemptionMethod}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading ? "Canjeando..." : "Canjear Ticket"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {bookingDetails && bookingDetails.status === 'redeemed' && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">¡Ticket canjeado exitosamente!</span>
            </div>
            <div className="mt-4">
              <Button onClick={resetForm} variant="outline" className="w-full">
                Validar Otro Ticket
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
          </div>
        </main>
      </div>
    </div>
  );
}