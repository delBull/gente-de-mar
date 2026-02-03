import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Save, User, Bell, CreditCard, Shield, Smartphone, Receipt, Building, Settings as SettingsIcon, Landmark } from "lucide-react";
import MobileSidebar from "@/components/mobile-sidebar";
import { useAuth } from "@/hooks/useAuth";

interface PayoutConfig {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  clabe: string;
  taxId: string;
}

export default function Settings() {
  const { user, refetchUser } = useAuth();
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || "Darío",
    email: user?.email || "dario@bookeros.com",
    phone: (user as any)?.phone || "+52 322 123 4567",
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

  const [paymentSettings, setPaymentSettings] = useState({
    defaultCurrency: "MXN",
    autoPayouts: true,
    payoutSchedule: "weekly",
    minimumPayout: "1000",
    bankAccount: "**** **** **** 1234"
  });

  const [payoutConfig, setPayoutConfig] = useState<PayoutConfig>(() => {
    try {
      return (user as any)?.payoutConfig ? JSON.parse((user as any).payoutConfig) : {
        bankName: "",
        accountHolder: "",
        accountNumber: "",
        clabe: "",
        taxId: ""
      };
    } catch (e) {
      return { bankName: "", accountHolder: "", accountNumber: "", clabe: "", taxId: "" };
    }
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: retentionConfig } = useQuery({
    queryKey: ["/api/retention-config"],
  });

  const [retentionData, setRetentionData] = useState({
    appCommissionRate: "",
    taxRate: "",
    bankCommissionRate: "",
    otherRetentionsRate: "",
  });

  // Update retention data when config loads
  useState(() => {
    if (retentionConfig) {
      setRetentionData({
        appCommissionRate: (retentionConfig as any).appCommissionRate,
        taxRate: (retentionConfig as any).taxRate,
        bankCommissionRate: (retentionConfig as any).bankCommissionRate,
        otherRetentionsRate: (retentionConfig as any).otherRetentionsRate,
      });
    }
  });

  const updateRetentionMutation = useMutation({
    mutationFn: async (data: typeof retentionData) => {
      const response = await apiRequest("PUT", "/api/retention-config", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/retention-config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-summary"] });
      toast({
        title: "Configuración actualizada",
        description: "Las tasas de retención han sido actualizadas correctamente.",
      });
    },
  });

  const handleProfileSave = () => {
    toast({
      title: "Perfil actualizado",
      description: "Tu información de perfil ha sido guardada exitosamente.",
    });
  };

  const handleNotificationSave = () => {
    toast({
      title: "Notificaciones actualizadas",
      description: "Tus preferencias de notificación han sido guardadas.",
    });
  };

  const updatePayoutConfigMutation = useMutation({
    mutationFn: async (config: any) => {
      const response = await apiRequest("PATCH", `/api/users/${user?.id}/payout-config`, {
        payoutConfig: JSON.stringify(config)
      });
      return response.json();
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "Configuración de pagos guardada",
        description: "Tus detalles para recibir transferencias han sido actualizados.",
      });
      // Update local storage and auth context
      localStorage.setItem("auth_user", JSON.stringify(updatedUser));
      refetchUser();
    },
  });

  const handlePaymentSave = () => {
    updatePayoutConfigMutation.mutate(payoutConfig);
  };

  const handleRetentionSave = () => {
    updateRetentionMutation.mutate(retentionData);
  };

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await apiRequest("POST", "/api/users/change-password", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada exitosamente.",
      });
      // Update local storage
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      refetchUser();
      // Clear password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al cambiar la contraseña",
        variant: "destructive",
      });
    },
  });

  const handlePasswordChange = () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <MobileSidebar />

      <div className="flex-1 md:ml-64 max-w-full overflow-hidden">
        <header className="bg-white border-b border-gray-200 p-4 md:p-6">
          <div className="flex justify-between items-center max-w-7xl mx-auto">
            <div className="pl-16 md:pl-0">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Configuración</h2>
              <p className="text-sm md:text-base text-gray-600">Gestiona tu cuenta y preferencias</p>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-7xl mx-auto">
          <Tabs defaultValue="profile" className="space-y-4 md:space-y-6">
            {/* Desktop Navigation */}
            <TabsList className="hidden md:grid w-full grid-cols-5">
              <TabsTrigger value="profile">Perfil</TabsTrigger>
              <TabsTrigger value="security">Seguridad</TabsTrigger>
              <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
              <TabsTrigger value="payments">Pagos</TabsTrigger>
              <TabsTrigger value="retention">Retenciones</TabsTrigger>
            </TabsList>

            {/* Mobile Navigation - Solo iconos */}
            <TabsList className="md:hidden grid w-full grid-cols-5 gap-2">
              <TabsTrigger value="profile" className="relative group">
                <User className="w-5 h-5" />
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                  Perfil
                </div>
              </TabsTrigger>
              <TabsTrigger value="security" className="relative group">
                <Shield className="w-5 h-5" />
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                  Seguridad
                </div>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="relative group">
                <Bell className="w-5 h-5" />
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                  Notificaciones
                </div>
              </TabsTrigger>
              <TabsTrigger value="payments" className="relative group">
                <CreditCard className="w-5 h-5" />
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                  Pagos
                </div>
              </TabsTrigger>
              <TabsTrigger value="retention" className="relative group">
                <Receipt className="w-5 h-5" />
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                  Retenciones
                </div>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card className="bg-gray-800 border border-gray-700 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <User className="w-5 h-5 text-white" />
                    Información Personal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-white">Nombre Completo</Label>
                      <Input
                        id="fullName"
                        value={profileData.fullName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                        className="bg-transparent border-gray-300 focus:border-blue-500 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">Correo Electrónico</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        className="bg-transparent border-gray-300 focus:border-blue-500 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-white">Teléfono</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        className="bg-transparent border-gray-300 focus:border-blue-500 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessName" className="text-white">Nombre del Negocio</Label>
                      <Input
                        id="businessName"
                        value={profileData.businessName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, businessName: e.target.value }))}
                        className="bg-transparent border-gray-300 focus:border-blue-500 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessAddress" className="text-white">Dirección del Negocio</Label>
                    <Input
                      id="businessAddress"
                      value={profileData.businessAddress}
                      onChange={(e) => setProfileData(prev => ({ ...prev, businessAddress: e.target.value }))}
                      className="bg-transparent border-gray-300 focus:border-blue-500 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessDescription" className="text-white">Descripción del Negocio</Label>
                    <Textarea
                      id="businessDescription"
                      value={profileData.businessDescription}
                      onChange={(e) => setProfileData(prev => ({ ...prev, businessDescription: e.target.value }))}
                      rows={3}
                      className="bg-transparent border-gray-300 focus:border-blue-500 text-white"
                    />
                  </div>

                  <Button onClick={handleProfileSave} className="btn-ocean-primary">
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab - Password Change */}
            <TabsContent value="security">
              <Card className="bg-gray-800 border border-gray-700 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Shield className="w-5 h-5 text-white" />
                    Cambiar Contraseña
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-white">Contraseña Actual</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="bg-transparent border-gray-300 focus:border-blue-500 text-white"
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-white">Nueva Contraseña</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="bg-transparent border-gray-300 focus:border-blue-500 text-white"
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-white">Confirmar Nueva Contraseña</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="bg-transparent border-gray-300 focus:border-blue-500 text-white"
                        placeholder="Repite la nueva contraseña"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handlePasswordChange}
                      disabled={changePasswordMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {changePasswordMutation.isPending ? "Guardando..." : "Actualizar Contraseña"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card className="bg-gray-800 border border-gray-700 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Bell className="w-5 h-5 text-white" />
                    Preferencias de Notificación
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-white">Notificaciones por Email</Label>
                        <p className="text-sm text-gray-300">Recibir notificaciones importantes por correo</p>
                      </div>
                      <Switch
                        checked={notificationSettings.emailNotifications}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-white">Notificaciones SMS</Label>
                        <p className="text-sm text-gray-300">Recibir alertas por mensaje de texto</p>
                      </div>
                      <Switch
                        checked={notificationSettings.smsNotifications}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, smsNotifications: checked }))}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-white">Notificaciones Push</Label>
                        <p className="text-sm text-gray-300">Recibir notificaciones en el navegador</p>
                      </div>
                      <Switch
                        checked={notificationSettings.pushNotifications}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, pushNotifications: checked }))}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Alertas de Reserva</Label>
                        <p className="text-sm text-muted-foreground">Notificar cuando hay nuevas reservas</p>
                      </div>
                      <Switch
                        checked={notificationSettings.bookingAlerts}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, bookingAlerts: checked }))}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-white">Alertas de Pago</Label>
                        <p className="text-sm text-gray-300">Notificar sobre pagos y transacciones</p>
                      </div>
                      <Switch
                        checked={notificationSettings.paymentAlerts}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, paymentAlerts: checked }))}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-white">Emails de Marketing</Label>
                        <p className="text-sm text-gray-300">Recibir consejos y promociones</p>
                      </div>
                      <Switch
                        checked={notificationSettings.marketingEmails}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, marketingEmails: checked }))}
                      />
                    </div>
                  </div>

                  <Button onClick={handleNotificationSave} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Preferencias
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments/Payouts Tab */}
            <TabsContent value="payments">
              <Card className="bg-gray-800 border border-gray-700 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Landmark className="w-5 h-5 text-blue-400" />
                    Detalles para Recibir Pagos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="bankName" className="text-white">Institución Bancaria</Label>
                      <Input
                        id="bankName"
                        value={payoutConfig.bankName}
                        onChange={(e) => setPayoutConfig(prev => ({ ...prev, bankName: e.target.value }))}
                        placeholder="Ej: BBVA, Santander, Banorte..."
                        className="bg-transparent border-gray-600 focus:border-blue-500 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="accountHolder" className="text-white">Titular de la Cuenta</Label>
                      <Input
                        id="accountHolder"
                        value={payoutConfig.accountHolder}
                        onChange={(e) => setPayoutConfig(prev => ({ ...prev, accountHolder: e.target.value }))}
                        placeholder="Nombre completo del titular"
                        className="bg-transparent border-gray-600 focus:border-blue-500 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clabe" className="text-white">CLABE Interbancaria (18 dígitos)</Label>
                      <Input
                        id="clabe"
                        value={payoutConfig.clabe}
                        onChange={(e) => setPayoutConfig(prev => ({ ...prev, clabe: e.target.value }))}
                        placeholder="000000000000000000"
                        maxLength={18}
                        className="bg-transparent border-gray-600 focus:border-blue-500 text-white font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="taxId" className="text-white">RFC / Tax ID</Label>
                      <Input
                        id="taxId"
                        value={payoutConfig.taxId}
                        onChange={(e) => setPayoutConfig(prev => ({ ...prev, taxId: e.target.value }))}
                        placeholder="RFC con homoclave"
                        className="bg-transparent border-gray-600 focus:border-blue-500 text-white"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm text-blue-200">
                      <strong>Nota:</strong> Estos datos se utilizarán para realizar las transferencias de tus comisiones y pagos netos de forma automática o programada.
                    </p>
                  </div>

                  <Button
                    onClick={handlePaymentSave}
                    disabled={updatePayoutConfigMutation.isPending}
                    className="btn-ocean-primary"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updatePayoutConfigMutation.isPending ? "Guardando..." : "Guardar Configuración de Pagos"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Retention Tab */}
            <TabsContent value="retention">
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5" />
                    Configuración de Retenciones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="appCommission" className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-primary" />
                        Comisión de la App (%)
                      </Label>
                      <Input
                        id="appCommission"
                        type="number"
                        step="0.01"
                        value={retentionData.appCommissionRate}
                        onChange={(e) => setRetentionData(prev => ({ ...prev, appCommissionRate: e.target.value }))}
                      />
                      <p className="text-sm text-muted-foreground">Porcentaje que retiene la aplicación por transacción</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="taxRate" className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-yellow-400" />
                        IVA (%)
                      </Label>
                      <Input
                        id="taxRate"
                        type="number"
                        step="0.01"
                        value={retentionData.taxRate}
                        onChange={(e) => setRetentionData(prev => ({ ...prev, taxRate: e.target.value }))}
                      />
                      <p className="text-sm text-muted-foreground">Impuesto al valor agregado aplicable</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bankCommission" className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-blue-400" />
                        Comisión Bancaria (%)
                      </Label>
                      <Input
                        id="bankCommission"
                        type="number"
                        step="0.01"
                        value={retentionData.bankCommissionRate}
                        onChange={(e) => setRetentionData(prev => ({ ...prev, bankCommissionRate: e.target.value }))}
                      />
                      <p className="text-sm text-muted-foreground">Comisión cobrada por el procesador de pagos</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="otherRetentions" className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-purple-400" />
                        Otras Retenciones (%)
                      </Label>
                      <Input
                        id="otherRetentions"
                        type="number"
                        step="0.01"
                        value={retentionData.otherRetentionsRate}
                        onChange={(e) => setRetentionData(prev => ({ ...prev, otherRetentionsRate: e.target.value }))}
                      />
                      <p className="text-sm text-muted-foreground">Retenciones adicionales configurables</p>
                    </div>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium text-foreground mb-2">Resumen de Distribución</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Comisión App:</span>
                        <span className="text-primary">{retentionData.appCommissionRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">IVA:</span>
                        <span className="text-yellow-400">{retentionData.taxRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Comisión Bancaria:</span>
                        <span className="text-blue-400">{retentionData.bankCommissionRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Otras Retenciones:</span>
                        <span className="text-purple-400">{retentionData.otherRetentionsRate}%</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-medium">
                        <span className="text-foreground">Pago al Vendedor:</span>
                        <span className="text-green-400">
                          {(100 - parseFloat(retentionData.appCommissionRate || "0") -
                            parseFloat(retentionData.taxRate || "0") -
                            parseFloat(retentionData.bankCommissionRate || "0") -
                            parseFloat(retentionData.otherRetentionsRate || "0")).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleRetentionSave}
                    disabled={updateRetentionMutation.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateRetentionMutation.isPending ? "Guardando..." : "Guardar Retenciones"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}