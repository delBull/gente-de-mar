
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, AlertCircle, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function StripeConnectCard() {
    const { toast } = useToast();
    const [location, setLocation] = useLocation();
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'connected' | 'pending'>('idle');

    useEffect(() => {
        // Check URL params for connect status
        const params = new URLSearchParams(window.location.search);
        const connectStatus = params.get('connect');

        if (connectStatus === 'success') {
            setStatus('connected');
            toast({
                title: "¡Conexión Exitosa!",
                description: "Tu cuenta de Stripe ha sido vinculada correctamente.",
            });
            // Clean URL
            window.history.replaceState({}, '', '/dashboard');
        } else if (connectStatus === 'error') {
            toast({
                title: "Error de Conexión",
                description: "No se pudo vincular la cuenta. Por favor intenta de nuevo.",
                variant: "destructive"
            });
        }
    }, []);

    const handleConnect = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/stripe/connect", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Error starting onboarding");
            }

            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-md">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <Building2 className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <CardTitle className="text-xl text-indigo-900">Configuración de Pagos</CardTitle>
                        <CardDescription>
                            Gestiona cómo recibes tus ganancias
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-4">
                    <div className="text-sm text-gray-600">
                        {status === 'connected' ? (
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg border border-green-100">
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="font-medium">Cuenta vinculada para pagos automáticos</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-indigo-700 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                                <AlertCircle className="w-5 h-5" />
                                <span>Conecta tu cuenta bancaria para recibir pagos automáticamente.</span>
                            </div>
                        )}
                    </div>

                    <Button
                        onClick={handleConnect}
                        disabled={isLoading || status === 'connected'}
                        className={`w-full ${status === 'connected' ? 'bg-green-600 hover:bg-green-700' : 'bg-[#635BFF] hover:bg-[#5851DF]'} text-white shadow-md transition-all h-12 text-base font-medium`}
                    >
                        {isLoading ? (
                            "Procesando..."
                        ) : status === 'connected' ? (
                            <span className="flex items-center">
                                Cuenta Configurada <CheckCircle2 className="ml-2 w-5 h-5" />
                            </span>
                        ) : (
                            <span className="flex items-center">
                                Conectar con Stripe <ArrowRight className="ml-2 w-5 h-5" />
                            </span>
                        )}
                    </Button>

                    <p className="text-xs text-center text-gray-500 mt-2">
                        Pagos seguros procesados por Stripe. Tus datos bancarios están encriptados.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
