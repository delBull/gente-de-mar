import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

type UserRole = 'business' | 'manager' | 'master_admin';

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date | null;
  businessId: number | null;
  permissions: string[] | null;
  lastLogin: Date | null;
  name?: string;
  avatar?: string;
}
export interface Tour {
  id: number;
  name: string;
  location: string;
  price: string;
  status: string;
  imageUrl: string | null;
  description: string | null;
  userId: number | null;
  businessId: number | null;
  capacity: number;
  duration: string | null;
  includes: string[] | null;
  requirements: string | null;
  departureTime: string | null;
  category: string;
  gallery: string[] | null;
}

export interface Transaction {
  id: number;
  createdAt: Date | null;
  status: string;
  tourId: number | null;
  tourName: string;
  amount: string;
  appCommission: string;
  taxAmount: string;
  bankCommission: string;
  otherRetentions: string;
  sellerPayout: string;
}

export interface Booking {
  id: number;
  createdAt: Date | null;
  status: string;
  tourId: number;
  bookingDate: Date;
  customerId: number | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  adults: number;
  children: number;
  totalAmount: string;
  specialRequests: string | null;
  qrCode: string;
  alphanumericCode: string;
  redeemedAt: Date | null;
  redeemedBy: number | null;
  reservedUntil: Date | null;
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

  const isMasterAdmin = (user: User) => user.role === 'master_admin';
  const isBusiness = (user: User) => user.role === 'business';
  const isManager = (user: User) => user.role === 'manager';

  const canManageBookings = (user: User) => {
    return isMasterAdmin(user) || isBusiness(user);
  };

  const isAdmin = (user: User) => {
    return isMasterAdmin(user);
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.role === 'master_admin') return true;
    return user.permissions?.includes(permission) || false;
  };

  const canAccessFinancials = (): boolean => {
    if (!user) return false;
    return user.role === 'master_admin' || user.role === 'business';
  };

  const canManageUsers = (): boolean => {
    if (!user) return false;
    return user.role === 'master_admin' || user.role === 'business';
  };

  const canAccessSection = (section: string): boolean => {
    if (!isAuthenticated || !user) return false;

    const role: UserRole = user.role;

    // Master Admin puede acceder a todo
    if (role === 'master_admin') return true;

    switch (section) {
      case 'dashboard':
        return role === 'business';
      case 'tours':
        return true; // Todos los usuarios autenticados pueden ver tours
      case 'reservations':
        return true; // Todos los usuarios autenticados pueden ver reservas
      case 'payments':
        // Solo Master Admin y Business pueden ver pagos (manager NO)
        return role === 'business';
      case 'reports':
        return true; // Todos pueden ver reportes
      case 'customers':
        return true; // Todos pueden ver clientes
      case 'customer':
        return true; // Todos los usuarios autenticados pueden ver el portal de clientes
      case 'settings':
        return false; // Solo Master Admin puede cambiar configuraciones (ya manejado arriba)
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