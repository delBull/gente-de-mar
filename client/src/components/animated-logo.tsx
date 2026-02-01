import { motion } from "framer-motion";
import { Waves } from "lucide-react";

export default function AnimatedLogo() {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      {/* Container principal con animación de entrada */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative"
      >
        <motion.div
          animate={{
            boxShadow: [
              "0 0 20px rgba(59, 130, 246, 0.2)",
              "0 0 40px rgba(59, 130, 246, 0.4)",
              "0 0 20px rgba(59, 130, 246, 0.2)"
            ]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-28 h-28 rounded-2xl bg-white flex items-center justify-center relative shadow-xl overflow-hidden"
        >
          <img
            src="/logo.png"
            alt="BookerOS Logo"
            className="w-24 h-24 object-contain"
          />
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
            color: ["#1f2937", "#2563eb", "#1f2937"]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="text-2xl font-black tracking-tighter"
        >
          BookerOS
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="text-xs uppercase tracking-[0.3em] text-blue-600 font-bold mt-1"
        >
          Operating System for Tours
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