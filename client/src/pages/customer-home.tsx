import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import StaticLogo from "@/components/static-logo";
import LoginModal from "@/components/login-modal";
import { usePublicTours } from "@/hooks/usePublicTours";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { Search, MapPin, Clock, Users, Star, ChevronRight, Filter, Heart, User } from "lucide-react";
import { Link } from "wouter";

interface Tour {
  id: number;
  name: string;
  location: string;
  price: string;
  imageUrl?: string;
  description?: string;
  capacity: number;
  duration?: string;
  category: string;
  departureTime?: string;
  status: string;
}

export default function CustomerHome() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const { data: tours, isLoading } = usePublicTours();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const categories = [
    { id: "all", name: "Todos", icon: "🌊", color: "bg-blue-500" },
    { id: "aventura", name: "Aventura", icon: "🏄‍♂️", color: "bg-orange-500" },
    { id: "pesca", name: "Pesca", icon: "🎣", color: "bg-green-500" },
    { id: "naturaleza", name: "Naturaleza", icon: "🐬", color: "bg-teal-500" },
    { id: "snorkel", name: "Snorkel", icon: "🤿", color: "bg-cyan-500" },
  ];

  const filteredTours = (tours as Tour[])?.filter(tour => {
    const matchesSearch = tour.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tour.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || tour.category === selectedCategory;
    return matchesSearch && matchesCategory && tour.status === "active";
  }) || [];

  const getDefaultImage = (tourName: string) => {
    if (tourName.toLowerCase().includes('marietas') || tourName.toLowerCase().includes('island')) {
      return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400";
    }
    if (tourName.toLowerCase().includes('pesca') || tourName.toLowerCase().includes('fishing')) {
      return "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400";
    }
    if (tourName.toLowerCase().includes('snorkel')) {
      return "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400";
    }
    return "https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400";
  };

  const formatPrice = (price: string) => {
    return `$${parseFloat(price).toLocaleString()} MXN`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="p-4 space-y-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-full" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-8 w-20 rounded-full" />)}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Móvil Optimizado */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <StaticLogo size="sm" showText={false} />
              <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-ring">
                  Gente de Mar
                </h1>
                <p className="text-xs text-muted-foreground">Puerto Vallarta • Tours Marinas</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/*
              <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-0 text-xs px-3 py-1 rounded-full">
                ✨ Disponible Hoy
              </Badge>
              */}
              {isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Hola, {user?.fullName}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="rounded-full px-3 py-1 text-xs bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0 hover:from-blue-700 hover:to-cyan-700"
                  >
                    Cerrar Sesión
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowLoginModal(true)}
                  className="rounded-full px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0 hover:from-blue-700 hover:to-cyan-700"
                >
                  <User className="w-4 h-4 mr-2" />
                  Iniciar Sesión
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 pb-6">
        {/* Hero Section */}
        <div className="py-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Descubre Experiencias Únicas
            </h2>
            <p className="text-muted-foreground text-sm">
              Tours y aventuras marinas en la hermosa Bahía de Banderas
            </p>
          </div>

          {/* Búsqueda */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Buscar tours, ubicaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-12 h-12 rounded-2xl border-2 border-gray-200 focus:border-blue-400 bg-white/70 backdrop-blur-sm"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-xl"
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          {/* Categorías */}
          <div className="flex gap-3 overflow-x-auto pb-2 mb-6 scrollbar-hide">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${selectedCategory === category.id
                    ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg scale-105"
                    : "bg-white/70 hover:bg-white border-gray-200"
                  }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Tours Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Tours Disponibles
            </h3>
            <Badge variant="secondary" className="text-xs">
              {filteredTours.length} disponible{filteredTours.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {filteredTours.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay tours disponibles</h3>
              <p className="text-gray-600 text-sm">
                Intenta cambiar los filtros o buscar algo diferente
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredTours.map((tour) => (
                <Link key={tour.id} href={`/book/${tour.id}`}>
                  <Card className="overflow-hidden bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                    <div className="relative">
                      <img
                        src={tour.imageUrl || getDefaultImage(tour.name)}
                        alt={tour.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-white/90 text-gray-800 border-0 text-xs px-2 py-1">
                          {tour.category}
                        </Badge>
                      </div>
                      <div className="absolute top-3 right-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-8 h-8 rounded-full bg-white/90 hover:bg-white p-0"
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="absolute bottom-3 right-3">
                        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1">
                          <span className="text-lg font-bold text-gray-900">
                            {formatPrice(tour.price)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg mb-1">
                            {tour.name}
                          </h4>
                          <div className="flex items-center text-gray-600 text-sm">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span>{tour.location}</span>
                          </div>
                        </div>

                        <p className="text-gray-600 text-sm line-clamp-2">
                          {tour.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            {tour.duration && (
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                <span>{tour.duration}</span>
                              </div>
                            )}
                            <div className="flex items-center">
                              <Users className="w-3 h-3 mr-1" />
                              <span>Máx {tour.capacity}</span>
                            </div>
                            {tour.departureTime && (
                              <div className="flex items-center">
                                <span>🕐 {tour.departureTime}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center">
                            <div className="flex text-yellow-400">
                              {[1, 2, 3, 4, 5].map(i => (
                                <Star key={i} className="w-4 h-4 fill-current" />
                              ))}
                            </div>
                            <span className="text-xs text-gray-500 ml-2">4.9 (124)</span>
                          </div>
                          <button className="btn-ocean-primary px-6 h-9 text-sm font-medium">
                            Reservar
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl text-white text-center">
          <h3 className="text-lg font-bold mb-2">¿Necesitas ayuda?</h3>
          <p className="text-blue-100 text-sm mb-4">
            Nuestro equipo está listo para ayudarte a encontrar la experiencia perfecta
          </p>
          <button className="btn-ocean-secondary font-medium">
            Contactar por WhatsApp
          </button>
        </div>
      </div>

      {/* Modal de Login Opcional */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
}