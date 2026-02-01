import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function BookingConfirmation() {
    const [match, params] = useRoute("/booking-confirmation/:id");
    const [, setLocation] = useLocation();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [errorMessage, setErrorMessage] = useState("");

    const searchParams = new URLSearchParams(window.location.search);
    const sessionId = searchParams.get('session_id');

    const verifyPaymentMutation = useMutation({
        mutationFn: async ({ id, sessionId }: { id: string, sessionId: string }) => {
            const response = await apiRequest("POST", `/api/bookings/${id}/verify-payment`, { sessionId });
            return await response.json();
        },
        onSuccess: (data) => {
            if (data.success) {
                setStatus('success');
                setTimeout(() => {
                    setLocation(`/booking-success/${params?.id}`);
                }, 2000);
            } else {
                setStatus('error');
                setErrorMessage("No pudimos confirmar tu pago. Por favor contacta a soporte.");
            }
        },
        onError: (err: any) => {
            setStatus('error');
            setErrorMessage(err.message || "Error al verificar el pago.");
        }
    });

    useEffect(() => {
        if (params?.id && sessionId) {
            verifyPaymentMutation.mutate({ id: params.id, sessionId });
        } else {
            setStatus('error');
            setErrorMessage("Datos de sesión de pago no encontrados.");
        }
    }, [params?.id, sessionId]);

    return (
        <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full shadow-2xl border-0 bg-white/80 backdrop-blur-md">
                <CardContent className="pt-10 pb-10 text-center space-y-6">
                    {status === 'verifying' && (
                        <>
                            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto" />
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-gray-900">Verificando Pago</h2>
                                <p className="text-gray-600">Estamos confirmando tu transacción con Stripe...</p>
                            </div>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="w-12 h-12 text-green-500" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-gray-900">¡Pago Confirmado!</h2>
                                <p className="text-gray-600">Tu reserva ha sido asegurada. Redirigiendo a tus tickets...</p>
                            </div>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                                <AlertCircle className="w-12 h-12 text-red-500" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-gray-900">Error en Verificación</h2>
                                <p className="text-red-600 font-medium">{errorMessage}</p>
                                <p className="text-gray-500 text-sm">Si se realizó un cargo a tu tarjeta, no te preocupes, nuestro equipo lo resolverá.</p>
                            </div>
                            <div className="pt-4">
                                <Button
                                    onClick={() => setLocation('/customer')}
                                    className="w-full bg-blue-600 hover:bg-blue-700 h-12"
                                >
                                    Volver al Inicio
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
