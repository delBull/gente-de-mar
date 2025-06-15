import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import StaticLogo from "@/components/static-logo";
import { User, Lock, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      return await login(credentials.username, credentials.password);
    },
    onSuccess: () => {
      setError("");
      setUsername("");
      setPassword("");
      
      // Redirigir al dashboard después del login exitoso
      setTimeout(() => {
        setLocation("/dashboard");
      }, 100);
    },
    onError: (error: any) => {
      setError(error.message || "Error de autenticación");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Por favor ingresa usuario y contraseña");
      return;
    }
    loginMutation.mutate({ username: username.trim(), password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <StaticLogo size="lg" showText={false} />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-100">
            Gente de Mar
          </CardTitle>
          <p className="text-gray-100">Panel de Administración</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingresa tu usuario"
                  className="pl-10"
                  disabled={loginMutation.isPending}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  className="pl-10"
                  disabled={loginMutation.isPending}
                />
              </div>
            </div>
            
            <button
              type="submit"
              className="btn-ocean-primary w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-500 space-y-1">
            <p>Credenciales de prueba:</p>
            <div className="text-xs space-y-1">
              <p><strong>Master:</strong> Dario / gentedemar</p>
              <p><strong>Business:</strong> Business / tour2025</p>
              <p><strong>Manager:</strong> Manager / admin</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}