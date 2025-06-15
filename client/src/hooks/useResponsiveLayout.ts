import { useSidebarContext } from "@/providers/SidebarProvider";

export function useResponsiveLayout() {
  const { isCollapsed } = useSidebarContext();
  
  // Clases para el contenedor principal
  const mainContainerClasses = `flex-1 max-w-full overflow-hidden transition-all duration-300 ${
    isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
  }`;
  
  // Clases para el contenido que debe expandirse
  const contentClasses = isCollapsed 
    ? 'max-w-none px-4' 
    : 'max-w-7xl mx-auto';
    
  // Clases para headers y main sections
  const headerClasses = `flex justify-between items-center ${contentClasses}`;
  const mainClasses = `p-4 md:p-6 space-y-4 md:space-y-6 ${contentClasses}`;
  
  return {
    isCollapsed,
    mainContainerClasses,
    contentClasses,
    headerClasses,
    mainClasses
  };
}