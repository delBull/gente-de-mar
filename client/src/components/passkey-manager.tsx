import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Fingerprint, Trash2, Shield } from "lucide-react";
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
            <div className="bg-white p-6 rounded-xl space-y-4 border border-gray-100 shadow-sm">
                <div className="space-y-1">
                    <Label htmlFor="deviceName" className="text-gray-900 text-base font-medium">
                        Registrar Nuevo Dispositivo
                    </Label>
                    <p className="text-sm text-gray-500">
                        Agrega una llave de acceso (Passkey) para iniciar sesión de forma segura sin contraseña.
                    </p>
                </div>

                <div className="flex gap-3">
                    <Input
                        id="deviceName"
                        value={deviceName}
                        onChange={(e) => setDeviceName(e.target.value)}
                        placeholder="Ej: iPhone de Marco, Chrome en MacBook"
                        className="bg-white border-gray-200 text-gray-900 flex-1 h-10"
                        disabled={isRegistering}
                    />
                    <Button
                        onClick={registerPasskey}
                        disabled={isRegistering || !deviceName.trim()}
                        className="btn-ocean-primary h-10 px-6"
                    >
                        <Fingerprint className="w-4 h-4 mr-2" />
                        {isRegistering ? "Registrando..." : "Registrar"}
                    </Button>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 p-2 rounded border border-gray-100">
                    <Shield className="w-3 h-3" />
                    <span>Tus datos biométricos nunca salen de tu dispositivo. Es la forma más segura de acceder.</span>
                </div>
            </div>

            {/* Passkeys List */}
            <div className="space-y-3 pt-2">
                <Label className="text-gray-900 text-base font-medium">Dispositivos Vinculados</Label>
                {isLoading ? (
                    <div className="flex justify-center p-4">
                        <p className="text-gray-400 text-sm">Cargando dispositivos...</p>
                    </div>
                ) : passkeys.length === 0 ? (
                    <div className="text-center p-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <Fingerprint className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No hay passkeys configurados aún.</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {passkeys.map((passkey: any) => (
                            <div
                                key={passkey.id}
                                className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="bg-blue-50 p-2 rounded-full">
                                        <Fingerprint className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-gray-900 font-medium">{passkey.deviceName}</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span>Registrado: {new Date(passkey.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deletePasskeyMutation.mutate(passkey.id)}
                                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
