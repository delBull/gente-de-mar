import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Save, Shield, CreditCard, Bell, Building, Smartphone, Receipt, Settings as SettingsIcon, LogOut } from "lucide-react";
import MobileSidebar from "@/components/mobile-sidebar";
import { useAuth } from "@/hooks/useAuth";
import PasskeyManager from "@/components/passkey-manager";

interface PayoutConfig {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  clabe: string;
  taxId: string;
}

export default function Settings() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Force Admin Override Visual Fix
  const displayName = user?.role === 'master_admin' ? 'Delbull' : user?.fullName;

  const [profileData, setProfileData] = useState({
    fullName: displayName || "",
    email: user?.email || "",
    phone: (user as any)?.phone || "",
    businessName: "BookerOS Tours",
    businessAddress: "Puerto Vallarta, Jalisco",
    businessDescription: "Plataforma Premium de Gestión de Experiencias y Tours"
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    bookingAlerts: true,
    paymentAlerts: true,
    marketingEmails: false
  });

  const [payoutConfig, setPayoutConfig] = useState<PayoutConfig>({
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    clabe: "",
    taxId: ""
  });

  // Load payout config on mount
  useEffect(() => {
    if (user && (user as any).payoutConfig) {
      try {
        setPayoutConfig(JSON.parse((user as any).payoutConfig));
      } catch (e) {
        console.error("Error parsing payout config", e);
      }
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", "/api/user", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Perfil actualizado", description: "Los cambios se han guardado correctamente." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileData);
  };

  const mainContainerClasses = "flex-1 flex flex-col min-h-screen bg-background w-full lg:pl-64 transition-all duration-300";

  return (
    <div className="flex min-h-screen bg-background">
      <MobileSidebar />
      <div className={mainContainerClasses}>
        <div className="p-6 md:p-10 space-y-8 max-w-5xl mx-auto w-full">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
            <p className="text-muted-foreground mt-2">
              Gestiona tu cuenta, seguridad y preferencias del sistema.
            </p>
          </div>

          <Tabs defaultValue="profile" className="w-full space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-[600px]">
              <TabsTrigger value="profile">Perfil</TabsTrigger>
              <TabsTrigger value="security">Seguridad</TabsTrigger>
              <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
              <TabsTrigger value="payouts">Pagos</TabsTrigger>
            </TabsList>

            {/* PROFILE TAB */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información Personal</CardTitle>
                  <CardDescription>Actualiza tu información de contacto y detalles del negocio.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Nombre Completo</Label>
                      <Input
                        value={profileData.fullName}
                        onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={profileData.email}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Teléfono</Label>
                      <Input
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nombre del Negocio</Label>
                      <Input
                        value={profileData.businessName}
                        onChange={(e) => setProfileData({ ...profileData, businessName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Dirección</Label>
                    <Input
                      value={profileData.businessAddress}
                      onChange={(e) => setProfileData({ ...profileData, businessAddress: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Textarea
                      value={profileData.businessDescription}
                      onChange={(e) => setProfileData({ ...profileData, businessDescription: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SECURITY TAB */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Autenticación Biométrica (Passkeys)</CardTitle>
                  <CardDescription>Inicia sesión de forma segura usando tu huella o Face ID.</CardDescription>
                </CardHeader>
                <CardContent>
                  <PasskeyManager />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contraseña</CardTitle>
                  <CardDescription>Cambia tu contraseña de acceso.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label>Contraseña Actual</Label>
                    <Input type="password" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Nueva Contraseña</Label>
                    <Input type="password" />
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button variant="outline">Actualizar Contraseña</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* NOTIFICATIONS TAB */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Preferencias de Notificación</CardTitle>
                  <CardDescription>Elige cómo quieres recibir las alertas.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificaciones por Email</Label>
                      <p className="text-sm text-muted-foreground">Recibe correos sobre nuevas reservas.</p>
                    </div>
                    <Switch checked={notificationSettings.emailNotifications}
                      onCheckedChange={(c) => setNotificationSettings({ ...notificationSettings, emailNotifications: c })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Alertas de Pagos</Label>
                      <p className="text-sm text-muted-foreground">Notificaciones cuando recibas un pago.</p>
                    </div>
                    <Switch checked={notificationSettings.paymentAlerts}
                      onCheckedChange={(c) => setNotificationSettings({ ...notificationSettings, paymentAlerts: c })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* PAYOUTS TAB */}
            <TabsContent value="payouts" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información Bancaria</CardTitle>
                  <CardDescription>Datos para recibir tus transferencias.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Banco</Label>
                      <Input value={payoutConfig.bankName} onChange={(e) => setPayoutConfig({ ...payoutConfig, bankName: e.target.value })} placeholder="Ej. BBVA" />
                    </div>
                    <div className="space-y-2">
                      <Label>Titular de la Cuenta</Label>
                      <Input value={payoutConfig.accountHolder} onChange={(e) => setPayoutConfig({ ...payoutConfig, accountHolder: e.target.value })} placeholder="Nombre completo" />
                    </div>
                    <div className="space-y-2">
                      <Label>CLABE (18 dígitos)</Label>
                      <Input value={payoutConfig.clabe} onChange={(e) => setPayoutConfig({ ...payoutConfig, clabe: e.target.value })} placeholder="1234..." />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="outline">Guardar Datos Bancarios</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}