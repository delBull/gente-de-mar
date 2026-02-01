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
import { Save, User, Bell, CreditCard, Shield, Smartphone, Receipt, Building, Settings as SettingsIcon } from "lucide-react";
import MobileSidebar from "@/components/mobile-sidebar";

export default function Settings() {
  const [profileData, setProfileData] = useState({
    fullName: "Darío",
    email: "dario@bookeros.com",
    phone: "+52 322 123 4567",
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

  const handlePaymentSave = () => {
    toast({
      title: "Configuración de pagos actualizada",
      description: "Tu configuración de pagos ha sido guardada exitosamente.",
    });
  };

  const handleRetentionSave = () => {
    updateRetentionMutation.mutate(retentionData);
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
            <TabsList className="hidden md:grid w-full grid-cols-4">
              <TabsTrigger value="profile">Perfil</TabsTrigger>
              <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
              <TabsTrigger value="payments">Pagos</TabsTrigger>
              <TabsTrigger value="retention">Retenciones</TabsTrigger>
            </TabsList>

            {/* Mobile Navigation - Solo iconos */}
            <TabsList className="md:hidden grid w-full grid-cols-4 gap-2">
              <TabsTrigger value="profile" className="relative group">
                <User className="w-5 h-5" />
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                  Perfil
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

            {/* Payments Tab */}
            <TabsContent value="payments">
              <Card className="bg-gray-800 border border-gray-700 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <CreditCard className="w-5 h-5 text-white" />
                    Configuración de Pagos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="defaultCurrency" className="text-white">Moneda Predeterminada</Label>
                      <Select value={paymentSettings.defaultCurrency} onValueChange={(value) => setPaymentSettings(prev => ({ ...prev, defaultCurrency: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MXN">Peso Mexicano (MXN)</SelectItem>
                          <SelectItem value="USD">Dólar Estadounidense (USD)</SelectItem>
                          <SelectItem value="EUR">Euro (EUR)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="payoutSchedule" className="text-white">Frecuencia de Pagos</Label>
                      <Select value={paymentSettings.payoutSchedule} onValueChange={(value) => setPaymentSettings(prev => ({ ...prev, payoutSchedule: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Diario</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="minimumPayout" className="text-white">Pago Mínimo</Label>
                      <Input
                        id="minimumPayout"
                        type="number"
                        value={paymentSettings.minimumPayout}
                        onChange={(e) => setPaymentSettings(prev => ({ ...prev, minimumPayout: e.target.value }))}
                        className="bg-transparent border-gray-300 focus:border-blue-500 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bankAccount" className="text-white">Cuenta Bancaria</Label>
                      <Input
                        id="bankAccount"
                        value={paymentSettings.bankAccount}
                        onChange={(e) => setPaymentSettings(prev => ({ ...prev, bankAccount: e.target.value }))}
                        placeholder="**** **** **** 1234"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="space-y-0.5">
                      <Label>Pagos Automáticos</Label>
                      <p className="text-sm text-muted-foreground">Enviar pagos automáticamente según el horario</p>
                    </div>
                    <Switch
                      checked={paymentSettings.autoPayouts}
                      onCheckedChange={(checked) => setPaymentSettings(prev => ({ ...prev, autoPayouts: checked }))}
                    />
                  </div>

                  <Button onClick={handlePaymentSave} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Configuración
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