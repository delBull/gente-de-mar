import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Copy, RefreshCw, Users, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ReferralsCard() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: codeData, isLoading: isLoadingCode } = useQuery<{ code: string | null }>({
        queryKey: ["/api/referrals/my-code"],
    });

    const { data: statsData, isLoading: isLoadingStats } = useQuery<{ totalReferrals: number; referrals: any[] }>({
        queryKey: ["/api/referrals/stats"],
    });

    const generateMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/referrals/generate");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/referrals/my-code"] });
            toast({
                title: "¡Éxito!",
                description: "Tu código de referido ha sido generado.",
            });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "No se pudo generar el código.",
                variant: "destructive",
            });
        },
    });

    const copyToClipboard = () => {
        if (codeData?.code) {
            navigator.clipboard.writeText(codeData.code);
            toast({
                title: "Copiado",
                description: "Código copiado al portapapeles",
            });
        }
    };

    if (isLoadingCode || isLoadingStats) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle>Referidos</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center p-6">
                    <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-primary" />
                    Programa de Referidos
                </CardTitle>
                <CardDescription>
                    Comparte tu código y gana recompensas por cada nuevo usuario.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {codeData?.code ? (
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Input
                                    readOnly
                                    value={codeData.code}
                                    className="font-mono text-center text-lg font-bold bg-secondary/20 border-primary/20"
                                />
                            </div>
                            <Button onClick={copyToClipboard} variant="outline" size="icon">
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-secondary/10 p-4 rounded-lg text-center">
                                <div className="flex justify-center mb-2">
                                    <Users className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="text-2xl font-bold">{statsData?.totalReferrals || 0}</div>
                                <div className="text-xs text-muted-foreground">Referidos</div>
                            </div>
                            <div className="bg-secondary/10 p-4 rounded-lg text-center">
                                <div className="flex justify-center mb-2">
                                    <Gift className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="text-2xl font-bold">$0</div>
                                <div className="text-xs text-muted-foreground">Ganancias</div>
                            </div>
                        </div>

                        <p className="text-xs text-center text-muted-foreground">
                            Comparte este código con tus amigos para que reciban descuentos en sus reservas.
                        </p>
                    </div>
                ) : (
                    <div className="text-center py-4 space-y-4">
                        <p className="text-sm text-muted-foreground mb-4">
                            Genera tu código único para empezar a invitar.
                        </p>
                        <Button
                            onClick={() => generateMutation.mutate()}
                            disabled={generateMutation.isPending}
                            className="w-full"
                        >
                            {generateMutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                            Generar Código
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
