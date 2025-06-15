import { Waves, Anchor, Ship } from "lucide-react";

interface StaticLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export default function StaticLogo({ size = "md", showText = true }: StaticLogoProps) {
  const sizeClasses = {
    sm: {
      container: "w-12 h-12",
      ship: "w-6 h-6",
      waves: "w-10 h-10",
      anchor: "w-3 h-3",
      text: "text-lg"
    },
    md: {
      container: "w-16 h-16",
      ship: "w-8 h-8", 
      waves: "w-12 h-12",
      anchor: "w-3 h-3",
      text: "text-xl"
    },
    lg: {
      container: "w-24 h-24",
      ship: "w-12 h-12",
      waves: "w-20 h-20", 
      anchor: "w-4 h-4",
      text: "text-2xl"
    }
  };

  const classes = sizeClasses[size];

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Container principal del logo */}
      <div className="relative">
        {/* Círculo de fondo con gradiente */}
        <div className={`${classes.container} rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center relative overflow-hidden shadow-lg`}>
          {/* Ondas de fondo */}
          <div className="absolute bottom-1">
            <Waves className={`${classes.waves} text-blue-100 opacity-30`} />
          </div>
          
          {/* Barco principal */}
          <div className="relative z-10">
            <Ship className={`${classes.ship} text-white`} />
          </div>
          
          {/* Ancla decorativa */}
          <div className="absolute top-1 right-1">
            <Anchor className={`${classes.anchor} text-blue-200 opacity-80`} />
          </div>
        </div>
      </div>

      {/* Texto */}
      {showText && (
        <div className="mt-3 text-center">
          <h2 className={`${classes.text} font-bold text-gray-900`}>
            Gente de Mar
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Sistema de Tours
          </p>
        </div>
      )}
    </div>
  );
}