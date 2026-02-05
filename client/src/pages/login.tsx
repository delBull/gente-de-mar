import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import StaticLogo from "@/components/static-logo";
import { User, Lock, Loader2, Fingerprint } from "lucide-react";
import { useLocation } from "wouter";
import { startAuthentication } from "@simplewebauthn/browser";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);

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

  // Passkey login handler
  const handlePasskeyLogin = async () => {
    setError("");
    setIsPasskeyLoading(true);
    try {
      // Start authentication
      const optionsRes = await apiRequest("POST", "/api/webauthn/login/start");
      const options = await optionsRes.json();
      const { tempKey, ...authOptions } = options;

      // Get credential from authenticator
      const credential = await startAuthentication(authOptions);

      // Complete authentication
      const verifyRes = await apiRequest(
        "POST",
        "/api/webauthn/login/finish",
        { credential, tempKey }
      );

      if (verifyRes.ok) {
        const data = await verifyRes.json();

        // IMPORTANT: Sync state for Router by updating localStorage because useAuth reads it on mount
        if (data.user) {
          localStorage.setItem("auth_user", JSON.stringify(data.user));
        }

        // Redirect to dashboard (Force reload to re-mount Router with new auth state)
        setTimeout(() => {
          // setLocation("/dashboard"); // Wouter internal nav might not trigger useAuth re-init
          window.location.href = "/dashboard";
        }, 100);
      } else {
        throw new Error("Authentication failed");
      }
    } catch (error: any) {
      console.error("Passkey login error:", error);
      setError(error.message || "Error con passkey. Intenta con usuario/contraseña");
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl opacity-50 animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-ring/20 rounded-full blur-3xl opacity-50 animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <Card className="w-full max-w-md z-10 bg-card/80 backdrop-blur-lg border-primary/20 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <StaticLogo size="lg" showText={false} />
          </div>
          <CardTitle className="text-3xl font-black text-foreground tracking-tighter italic">
            BookerOS
          </CardTitle>
          <p className="text-muted-foreground">Operating System for Tours</p>
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

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">O inicia con</span>
              </div>
            </div>

            {/* Passkey Login Button */}
            <button
              type="button"
              onClick={handlePasskeyLogin}
              disabled={isPasskeyLoading}
              className="btn-ocean-secondary w-full flex items-center justify-center gap-2"
            >
              {isPasskeyLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Autenticando...
                </>
              ) : (
                <>
                  <Fingerprint className="h-5 w-5" />
                  Passkey (Huella / Face ID)
                </>
              )}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}