import { motion } from "framer-motion";
import { Waves, Anchor, Ship } from "lucide-react";

export default function AnimatedLogo() {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      {/* Container principal con animación de entrada */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative"
      >
        {/* Círculo de fondo con gradiente */}
        <motion.div
          animate={{ 
            boxShadow: [
              "0 0 20px rgba(59, 130, 246, 0.3)",
              "0 0 40px rgba(59, 130, 246, 0.5)",
              "0 0 20px rgba(59, 130, 246, 0.3)"
            ]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center relative overflow-hidden"
        >
          {/* Ondas de fondo animadas */}
          <motion.div
            animate={{ 
              y: [0, -8, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-2"
          >
            <Waves className="w-16 h-16 text-blue-100 opacity-30" />
          </motion.div>
          
          {/* Barco principal */}
          <motion.div
            animate={{ 
              y: [0, -4, 0],
              rotate: [0, 2, 0, -2, 0]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10"
          >
            <Ship className="w-10 h-10 text-white" />
          </motion.div>
          
          {/* Ancla decorativa */}
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 0],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute top-1 right-1"
          >
            <Anchor className="w-4 h-4 text-blue-200" />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Texto animado */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="mt-6 text-center"
      >
        <motion.h2
          animate={{ 
            color: ["#1f2937", "#3b82f6", "#1f2937"]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="text-xl font-bold"
        >
          Gente de Mar
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="text-sm text-gray-500 mt-1"
        >
          Sistema de Tours
        </motion.p>
      </motion.div>

      {/* Ondas flotantes decorativas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              x: [0, 100, 0],
              y: [0, -20, 0],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{
              duration: 6 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 2
            }}
            className={`absolute w-8 h-8 text-blue-300`}
            style={{
              left: `${20 + i * 25}%`,
              top: `${30 + i * 20}%`
            }}
          >
            <Waves className="w-full h-full opacity-20" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}