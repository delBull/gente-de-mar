import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";
import { FaGoogle, FaApple, FaFacebook } from "react-icons/fa";
import { SiWalletconnect } from "react-icons/si";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  // Cerrar modal con tecla ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleSocialLogin = (provider: string) => {
    // Este es un modal de login social para clientes, no para dashboard
    // Solo cerramos el modal ya que este no debe redirigir al dashboard
    onClose();
  };

  const socialOptions = [
    { 
      name: "Google", 
      icon: FaGoogle, 
      color: "hover:bg-red-50 hover:border-red-200",
      textColor: "text-red-600"
    },
    { 
      name: "Apple", 
      icon: FaApple, 
      color: "hover:bg-gray-50 hover:border-gray-200",
      textColor: "text-gray-800"
    },
    { 
      name: "Facebook", 
      icon: FaFacebook, 
      color: "hover:bg-blue-50 hover:border-blue-200",
      textColor: "text-blue-600"
    },
    { 
      name: "MetaMask", 
      icon: () => <div className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center text-white text-xs font-bold">M</div>, 
      color: "hover:bg-orange-50 hover:border-orange-200",
      textColor: "text-orange-600"
    },
    { 
      name: "WalletConnect", 
      icon: SiWalletconnect, 
      color: "hover:bg-purple-50 hover:border-purple-200",
      textColor: "text-purple-600"
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 min-h-screen"
            onClick={onClose}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <Card className="bg-white shadow-xl">
                <CardHeader className="relative pb-4">
                  <Button
                    onClick={onClose}
                    variant="ghost"
                    size="sm"
                    className="absolute right-4 top-4 h-8 w-8 rounded-full p-0 hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </Button>
                  <CardTitle className="text-center text-xl font-semibold text-gray-800">
                    Iniciar Sesión
                  </CardTitle>
                  <p className="text-center text-sm text-gray-600 mt-2">
                    Accede a tu cuenta para gestionar tus reservaciones
                  </p>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Social Login Buttons */}
                  {socialOptions.map((option) => (
                    <Button
                      key={option.name}
                      variant="ghost"
                      className={`w-full h-12 justify-start space-x-3 border border-gray-200 bg-white/50 backdrop-blur-sm hover:bg-white hover:shadow-sm transition-all ${option.color}`}
                      onClick={() => handleSocialLogin(option.name.toLowerCase())}
                    >
                      <option.icon className={`w-5 h-5 ${option.textColor}`} />
                      <span className="text-gray-700 font-medium">Continuar con {option.name}</span>
                    </Button>
                  ))}

                  {/* Passkeys Option */}
                  <Button
                    variant="ghost"
                    className="w-full h-12 justify-start space-x-3 border border-gray-200 bg-white/50 backdrop-blur-sm hover:bg-indigo-50 hover:border-indigo-200 hover:shadow-sm transition-all"
                    onClick={() => handleSocialLogin('passkeys')}
                  >
                    <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">🔑</span>
                    </div>
                    <span className="text-gray-700 font-medium">Usar Passkeys</span>
                  </Button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500">O continúa como invitado</span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    className="w-full h-12 text-gray-600 hover:bg-gray-50/80 transition-colors"
                    onClick={onClose}
                  >
                    Continuar sin cuenta
                  </Button>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    Al continuar, aceptas nuestros términos de servicio y política de privacidad
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}