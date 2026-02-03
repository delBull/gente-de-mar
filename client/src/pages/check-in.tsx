import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { QrCode, Camera, CheckCircle2, AlertTriangle, User, Users, MapPin, Calendar, Search } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Import QrReader safely - might need type declaration override or @types
// @ts-ignore
import QrReader from 'react-qr-scanner';

export default function CheckIn() {
    const [location, setLocation] = useLocation();
    const { toast } = useToast();
    const [scanning, setScanning] = useState(true);
    const [manualCode, setManualCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [scannedBooking, setScannedBooking] = useState<any>(null);

    const handleScan = async (data: any) => {
        if (data && scanning) {
            // Stop scanning immediately to prevent multiple triggers
            setScanning(false);
            const code = data?.text || data; // Ensure we get the string
            if (code) {
                await lookupBooking(code);
            }
        }
    };

    const handleError = (err: any) => {
        console.error(err);
        // Don't toast on every frame error, just log
    };

    const lookupBooking = async (code: string) => {
        setLoading(true);
        try {
            // Try looking up by QR Code content (which might be the code itself)
            // If it's a URL, extract the code if possible, or assume the whole string is the code
            // For now our QRs are just the code
            const cleanCode = code.trim();
            const res = await fetch(`/api/bookings/qr/${cleanCode}`);

            if (res.ok) {
                const booking = await res.json();
                setScannedBooking(booking);
                toast({
                    title: "Reserva Encontrada",
                    description: `Cliente: ${booking.customerName}`
                });
            } else {
                toast({
                    title: "No encontrado",
                    description: "No se encontró ninguna reserva con ese código.",
                    variant: "destructive"
                });
                setScanning(true); // Resume scanning
            }
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Error al buscar la reserva.",
                variant: "destructive"
            });
            setScanning(true);
        } finally {
            setLoading(false);
        }
    };

    const performCheckIn = async () => {
        if (!scannedBooking) return;
        setLoading(true);
        try {
            const res = await apiRequest("POST", `/api/bookings/${scannedBooking.id}/check-in`);
            const data = await res.json();

            if (data.success) {
                setScannedBooking({ ...scannedBooking, checkedIn: true });
                toast({
                    title: "¡Check-in Exitoso!",
                    description: "Pasajero marcado como abordado.",
                    className: "bg-green-600 text-white"
                });
                // Refresh query cache if needed
                queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
            }
        } catch (error) {
            toast({
                title: "Error de Check-in",
                description: "No se pudo completar el check-in.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setScannedBooking(null);
        setManualCode("");
        setScanning(true);
    };

    return (
        <div className="min-h-screen bg-black text-white p-4">
            <div className="max-w-md mx-auto space-y-6">
                <header className="flex justify-between items-center pb-4 border-b border-white/10">
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            BookerOS Check-in
                        </h1>
                        <p className="text-sm text-gray-400">Control de Abordaje</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
                        <CheckCircle2 className="h-6 w-6 text-gray-400" />
                    </Button>
                </header>

                {!scannedBooking ? (
                    <div className="space-y-6">
                        {scanning ? (
                            <Card className="bg-gray-900 border-gray-800 overflow-hidden">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400">
                                        <Camera className="h-4 w-4" /> Escanear QR
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 aspect-square bg-black relative">
                                    {/* Camera View */}
                                    <QrReader
                                        delay={300}
                                        onError={handleError}
                                        onScan={handleScan}
                                        style={{ width: '100%', height: '100%' }}
                                        constraints={{
                                            video: { facingMode: "environment" }
                                        }}
                                    />
                                    <div className="absolute inset-0 border-2 border-blue-500/50 m-12 rounded-lg animate-pulse pointer-events-none"></div>
                                </CardContent>
                                <CardFooter className="bg-gray-900/50 p-4 justify-center">
                                    <p className="text-xs text-gray-500">Apunta la cámara al código QR del boleto</p>
                                </CardFooter>
                            </Card>
                        ) : (
                            <Button
                                className="w-full py-8 text-lg border-dashed border-2 bg-transparent hover:bg-white/5"
                                variant="outline"
                                onClick={() => setScanning(true)}
                            >
                                <Camera className="mr-2 h-6 w-6" /> Activar Cámara
                            </Button>
                        )}

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-black px-2 text-gray-500">O ingresa código manual</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Input
                                placeholder="Código Alfanumérico (ej. A7X9P)"
                                className="bg-gray-900 border-gray-800 text-lg uppercase"
                                value={manualCode}
                                onChange={(e) => setManualCode(e.target.value)}
                            />
                            <Button
                                size="icon"
                                className="bg-blue-600 hover:bg-blue-700 mt-[1px]" // align fix
                                onClick={() => lookupBooking(manualCode)}
                                disabled={!manualCode || loading}
                            >
                                <Search className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Card className={`border-0 ${scannedBooking.checkedIn ? 'bg-green-900/20 border-green-500/50 border' : 'bg-gray-900 border-gray-800'}`}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-2xl">{scannedBooking.customerName}</CardTitle>
                                    <CardDescription className="text-gray-400 mt-1">
                                        {scannedBooking.nationality || "Nacionalidad no registrada"}
                                    </CardDescription>
                                </div>
                                {scannedBooking.checkedIn && (
                                    <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-green-500/50">
                                        YA ABORDÓ
                                    </span>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1 p-3 bg-black/20 rounded-lg">
                                    <span className="text-xs text-gray-500 flex items-center gap-1"><Users className="h-3 w-3" /> Pasajeros</span>
                                    <span className="text-xl font-bold">{scannedBooking.adults} Ad / {scannedBooking.children} Ni</span>
                                </div>
                                <div className="flex flex-col gap-1 p-3 bg-black/20 rounded-lg">
                                    <span className="text-xs text-gray-500 flex items-center gap-1"><User className="h-3 w-3" /> ID Reserva</span>
                                    <span className="text-base font-mono">{scannedBooking.id}</span>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-white/10">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 flex items-center gap-2"><Calendar className="h-4 w-4" /> Fecha:</span>
                                    <span>{scannedBooking.bookingDate ? format(new Date(scannedBooking.bookingDate), "dd MMM yyyy", { locale: es }) : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 flex items-center gap-2"><MapPin className="h-4 w-4" /> Tour:</span>
                                    <span className="text-right max-w-[200px] truncate">Tour #{scannedBooking.tourId}</span>
                                </div>
                            </div>

                            {scannedBooking.checkedIn && (
                                <div className="flex items-center gap-2 text-yellow-500 bg-yellow-900/20 p-3 rounded-lg text-sm">
                                    <AlertTriangle className="h-4 w-4" />
                                    Este ticket ya fue utilizado el {scannedBooking.checkedInAt ? format(new Date(scannedBooking.checkedInAt), "HH:mm") : ''}.
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex flex-col gap-3">
                            {!scannedBooking.checkedIn ? (
                                <Button
                                    className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg font-bold shadow-[0_0_20px_rgba(22,163,74,0.3)] animate-pulse"
                                    onClick={performCheckIn}
                                    disabled={loading}
                                >
                                    {loading ? "Procesando..." : "CONFIRMAR ABORDAJE"}
                                </Button>
                            ) : (
                                <Button
                                    variant="secondary"
                                    className="w-full"
                                    onClick={reset}
                                >
                                    Escanear Siguiente
                                </Button>
                            )}
                            {!scannedBooking.checkedIn && (
                                <Button variant="ghost" className="text-gray-500 w-full" onClick={reset}>
                                    Cancelar
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                )}
            </div>
        </div>
    );
}
