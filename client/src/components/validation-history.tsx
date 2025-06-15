import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, MapPin, Clock, CreditCard, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ValidationHistoryItem {
  id: number;
  bookingId: number;
  redeemedBy: number;
  redeemedAt: string;
  redemptionMethod: string;
  notes: string | null;
  booking: {
    id: number;
    customerName: string;
    customerPhone: string | null;
    customerEmail: string | null;
    bookingDate: string;
    adults: number;
    children: number;
    totalAmount: string;
    alphanumericCode: string | null;
    qrCode: string | null;
  };
  tour: {
    id: number;
    name: string;
    location: string;
    price: string;
    description: string | null;
  };
}

export default function ValidationHistory() {
  const { data: validationHistory, isLoading, error } = useQuery<ValidationHistoryItem[]>({
    queryKey: ['/api/validation-history'],
    refetchInterval: 30000, // Refetch every 30 seconds to get real-time updates
  });

  if (isLoading) {
    return (
      <Card className="bg-white shadow-md border-0">
        <CardHeader>
          <CardTitle className="text-black flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Historial de Validaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white shadow-md border-0">
        <CardHeader>
          <CardTitle className="text-black flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-red-600" />
            Historial de Validaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Error al cargar el historial de validaciones</p>
        </CardContent>
      </Card>
    );
  }

  if (!validationHistory || validationHistory.length === 0) {
    return (
      <Card className="bg-white shadow-md border-0">
        <CardHeader>
          <CardTitle className="text-black flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Historial de Validaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay tickets validados aún</p>
            <p className="text-sm text-gray-400 mt-2">
              Los tickets validados aparecerán aquí automáticamente
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-md border-0">
      <CardHeader>
        <CardTitle className="text-black flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Historial de Validaciones
          <Badge variant="secondary" className="ml-2">
            {validationHistory.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {validationHistory.map((validation) => (
            <div
              key={validation.id}
              className="border-l-4 border-green-500 pl-4 py-3 bg-green-50 rounded-r-lg"
            >
              <div className="flex flex-col space-y-2">
                {/* Header con tour y estado */}
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-black text-sm">
                    {validation.tour.name}
                  </h4>
                  <Badge className="bg-green-100 text-green-800">
                    Validado
                  </Badge>
                </div>

                {/* Información del cliente */}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{validation.booking.customerName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{validation.tour.location}</span>
                  </div>
                </div>

                {/* Detalles de la validación */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Fecha del Tour:</span>
                    <p className="font-medium text-black">
                      {format(new Date(validation.booking.bookingDate), "dd 'de' MMMM, yyyy", { locale: es })}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Validado el:</span>
                    <p className="font-medium text-black">
                      {format(new Date(validation.redeemedAt), "dd/MM/yyyy HH:mm", { locale: es })}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Pasajeros:</span>
                    <p className="font-medium text-black">
                      {validation.booking.adults} adultos
                      {validation.booking.children > 0 && `, ${validation.booking.children} niños`}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Método:</span>
                    <p className="font-medium text-black">
                      {validation.redemptionMethod === 'qr' ? 'Código QR' : 'Código Alfanumérico'}
                    </p>
                  </div>
                </div>

                {/* Código utilizado */}
                <div className="text-sm">
                  <span className="text-gray-500">Código:</span>
                  <p className="font-mono text-black bg-gray-100 px-2 py-1 rounded inline-block ml-2">
                    {validation.redemptionMethod === 'qr' 
                      ? validation.booking.qrCode 
                      : validation.booking.alphanumericCode}
                  </p>
                </div>

                {/* Notas si existen */}
                {validation.notes && (
                  <div className="text-sm">
                    <span className="text-gray-500">Notas:</span>
                    <p className="text-black mt-1 bg-gray-100 p-2 rounded">
                      {validation.notes}
                    </p>
                  </div>
                )}

                {/* Monto */}
                <div className="flex justify-end">
                  <div className="text-right">
                    <span className="text-gray-500 text-sm">Total:</span>
                    <p className="font-bold text-lg text-green-600">
                      ${parseFloat(validation.booking.totalAmount).toLocaleString('es-MX')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}