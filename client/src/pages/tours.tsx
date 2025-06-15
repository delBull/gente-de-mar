import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { Plus, Edit, MapPin, DollarSign } from "lucide-react";
import MobileSidebar from "@/components/mobile-sidebar";

interface Tour {
  id: number;
  name: string;
  location: string;
  price: string;
  status: string;
  imageUrl?: string;
  description?: string;
}

export default function Tours() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    price: "",
    status: "active",
    description: "",
    imageUrl: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mainContainerClasses, contentClasses } = useResponsiveLayout();

  const { data: tours, isLoading } = useQuery({
    queryKey: ["/api/tours"],
  });

  const createTourMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/tours", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tours"] });
      setIsCreateOpen(false);
      resetForm();
      toast({
        title: "Tour creado",
        description: "El tour ha sido creado exitosamente.",
      });
    },
  });

  const updateTourMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & typeof formData) => {
      const response = await apiRequest("PUT", `/api/tours/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tours"] });
      setEditingTour(null);
      resetForm();
      toast({
        title: "Tour actualizado",
        description: "El tour ha sido actualizado exitosamente.",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      location: "",
      price: "",
      status: "active",
      description: "",
      imageUrl: "",
    });
  };

  const handleEdit = (tour: Tour) => {
    setFormData({
      name: tour.name,
      location: tour.location,
      price: tour.price,
      status: tour.status,
      description: tour.description || "",
      imageUrl: tour.imageUrl || "",
    });
    setEditingTour(tour);
  };

  const handleSubmit = () => {
    if (editingTour) {
      updateTourMutation.mutate({ id: editingTour.id, ...formData });
    } else {
      createTourMutation.mutate(formData);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-primary text-primary-foreground">Activo</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400/80">Pendiente</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactivo</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDefaultImage = (tourName: string) => {
    if (tourName.toLowerCase().includes('marietas') || tourName.toLowerCase().includes('island')) {
      return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200";
    }
    if (tourName.toLowerCase().includes('pesca') || tourName.toLowerCase().includes('fishing')) {
      return "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200";
    }
    return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200";
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <MobileSidebar />
      
      <div className={mainContainerClasses}>
        <div className={contentClasses}>
          <header className="bg-white border-b border-gray-200 p-4 md:p-6">
            <div className="flex justify-between items-center">
              <div className="pl-16 md:pl-0">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Mis Tours</h2>
                <p className="text-sm md:text-base text-gray-600">Gestiona tus tours y experiencias</p>
              </div>
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Tour
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Tour</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Nombre</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="location" className="text-right">Ubicación</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="price" className="text-right">Precio</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status" className="text-right">Estado</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="inactive">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">Descripción</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="col-span-3"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={createTourMutation.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {createTourMutation.isPending ? "Creando..." : "Crear Tour"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <main className="p-4 md:p-6 space-y-4 md:space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-white border border-gray-200 shadow-sm">
                  <CardContent className="p-4 md:p-6">
                    <Skeleton className="w-full h-48 rounded-lg mb-4" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2 mb-4" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {(tours as Tour[])?.map((tour: Tour) => (
                <Card key={tour.id} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 md:p-6">
                    <img 
                      src={tour.imageUrl || getDefaultImage(tour.name)}
                      alt={tour.name}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-foreground">{tour.name}</h3>
                        {getStatusBadge(tour.status)}
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="text-sm">{tour.location}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center text-primary">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-bold">{parseFloat(tour.price).toLocaleString()}</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(tour)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingTour} onOpenChange={(open) => !open && setEditingTour(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Tour</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">Nombre</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-location" className="text-right">Ubicación</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-price" className="text-right">Precio</Label>
              <Input
                id="edit-price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-status" className="text-right">Estado</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">Descripción</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => { setEditingTour(null); resetForm(); }}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={updateTourMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {updateTourMutation.isPending ? "Actualizando..." : "Actualizar Tour"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}