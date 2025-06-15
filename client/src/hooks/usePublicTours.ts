import { useQuery } from "@tanstack/react-query";

// Hook específico para obtener tours públicos sin necesidad de autenticación
export function usePublicTours() {
  return useQuery({
    queryKey: ["/api/tours"],
    queryFn: async () => {
      const res = await fetch("/api/tours", {
        credentials: "omit", // No enviar cookies de sesión
      });
      
      if (res.ok) {
        return await res.json();
      }
      
      // Si hay error, devolver array vacío en lugar de lanzar error
      return [];
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para obtener un tour específico públicamente
export function usePublicTour(id: number | string | null) {
  return useQuery({
    queryKey: ["/api/tours", id],
    queryFn: async () => {
      const res = await fetch(`/api/tours/${id}`, {
        credentials: "omit", // No enviar cookies de sesión
      });
      
      if (res.ok) {
        return await res.json();
      }
      
      // Si hay error, devolver null
      return null;
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: !!id, // Solo ejecutar si hay ID
  });
}