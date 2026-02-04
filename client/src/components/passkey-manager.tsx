import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Fingerprint, Trash2 } from "lucide-react";
import { startRegistration } from "@simplewebauthn/browser";

export default function PasskeyManager() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [deviceName, setDeviceName] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);

    // Fetch user's passkeys
    const { data: passkeys = [], isLoading } = useQuery({
        queryKey: ["/api/webauthn/credentials"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/webauthn/credentials");
            return res.json();
        },
    });

    // Register new passkey
    const registerPasskey = async () => {
        if (!deviceName.trim()) {
            toast({
                title: "Error",
                description: "Por favor ingresa un nombre para el dispositivo",
                variant: "destructive",
            });
            return;
        }

        setIsRegistering(true);
        try {
            // Start registration
            const optionsRes = await apiRequest("POST", "/api/webauthn/register/start");
            const options = await optionsRes.json();

            // Get credential from authenticator
            const credential = await startRegistration(options);

            // Complete registration
            const verifyRes = await apiRequest(
                "POST",
                "/api/webauthn/register/finish",
                { credential, deviceName }
            );

            if (verifyRes.ok) {
                toast({
                    title: "¡Passkey registrado!",
                    description: `${deviceName} se agregó exitosamente`,
                });
                setDeviceName("");
                queryClient.invalidateQueries({ queryKey: ["/api/webauthn/credentials"] });
            } else {
                throw new Error("Verification failed");
            }
        } catch (error: any) {
            console.error("Passkey registration error:", error);
            toast({
                title: "Error al registrar passkey",
                description: error.message || "Intenta de nuevo",
                variant: "destructive",
            });
        } finally {
            setIsRegistering(false);
        }
    };

    // Delete passkey
    const deletePasskeyMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await apiRequest("DELETE", `/api/webauthn/credentials/${id}`);
            if (!res.ok) throw new Error("Failed to delete");
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "Passkey eliminado" });
            queryClient.invalidateQueries({ queryKey: ["/api/webauthn/credentials"] });
        },
        onError: () => {
            toast({
                title: "Error al eliminar passkey",
                variant: "destructive",
            });
        },
    });

    return (
        <div className="space-y-4">
            {/* Registration Form */}
            <div className="bg-gray-700 p-4 rounded-lg space-y-3">
                <Label htmlFor="deviceName" className="text-white">
                    Registrar Nuevo Passkey
                </Label>
                <div className="flex gap-2">
                    <Input
                        id="deviceName"
                        value={deviceName}
                        onChange={(e) => setDeviceName(e.target.value)}
                        placeholder="Ej: iPhone de Marco, MacBook Air"
                        className="bg-transparent border-gray-300 text-white flex-1"
                        disabled={isRegistering}
                    />
                    <Button
                        onClick={registerPasskey}
                        disabled={isRegistering || !deviceName.trim()}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Fingerprint className="w-4 h-4 mr-2" />
                        {isRegistering ? "Registrando..." : "Registrar"}
                    </Button>
                </div>
                <p className="text-xs text-gray-400">
                    Usa tu huella, Face ID, o llave de seguridad para autenticarte
                </p>
            </div>

            {/* Passkeys List */}
            <div className="space-y-2">
                <Label className="text-white">Passkeys Activos</Label>
                {isLoading ? (
                    <p className="text-gray-400 text-sm">Cargando...</p>
                ) : passkeys.length === 0 ? (
                    <p className="text-gray-400 text-sm">No tienes passkeys registrados</p>
                ) : (
                    <div className="space-y-2">
                        {passkeys.map((passkey: any) => (
                            <div
                                key={passkey.id}
                                className="flex items-center justify-between bg-gray-700 p-3 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <Fingerprint className="w-5 h-5 text-blue-400" />
                                    <div>
                                        <p className="text-white font-medium">{passkey.deviceName}</p>
                                        <p className="text-xs text-gray-400">
                                            Registrado: {new Date(passkey.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deletePasskeyMutation.mutate(passkey.id)}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
