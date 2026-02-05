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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { Plus, Edit, MapPin, DollarSign, Image as ImageIcon, Users, Info, Eye } from "lucide-react";
import MobileSidebar from "@/components/mobile-sidebar";

interface Tour {
  id: number;
  name: string;
  location: string;
  price: string;
  status: string;
  imageUrl?: string;
  description?: string;
  richDescription?: string;
  galleryUrls?: string[];
  duration?: string;
  departureTime?: string;
  requirements?: string;
  includes?: string[];
  sellerId?: number;
  providerId?: number;
  businessId?: number;
}

interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
}

interface TourFormData {
  name: string;
  location: string;
  price: string;
  status: string;
  description: string;
  richDescription: string;
  imageUrl: string;
  galleryUrls: string;
  duration: string;
  departureTime: string;
  requirements: string;
  includes: string[];
  sellerId: number | undefined;
  providerId: number | undefined;
}

export default function Tours() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [formData, setFormData] = useState<TourFormData>({
    name: "",
    location: "",
    price: "",
    status: "active",
    description: "",
    richDescription: "",
    imageUrl: "",
    galleryUrls: "",
    duration: "",
    departureTime: "",
    requirements: "",
    includes: [],
    sellerId: undefined,
    providerId: undefined,
  });

  const [isUploading, setIsUploading] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mainContainerClasses, contentClasses } = useResponsiveLayout();

  const { data: tours, isLoading } = useQuery({
    queryKey: ["/api/tours"],
  });

  const { data: providers } = useQuery<User[]>({
    queryKey: ["/api/users", { role: "provider" }],
    queryFn: async () => {
      const res = await fetch("/api/users?role=provider");
      if (!res.ok) throw new Error("Failed to fetch providers");
      return res.json();
    }
  });

  const { data: sellers } = useQuery<User[]>({
    queryKey: ["/api/users", { role: "seller" }],
    queryFn: async () => {
      const res = await fetch("/api/users?role=seller");
      if (!res.ok) throw new Error("Failed to fetch sellers");
      return res.json();
    }
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
      richDescription: "",
      imageUrl: "",
      galleryUrls: "",
      duration: "",
      departureTime: "",
      requirements: "",
      includes: [] as string[],
      sellerId: undefined,
      providerId: undefined,
    });
  };

  const handleEdit = (tour: Tour) => {
    setFormData({
      name: tour.name,
      location: tour.location,
      price: tour.price,
      status: tour.status,
      description: tour.description || "",
      richDescription: tour.richDescription || "",
      imageUrl: tour.imageUrl || "",
      galleryUrls: tour.galleryUrls?.join(",") || "",
      duration: tour.duration || "",
      departureTime: tour.departureTime || "",
      requirements: tour.requirements || "",
      includes: tour.includes || [],
      sellerId: tour.sellerId,
      providerId: tour.providerId,
    });
    setEditingTour(tour);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'imageUrl' | 'gallery') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      // Process one file at a time for safety
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();

        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            // Remove data:image/jpeg;base64, prefix
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const content = await base64Promise;

        const res = await apiRequest("POST", "/api/media", {
          name: file.name,
          mimeType: file.type,
          size: file.size,
          content: content
        });

        if (!res.ok) throw new Error("Upload failed");

        const media = await res.json();
        const mediaUrl = `/api/media/${media.id}?raw=true`;

        if (field === 'imageUrl') {
          setFormData(prev => ({ ...prev, imageUrl: mediaUrl }));
        } else {
          setFormData(prev => ({
            ...prev,
            galleryUrls: prev.galleryUrls ? `${prev.galleryUrls},${mediaUrl}` : mediaUrl
          }));
        }
      }

      toast({ title: "Imagen subida exitosamente" });
    } catch (error) {
      console.error(error);
      toast({ title: "Error al subir imagen", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
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

  // Simple Markdown Parser (Simulation)
  const parseMarkdown = (text: string) => {
    if (!text) return "";
    return text
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
      .replace(/\n/gim, '<br />');
  };

  const renderFormFields = () => (
    <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto px-1">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Información Básica</TabsTrigger>
          <TabsTrigger value="content">Contenido Rico</TabsTrigger>
          <TabsTrigger value="media">Media & Enlaces</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 pt-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Nombre</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="col-span-3"
              placeholder="Ej: Tour Islas Marietas Deluxe"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="location" className="text-right">Ubicación</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="col-span-3"
              placeholder="Ej: Punta de Mita, Nayarit"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">Precio ($)</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="duration" className="text-right">Duración</Label>
            <Input
              id="duration"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
              className="col-span-3"
              placeholder="Ej: 4 horas"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="departureTime" className="text-right">Horario</Label>
            <Input
              id="departureTime"
              value={formData.departureTime}
              onChange={(e) => setFormData(prev => ({ ...prev, departureTime: e.target.value }))}
              className="col-span-3"
              placeholder="Ej: 9:00 AM"
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
          <div className="grid grid-cols-4 items-center gap-4 border-t pt-4">
            <Label htmlFor="providerId" className="text-right flex items-center justify-end">
              <Users className="w-4 h-4 mr-2 text-blue-500" />
              Proveedor
            </Label>
            <Select
              value={formData.providerId?.toString()}
              onValueChange={(value) => setFormData(prev => ({ ...prev, providerId: parseInt(value) }))}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Seleccionar Proveedor (Dueño)" />
              </SelectTrigger>
              <SelectContent>
                {providers?.map(p => (
                  <SelectItem key={p.id} value={p.id.toString()}>{p.fullName || p.username}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center">
              <Info className="w-4 h-4 mr-2" />
              Descripción Corta
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full"
              rows={2}
              placeholder="Resumen rápido para tarjetas..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="includes" className="flex items-center">
              <Info className="w-4 h-4 mr-2" />
              Que Incluye (separado por comas)
            </Label>
            <Textarea
              id="includes"
              value={Array.isArray(formData.includes) ? formData.includes.join(", ") : formData.includes}
              onChange={(e) => setFormData(prev => ({ ...prev, includes: e.target.value.split(",").map(s => s.trim()) }))}
              className="w-full"
              rows={2}
              placeholder="Bebidas, Comida, Transporte..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements" className="flex items-center">
              <Info className="w-4 h-4 mr-2" />
              Requisitos
            </Label>
            <Textarea
              id="requirements"
              value={formData.requirements}
              onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
              className="w-full"
              rows={2}
              placeholder="Edad mínima, ropa cómoda..."
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              <span className="flex items-center">
                <Edit className="w-4 h-4 mr-2" />
                Descripción Detallada (Markdown)
              </span>
            </Label>

            <Tabs defaultValue="editor" className="border rounded-md p-1">
              <TabsList className="grid w-full grid-cols-2 h-8">
                <TabsTrigger value="editor" className="text-xs">Editor</TabsTrigger>
                <TabsTrigger value="preview" className="text-xs">
                  <Eye className="w-3 h-3 mr-1" /> Vista Previa
                </TabsTrigger>
              </TabsList>
              <TabsContent value="editor" className="mt-2">
                <Textarea
                  id="richDescription"
                  value={formData.richDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, richDescription: e.target.value }))}
                  className="w-full font-mono text-sm leading-relaxed"
                  rows={10}
                  placeholder="# Introducción&#10;Describe el tour usando markdown...&#10;&#10;## Qué incluye&#10;- Bebidas&#10;- Guía certificado"
                />
              </TabsContent>
              <TabsContent value="preview" className="mt-2 min-h-[200px] max-h-[400px] overflow-y-auto p-3 bg-gray-50 rounded-md prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: parseMarkdown(formData.richDescription) }} />
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>

        <TabsContent value="media" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="imageUrl" className="flex items-center justify-between">
              <div className="flex items-center">
                <ImageIcon className="w-4 h-4 mr-2" />
                Imagen Principal
              </div>
              <div className="relative">
                <input
                  type="file"
                  id="imageUpload"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'imageUrl')}
                />
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  disabled={isUploading}
                  onClick={() => document.getElementById('imageUpload')?.click()}
                >
                  {isUploading ? "Subiendo..." : "Subir Imagen"}
                </Button>
              </div>
            </Label>
            <div className="flex gap-2">
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                className="flex-1"
                placeholder="https://images.unsplash.com/..."
              />
              {formData.imageUrl && (
                <div className="w-10 h-10 rounded border overflow-hidden bg-muted">
                  <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="galleryUrls" className="flex items-center justify-between">
              <div className="flex items-center">
                <ImageIcon className="w-4 h-4 mr-2" />
                Galería de Imágenes
              </div>
              <div className="relative">
                <input
                  type="file"
                  id="galleryUpload"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileUpload(e, 'gallery')}
                />
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  disabled={isUploading}
                  onClick={() => document.getElementById('galleryUpload')?.click()}
                >
                  {isUploading ? "Subiendo..." : "Subir a Galería"}
                </Button>
              </div>
            </Label>
            <Textarea
              id="galleryUrls"
              value={formData.galleryUrls}
              onChange={(e) => setFormData(prev => ({ ...prev, galleryUrls: e.target.value }))}
              placeholder="url1.jpg, url2.jpg, url3.jpg"
              rows={4}
              className="text-xs"
            />
            {formData.galleryUrls && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {formData.galleryUrls.split(',').filter(u => u.trim()).slice(0, 4).map((url, i) => (
                  <div key={i} className="aspect-square rounded border overflow-hidden bg-muted">
                    <img src={url.trim()} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <MobileSidebar />

      <div className={mainContainerClasses}>
        <div className={contentClasses}>
          <header className="bg-white border-b border-gray-200 p-4 md:p-6">
            <div className="flex justify-between items-center">
              <div className="pl-16 md:pl-0">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Mis Tours</h2>
                <p className="text-sm md:text-base text-gray-600">Gestiona tus tours y experiencias premium</p>
              </div>

              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Tour
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Tour</DialogTitle>
                  </DialogHeader>
                  {renderFormFields()}
                  <div className="flex justify-end space-x-2 border-t pt-4">
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
                  <Skeleton key={i} className="h-[400px] w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {(tours as Tour[])?.map((tour: Tour) => (
                  <Card key={tour.id} className="group overflow-hidden bg-white border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300">
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={tour.imageUrl || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"}
                        alt={tour.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute top-3 right-3">
                        {getStatusBadge(tour.status)}
                      </div>
                    </div>
                    <CardContent className="p-4 md:p-6">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors">{tour.name}</h3>
                          <div className="flex items-center text-muted-foreground text-sm mt-1">
                            <MapPin className="w-4 h-4 mr-1 text-red-400" />
                            <span>{tour.location}</span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 line-clamp-2">
                          {tour.description || "Sin descripción corta disponible."}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Desde</span>
                            <div className="flex items-center text-primary">
                              <DollarSign className="w-4 h-4" />
                              <span className="text-xl font-black">{parseFloat(tour.price).toLocaleString()}</span>
                            </div>
                          </div>
                          {/* Permission-based Edit Button */}
                          {(user?.role === 'master_admin' || (user?.role === 'business' && user?.businessId === tour.businessId)) && (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="bg-gray-100 hover:bg-primary hover:text-white transition-colors"
                              onClick={() => handleEdit(tour)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Editar
                            </Button>
                          )}
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Tour: {editingTour?.name}</DialogTitle>
          </DialogHeader>
          {renderFormFields()}
          <div className="flex justify-end space-x-2 border-t pt-4">
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