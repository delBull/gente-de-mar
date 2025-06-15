import { ReactNode } from 'react';

interface MobileDashboardLayoutProps {
  children: ReactNode;
}

export default function MobileDashboardLayout({ children }: MobileDashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-style header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="pl-16 md:pl-0">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Resumen general de tu negocio</p>
        </div>
      </div>

      {/* Mobile-style content container */}
      <div className="p-4 space-y-6">
        {/* Content grid with mobile-first approach */}
        <div className="grid grid-cols-1 gap-6">
          {children}
        </div>
      </div>
    </div>
  );
}