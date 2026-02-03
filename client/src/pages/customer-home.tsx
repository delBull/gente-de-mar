import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StaticLogo from "@/components/static-logo";
import LoginModal from "@/components/login-modal";
import { usePublicTours } from "@/hooks/usePublicTours";
import { useAuth } from "@/hooks/useAuth";
import { Search, MapPin, Clock, Users, Star, ChevronRight, Filter, Heart, User, SlidersHorizontal, ArrowUpDown } from "lucide-react";
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
  const [sortBy, setSortBy] = useState("recommended");
  const [showLoginModal, setShowLoginModal] = useState(false);

  const { data: tours, isLoading } = usePublicTours();
  const { isAuthenticated, user, logout } = useAuth();

  const categories = [
    { id: "all", name: "Todos", icon: "🌊" },
    { id: "aventura", name: "Aventura", icon: "🏄‍♂️" },
    { id: "pesca", name: "Pesca", icon: "🎣" },
    { id: "naturaleza", name: "Naturaleza", icon: "🐬" },
    { id: "snorkel", name: "Snorkel", icon: "🤿" },
  ];

  const filteredAndSortedTours = useMemo(() => {
    let result = (tours as Tour[])?.filter(tour => {
      const matchesSearch = tour.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tour.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || tour.category === selectedCategory;
      return matchesSearch && matchesCategory && tour.status === "active";
    }) || [];

    if (sortBy === "price-low") {
      result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (sortBy === "price-high") {
      result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    }

    return result;
  }, [tours, searchTerm, selectedCategory, sortBy]);

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
      <div className="min-h-screen bg-background">
        <div className="p-4 space-y-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <div className="flex gap-2 pb-2 overflow-hidden">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-24 rounded-full shrink-0" />)}
          </div>
          <div className="grid gap-6">
            {[1, 2].map(i => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-56 w-full rounded-3xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background selection:bg-blue-100">
      {/* Premium Header */}
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-blue-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <StaticLogo size="sm" showText={false} className="relative bg-white rounded-lg p-1" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 tracking-tighter italic">
                  BookerOS
                </h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Premium Experiences</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <div className="hidden md:block text-right">
                    <p className="text-sm font-bold text-gray-900 leading-tight">{user?.fullName}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{user?.role}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => logout()}
                    className="rounded-full hover:bg-blue-50 text-blue-600"
                  >
                    <User className="w-5 h-5" />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setShowLoginModal(true)}
                  className="bg-gray-900 hover:bg-black text-white rounded-full px-6 transition-all duration-300 shadow-lg shadow-gray-200"
                >
                  <User className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Ingresar</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Luxury Hero Section */}
        <section className="relative h-[450px] sm:h-[600px] overflow-hidden">
          <img
            src="/Users/Marco/.gemini/antigravity/brain/c56bb8ae-7e4d-48d7-84b4-be08db358e67/ocean_adventure_hero_1770139894649.png"
            alt="Ocean Adventure"
            className="absolute inset-0 w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10"></div>

          <div className="absolute inset-0 flex flex-col justify-end px-4 pb-16 sm:pb-24 max-w-7xl mx-auto sm:px-6 lg:px-8 z-20">
            <div className="max-w-2xl">
              <Badge className="bg-white/20 backdrop-blur-md text-white border-0 mb-4 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase">
                Bienvenido a BookerOS
              </Badge>
              <h2 className="text-4xl sm:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tight">
                Experiencias <span className="text-blue-400">Extraordinarias</span> en el Mar
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-lg leading-relaxed">
                Navega, explora y conecta con la naturaleza. Los mejores tours marinos en Puerto Vallarta diseñados para recuerdos inolvidables.
              </p>

              {/* Premium Search Bar */}
              <div className="relative group max-w-xl">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl blur opacity-30 group-focus-within:opacity-60 transition duration-500"></div>
                <div className="relative bg-white rounded-2xl p-2 flex items-center shadow-2xl">
                  <Search className="text-gray-400 w-5 h-5 ml-3" />
                  <Input
                    placeholder="¿A dónde quieres ir hoy?"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 border-0 focus-visible:ring-0 text-gray-800 placeholder:text-gray-400 h-12 text-base"
                  />
                  <div className="h-8 w-px bg-gray-100 mx-2 hidden sm:block"></div>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-gray-500 hover:bg-gray-50 rounded-xl">
                        <SlidersHorizontal className="w-5 h-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle className="text-2xl font-black">Filtros Pro</SheetTitle>
                      </SheetHeader>
                      <div className="py-8 space-y-8">
                        <div className="space-y-4">
                          <label className="text-sm font-bold uppercase tracking-widest text-gray-500">Ordenar por</label>
                          <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-full h-12 rounded-xl border-gray-200">
                              <SelectValue placeholder="Seleccionar orden" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="recommended">Recomendados</SelectItem>
                              <SelectItem value="price-low">Precio: Menor a Mayor</SelectItem>
                              <SelectItem value="price-high">Precio: Mayor a Menor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-4">
                          <label className="text-sm font-bold uppercase tracking-widest text-gray-500">Categoría</label>
                          <div className="grid grid-cols-2 gap-3">
                            {categories.map(cat => (
                              <Button
                                key={cat.id}
                                variant={selectedCategory === cat.id ? "default" : "outline"}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`justify-start h-12 rounded-xl ${selectedCategory === cat.id ? "bg-blue-600" : "border-gray-200"}`}
                              >
                                <span className="mr-2">{cat.icon}</span>
                                {cat.name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Quick Categories Slider */}
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-6 sm:pb-8 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 flex items-center px-4 sm:px-6 py-3 sm:py-4 rounded-2xl sm:rounded-3xl transition-all duration-300 shadow-lg ${selectedCategory === category.id
                  ? "bg-blue-600 text-white scale-105"
                  : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  }`}
              >
                <span className="text-xl sm:text-2xl mr-2 sm:mr-3">{category.icon}</span>
                <span className="font-bold text-xs sm:text-sm tracking-tight whitespace-nowrap">{category.name}</span>
              </button>
            ))}
          </div>

          {/* Results Section */}
          <div className="py-12">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
                  Destinos <span className="text-blue-600">Destacados</span>
                </h3>
                <p className="text-muted-foreground">Encontramos {filteredAndSortedTours.length} experiencias para ti</p>
              </div>

              <div className="hidden sm:flex items-center space-x-2 bg-gray-100 p-1 rounded-xl">
                <Button
                  variant={sortBy === "recommended" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setSortBy("recommended")}
                  className="rounded-lg h-8 text-xs font-bold"
                >
                  <ArrowUpDown className="w-3 h-3 mr-1" />
                  POPULARES
                </Button>
                <Button
                  variant={sortBy.startsWith("price") ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setSortBy(sortBy === "price-low" ? "price-high" : "price-low")}
                  className="rounded-lg h-8 text-xs font-bold"
                >
                  PRECIO
                </Button>
              </div>
            </div>

            {filteredAndSortedTours.length === 0 ? (
              <div className="text-center py-24 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <Search className="w-10 h-10 text-blue-300" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Sin resultados</h3>
                <p className="text-gray-500 max-w-xs mx-auto">
                  No pudimos encontrar lo que buscas. Intenta con otros filtros o términos.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredAndSortedTours.map((tour) => (
                  <Link key={tour.id} href={`/book/${tour.id}`}>
                    <Card className="group border-0 bg-white rounded-[32px] overflow-hidden shadow-2xl shadow-blue-900/5 hover:shadow-blue-900/10 transition-all duration-500 hover:-translate-y-2">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img
                          src={tour.imageUrl || getDefaultImage(tour.name)}
                          alt={tour.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-white/90 backdrop-blur-sm text-gray-900 border-0 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                            {tour.category}
                          </Badge>
                        </div>
                        <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-red-500 transition-colors border border-white/30">
                          <Heart className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                          RECOMENDADO
                        </div>
                      </div>

                      <CardContent className="p-8">
                        <div className="flex justify-between items-start mb-4">
                          <div className="space-y-1">
                            <h4 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                              {tour.name}
                            </h4>
                            <div className="flex items-center text-gray-500 text-sm">
                              <MapPin className="w-4 h-4 mr-1 text-blue-500" />
                              <span>{tour.location}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 mb-6 pt-2">
                          {tour.duration && (
                            <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-600">
                              <Clock className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                              {tour.duration}
                            </div>
                          )}
                          <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-600">
                            <Users className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                            Max {tour.capacity}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Desde</span>
                            <span className="text-2xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                              {formatPrice(tour.price)}
                            </span>
                          </div>

                          <div className="flex flex-col items-end">
                            <div className="flex text-yellow-500 mb-1">
                              <Star className="w-4 h-4 fill-current" />
                              <span className="text-sm font-black text-gray-900 ml-1">4.9</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold">(124 reseñas)</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Luxury Newsletter/Help */}
          <section className="mt-24 mb-12 relative overflow-hidden rounded-[48px]">
            <div className="absolute inset-0 bg-blue-600">
              <img
                src="https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&q=80&w=2000"
                className="w-full h-full object-cover opacity-20 mix-blend-overlay"
                alt="Beach background"
              />
            </div>
            <div className="relative px-8 py-20 text-center flex flex-col items-center max-w-2xl mx-auto">
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tight">
                ¿Planeas algo <span className="text-blue-200">especial</span>?
              </h2>
              <p className="text-lg text-blue-100 mb-10 leading-relaxed">
                Tours privados, eventos corporativos o aniversarios. Nuestro equipo concierge está listo para diseñar tu experiencia perfecta.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <Button className="h-14 rounded-2xl bg-white text-blue-600 hover:bg-blue-50 font-black text-base px-8 flex-1 group shadow-2xl">
                  Contactar Concierge
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="outline" className="h-14 rounded-2xl border-white/30 text-white hover:bg-white/10 backdrop-blur-sm font-black text-base px-8 flex-1">
                  Ver Disponibilidad
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      {/* Footer minimalista y premium */}
      <footer className="bg-gray-50 pt-24 pb-12 px-4 border-t border-gray-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center space-x-3">
              <StaticLogo size="sm" showText={false} />
              <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 tracking-tighter italic">
                BookerOS
              </h1>
            </div>
            <p className="text-gray-500 max-w-sm leading-relaxed">
              La plataforma premium de micro-SaaS para Brokers y Operadores Turísticos. Simplificamos la gestión para que te enfoques en la experiencia.
            </p>
          </div>
          <div className="space-y-6">
            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Explorar</h4>
            <ul className="space-y-4 text-gray-500 text-sm font-medium">
              <li><Link href="/" className="hover:text-blue-600 transition-colors">Todos los tours</Link></li>
              <li><Link href="/" className="hover:text-blue-600 transition-colors">Aventura Marina</Link></li>
              <li><Link href="/" className="hover:text-blue-600 transition-colors">Pesca Deportiva</Link></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Compañía</h4>
            <ul className="space-y-4 text-gray-500 text-sm font-medium">
              <li><Link href="/login" className="hover:text-blue-600 transition-colors">Acceso Operadores</Link></li>
              <li><Link href="/" className="hover:text-blue-600 transition-colors">Términos y Condiciones</Link></li>
              <li><Link href="/" className="hover:text-blue-600 transition-colors">Privacidad</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-widest px-4">
          <p>© 2026 BookerOS Platform. All rights reserved.</p>
          <div className="flex space-x-8 mt-4 md:mt-0">
            <a href="#" className="hover:text-gray-900">Instagram</a>
            <a href="#" className="hover:text-gray-900">Facebook</a>
            <a href="#" className="hover:text-gray-900">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  );
}