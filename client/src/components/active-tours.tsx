import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Tour {
  id: number;
  name: string;
  location: string;
  price: string;
  status: string;
  imageUrl?: string;
  description?: string;
}

interface ActiveToursProps {
  tours?: Tour[];
  isLoading: boolean;
}

export default function ActiveTours({ tours, isLoading }: ActiveToursProps) {
  if (isLoading) {
    return (
      <Card className="dashboard-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Tours Activos</CardTitle>
            <Skeleton className="h-8 w-16" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded" />
                </div>
                <Skeleton className="w-full h-32 rounded-lg mb-3" />
                <div className="flex justify-between text-sm">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Defensive check: ensure tours is an array
  if (!tours || !Array.isArray(tours) || tours.length === 0) {
    return (
      <Card className="dashboard-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Tours Activos</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              Ver Todo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No hay tours activos
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-primary text-primary-foreground">Activo</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400/80">Pendiente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDefaultImage = (tourName: string) => {
    if (tourName.toLowerCase().includes('marietas') || tourName.toLowerCase().includes('island')) {
      return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=150";
    }
    if (tourName.toLowerCase().includes('pesca') || tourName.toLowerCase().includes('fishing')) {
      return "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=150";
    }
    return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=150";
  };

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Tours Activos</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
            Ver Todo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.isArray(tours) && tours.slice(0, 2).map((tour) => (
            <div key={tour.id} className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium text-foreground">{tour.name}</h4>
                  <p className="text-sm text-muted-foreground">{tour.location}</p>
                </div>
                {getStatusBadge(tour.status)}
              </div>

              <img
                src={tour.imageUrl || getDefaultImage(tour.name)}
                alt={tour.name}
                className="w-full h-32 object-cover rounded-lg mb-3"
              />

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Desde</span>
                <span className="font-bold text-primary">
                  ${parseFloat(tour.price).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
