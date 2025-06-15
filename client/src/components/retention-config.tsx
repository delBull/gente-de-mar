import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Smartphone, Receipt, Building, Settings } from "lucide-react";

interface RetentionConfig {
  id: number;
  appCommissionRate: string;
  taxRate: string;
  bankCommissionRate: string;
  otherRetentionsRate: string;
}

interface RetentionConfigProps {
  config?: RetentionConfig;
  isLoading: boolean;
}

export default function RetentionConfig({ config, isLoading }: RetentionConfigProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    appCommissionRate: "",
    taxRate: "",
    bankCommissionRate: "",
    otherRetentionsRate: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateConfigMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("PUT", "/api/retention-config", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/retention-config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-summary"] });
      setIsEditing(false);
      toast({
        title: "Configuración actualizada",
        description: "Las tasas de retención han sido actualizadas correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = () => {
    if (config) {
      setFormData({
        appCommissionRate: config.appCommissionRate,
        taxRate: config.taxRate,
        bankCommissionRate: config.bankCommissionRate,
        otherRetentionsRate: config.otherRetentionsRate,
      });
    }
    setIsEditing(true);
  };

  const handleSave = () => {
    updateConfigMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <Card className="dashboard-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Configuración de Retenciones</CardTitle>
            <Skeleton className="h-10 w-20" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="w-5 h-5" />
                </div>
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>Configuración de Retenciones</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No se pudo cargar la configuración</p>
        </CardContent>
      </Card>
    );
  }

  const configItems = [
    {
      title: "Comisión App",
      value: `${config.appCommissionRate}%`,
      description: "Por transacción",
      icon: Smartphone,
      color: "text-primary",
      bgColor: "bg-primary/20",
      key: "appCommissionRate",
    },
    {
      title: "IVA",
      value: `${config.taxRate}%`,
      description: "Impuesto",
      icon: Receipt,
      color: "text-yellow-400",
      bgColor: "bg-yellow-400/20",
      key: "taxRate",
    },
    {
      title: "Comisión Bancaria",
      value: `${config.bankCommissionRate}%`,
      description: "Por pago",
      icon: Building,
      color: "text-blue-400",
      bgColor: "bg-blue-400/20",
      key: "bankCommissionRate",
    },
    {
      title: "Otras Retenciones",
      value: `${config.otherRetentionsRate}%`,
      description: "Configurables",
      icon: Settings,
      color: "text-purple-400",
      bgColor: "bg-purple-400/20",
      key: "otherRetentionsRate",
    },
  ];

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Configuración de Retenciones</CardTitle>
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button onClick={handleEdit} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Settings className="w-4 h-4 mr-2" />
                Editar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Editar Configuración de Retenciones</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="appCommission" className="text-right">
                    App (%)
                  </Label>
                  <Input
                    id="appCommission"
                    type="number"
                    step="0.01"
                    value={formData.appCommissionRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, appCommissionRate: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tax" className="text-right">
                    IVA (%)
                  </Label>
                  <Input
                    id="tax"
                    type="number"
                    step="0.01"
                    value={formData.taxRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, taxRate: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="bank" className="text-right">
                    Banco (%)
                  </Label>
                  <Input
                    id="bank"
                    type="number"
                    step="0.01"
                    value={formData.bankCommissionRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankCommissionRate: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="other" className="text-right">
                    Otras (%)
                  </Label>
                  <Input
                    id="other"
                    type="number"
                    step="0.01"
                    value={formData.otherRetentionsRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, otherRetentionsRate: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={updateConfigMutation.isPending}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {updateConfigMutation.isPending ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {configItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.key} className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{item.title}</span>
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
