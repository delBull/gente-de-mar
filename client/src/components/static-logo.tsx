import { Waves, Anchor, Ship } from "lucide-react";

interface StaticLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export default function StaticLogo({ size = "md", showText = true, className = "" }: StaticLogoProps) {
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
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Container principal del logo */}
      <div className="relative">
        <img
          src="/logo.png"
          alt="BookerOS Logo"
          className={`${classes.container} object-contain transition-transform duration-500 hover:scale-110`}
        />
      </div>

      {/* Texto */}
      {showText && (
        <div className="mt-3 text-center">
          <h2 className={`${classes.text} font-black text-gray-900 tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600`}>
            BookerOS
          </h2>
          <p className="text-[10px] uppercase tracking-[0.3em] text-blue-600 font-bold mt-0.5">
            Tour Management
          </p>
        </div>
      )}
    </div>
  );
}