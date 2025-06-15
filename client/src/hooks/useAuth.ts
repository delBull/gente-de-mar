import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: 'master_admin' | 'business' | 'manager';
  businessId?: number;
  permissions?: string[];
  isActive: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("auth_user");
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem("auth_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      
      if (!response.ok) {
        throw new Error("Credenciales inválidas");
      }
      
      const userData = await response.json();
      setUser(userData.user || userData);
      setIsAuthenticated(true);
      localStorage.setItem("auth_user", JSON.stringify(userData.user || userData));
      
      // Forzar recarga de la página para actualizar el estado
      window.location.href = "/dashboard";
      return userData.user || userData;
    } catch (error: any) {
      throw new Error(error.message || "Credenciales inválidas");
    }
  };

  const refetchUser = async () => {
    const savedUser = localStorage.getItem("auth_user");
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem("auth_user");
      }
    }
  };

  const logout = async () => {
    try {
      // Hacer logout en el servidor
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Server logout error:', error);
    } finally {
      // Siempre limpiar el estado local
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("auth_user");
      
      // Forzar recarga de página para limpiar estado
      window.location.reload();
    }
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.role === 'master_admin') return true;
    return user.permissions?.includes(permission) || false;
  };

  const canAccessFinancials = () => {
    return user?.role === 'master_admin' || user?.role === 'business';
  };

  const canManageUsers = () => {
    return user?.role === 'master_admin' || user?.role === 'business';
  };

  const canAccessSection = (section: string) => {
    if (!isAuthenticated || !user) return false;
    
    // Master Admin puede acceder a todo
    if (user.role === 'master_admin') return true;
    
    switch (section) {
      case 'dashboard':
        return user.role === 'business' || user.role === 'master_admin';
      case 'tours':
        return true; // Todos los usuarios autenticados pueden ver tours
      case 'reservations':
        return true; // Todos los usuarios autenticados pueden ver reservas
      case 'payments':
        // Solo Master Admin y Business pueden ver pagos (manager NO)
        return user.role === 'master_admin' || user.role === 'business';
      case 'reports':
        return true; // Todos pueden ver reportes
      case 'customers':
        return true; // Todos pueden ver clientes
      case 'settings':
        // Solo Master Admin puede cambiar configuraciones
        return user.role === 'master_admin';
      case 'redeem':
        return true; // Todos los usuarios autenticados pueden canjear tickets
      default:
        return false;
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refetchUser,
    hasPermission,
    canAccessFinancials,
    canManageUsers,
    canAccessSection,
  };
}