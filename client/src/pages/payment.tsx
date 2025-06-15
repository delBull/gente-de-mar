import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  CreditCard, 
  Wallet,
  Shield,
  CheckCircle,
  Loader2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Payment() {
  const [, params] = useRoute("/payment/:bookingData");
  const [, setLocation] = useLocation();
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Card form data
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Parse booking data from URL params
  const bookingData = params?.bookingData ? JSON.parse(decodeURIComponent(params.bookingData)) : null;

  const processPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create the actual booking after successful payment
      const response = await apiRequest("POST", "/api/bookings", {
        ...bookingData,
        paymentMethod: paymentData.method,
        paymentStatus: "completed"
      });
      const booking = await response.json();
      return booking;
    },
    onSuccess: (booking) => {
      toast({
        title: "¡Pago Exitoso!",
        description: "Tu reserva ha sido confirmada",
      });
      setLocation(`/booking-success/${booking.id}`);
    },
    onError: () => {
      toast({
        title: "Error en el Pago",
        description: "No se pudo procesar el pago. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  const handlePayment = async () => {
    if (!bookingData) {
      toast({
        title: "Error",
        description: "Datos de reserva no encontrados",
        variant: "destructive",
      });
      return;
    }

    // Validation for card payment
    if (paymentMethod === "card") {
      if (!cardNumber || !expiryDate || !cvv || !cardName) {
        toast({
          title: "Campos Incompletos",
          description: "Por favor completa todos los campos de la tarjeta",
          variant: "destructive",
        });
        return;
      }

      // Basic card validation
      if (cardNumber.replace(/\s/g, '').length < 16) {
        toast({
          title: "Tarjeta Inválida",
          description: "El número de tarjeta debe tener 16 dígitos",
          variant: "destructive",
        });
        return;
      }
    }

    setIsProcessing(true);
    
    try {
      await processPaymentMutation.mutateAsync({
        method: paymentMethod,
        cardNumber: paymentMethod === "card" ? cardNumber : null,
        amount: bookingData.totalAmount
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error de Datos</h2>
          <p className="text-gray-600 mb-4">No se encontraron los datos de reserva</p>
          <Button onClick={() => setLocation('/customer')} className="bg-blue-600 hover:bg-blue-700">
            Volver al Inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="w-10 h-10 rounded-xl p-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Finalizar Pago</h1>
              <p className="text-xs text-gray-600">Paso final - Proceso seguro</p>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Sandbox Notice */}
        <Card className="bg-yellow-50/70 backdrop-blur-sm border border-yellow-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Shield className="w-5 h-5 text-yellow-600 mr-2" />
              <div>
                <p className="text-yellow-800 font-medium text-sm">Modo Sandbox (Prueba)</p>
                <p className="text-yellow-700 text-xs">Este es un pago de prueba. No se cobrará dinero real.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg text-black">Resumen de tu Reserva</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Tour:</span>
              <span className="font-medium text-black">{bookingData.tourName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Huéspedes:</span>
              <span className="font-medium text-black">
                {bookingData.adults} adulto{bookingData.adults !== 1 ? 's' : ''} 
                {bookingData.children > 0 && ` + ${bookingData.children} niño${bookingData.children !== 1 ? 's' : ''}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fecha:</span>
              <span className="font-medium text-black">{new Date(bookingData.bookingDate).toLocaleDateString('es-MX')}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-black">Total a Pagar:</span>
                <span className="text-2xl font-bold text-blue-600">
                  ${parseFloat(bookingData.totalAmount).toLocaleString()} MXN
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Selection */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-black">Método de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-2 p-3 border rounded-xl hover:bg-gray-50">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center cursor-pointer flex-1">
                  <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
                  <div>
                    <div className="font-medium">Tarjeta de Crédito/Débito</div>
                    <div className="text-sm text-gray-600">Visa, Mastercard, American Express</div>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-3 border rounded-xl hover:bg-gray-50">
                <RadioGroupItem value="crypto" id="crypto" />
                <Label htmlFor="crypto" className="flex items-center cursor-pointer flex-1">
                  <Wallet className="w-5 h-5 mr-2 text-purple-600" />
                  <div>
                    <div className="font-medium">Criptomonedas</div>
                    <div className="text-sm text-gray-600">Bitcoin, Ethereum, USDC</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Card Payment Form */}
        {paymentMethod === "card" && (
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-black">Información de la Tarjeta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cardName">Nombre en la Tarjeta *</Label>
                <Input
                  id="cardName"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Juan Pérez"
                  className="mt-1 h-12 rounded-xl bg-white/50 backdrop-blur-sm border-gray-200 text-black placeholder:text-gray-500"
                />
              </div>

              <div>
                <Label htmlFor="cardNumber">Número de Tarjeta *</Label>
                <Input
                  id="cardNumber"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="mt-1 h-12 rounded-xl bg-white/50 backdrop-blur-sm border-gray-200 text-black placeholder:text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Usa 4242 4242 4242 4242 para pruebas
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiryDate">Fecha de Vencimiento *</Label>
                  <Input
                    id="expiryDate"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                    placeholder="MM/AA"
                    maxLength={5}
                    className="mt-1 h-12 rounded-xl bg-white/50 backdrop-blur-sm border-gray-200 text-black placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV *</Label>
                  <Input
                    id="cvv"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                    placeholder="123"
                    maxLength={4}
                    className="mt-1 h-12 rounded-xl bg-white/50 backdrop-blur-sm border-gray-200 text-black placeholder:text-gray-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Crypto Payment Info */}
        {paymentMethod === "crypto" && (
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-black">Pago con Criptomonedas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <Wallet className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 text-black">Simulación de Wallet</h3>
                <p className="text-gray-600 text-sm mb-4">
                  En modo sandbox, simularemos la conexión con ThirdWeb SDK
                </p>
                <Badge variant="outline" className="bg-purple-50">
                  Wallet conectada: 0x1234...5678
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Notice */}
        <Card className="bg-green-50/70 backdrop-blur-sm border border-green-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Shield className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <p className="text-green-800 font-medium text-sm">Pago 100% Seguro</p>
                <p className="text-green-700 text-xs">Tus datos están protegidos con encriptación SSL</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Button */}
        <Button 
          onClick={handlePayment}
          disabled={isProcessing || processPaymentMutation.isPending}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white h-14 text-lg font-medium rounded-xl shadow-lg"
        >
          {isProcessing || processPaymentMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Procesando Pago...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              Pagar ${parseFloat(bookingData.totalAmount).toLocaleString()} MXN
            </>
          )}
        </Button>

        <div className="text-center text-xs text-gray-500">
          Al continuar aceptas nuestros términos y condiciones de servicio
        </div>
      </div>
    </div>
  );
}