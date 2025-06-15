# Gente de Mar - Tours Booking Platform

## Project Overview
A comprehensive tours business platform with dual interfaces:
1. **Admin Dashboard** - Financial management and business operations for tour operators
2. **Customer Booking Platform** - Mobile-friendly public interface for customers to browse and book tours

## Project Architecture

### Backend
- Node.js with Express server
- PostgreSQL database with Drizzle ORM
- RESTful API endpoints for tours, bookings, payments
- Session-based temporary seat reservations (15-minute holds)

### Frontend - Admin Dashboard
- React with TypeScript
- Shadcn/ui components with dark theme
- Mobile-responsive design with slide menu navigation
- Multi-level authentication system (Master Admin, Business, Manager)
- Permission-based access control for sensitive sections
- Financial dashboard with payment flow visualization
- Tour management, reservations, payments, and reporting sections

### Frontend - Customer Platform
- Mobile-first responsive design
- Guest booking (no required login)
- Optional user accounts for booking history
- ThirdWeb SDK 5 integration for crypto and traditional payments
- Smart wallet creation with multiple auth methods (Google, Apple, phone, passkeys)
- Digital ticket generation with QR codes

### Database Schema
- Users with role-based access (Master Admin, Business, Manager)
- Businesses for multi-tenant organization
- Tours with capacity management linked to businesses
- Bookings with temporary holds
- Transactions with automated fund distribution
- Retention configuration for commission rates

## GitHub Repository
- **Repositorio**: https://github.com/deBull/gente-de-mar
- **Usuario**: deBull
- **Configurado para**: Deploy directo con Vercel y Railway
- **Archivos de configuración**: vercel.json, .env.example, DEPLOY.md, README.md

## Deploy y Configuración
- **Plataforma recomendada**: Vercel (deploy automático desde GitHub)
- **Base de datos recomendada**: Neon.tech (PostgreSQL gratuito)
- **Variables de entorno**: DATABASE_URL, SESSION_SECRET, NODE_ENV
- **Comandos de build**: npm run build (cliente + servidor)
- **Credenciales por defecto**: Master (Dario/gentedemar), Business (Business/tour2025), Manager (Manager/admin)

## Recent Changes
- **Jun 15, 2025**: Preparado proyecto completo para GitHub y deployment con Vercel
- **Jun 15, 2025**: Creados archivos README.md, DEPLOY.md, vercel.json, .env.example y .gitignore
- **Jun 15, 2025**: Documentado proceso completo de instalación local y deployment en la nube
- **Jun 15, 2025**: Configurado repositorio para usuario deBull en GitHub con guías detalladas
- **Jun 15, 2025**: Añadido toggle de layout móvil/desktop en dashboard web con botones de smartphone/monitor
- **Jun 15, 2025**: Implementado layout móvil vertical de una columna y layout desktop de 2 columnas
- **Jun 15, 2025**: Redesigned digital ticket with premium visual design using Framer Motion animations and gradient backgrounds
- **Jun 15, 2025**: Added Apple Wallet and Google Pay integration buttons that detect device type automatically
- **Jun 15, 2025**: Enhanced ticket download functionality using html2canvas for high-quality image generation
- **Jun 15, 2025**: Implemented sparkle effects and smooth animations for ticket interactions
- **Jun 15, 2025**: Added validation history section to reservations page - displays real-time data of all validated tickets with complete booking and tour information
- **Jun 15, 2025**: Created comprehensive validation tracking system with automatic 30-second refresh to show live ticket redemptions
- **Jun 15, 2025**: Implemented getValidationHistory API endpoint and database storage method for complete ticket redemption audit trail
- **Jun 15, 2025**: Fixed redeem-ticket page routing by adding `/redeem-ticket` route to React router configuration
- **Jun 15, 2025**: Fixed alphanumeric code input field maxLength from 12 to 19 characters to support full format (VYM5-M5K9-J3Z6-3Z54)
- **Jun 15, 2025**: Corrected redeem-ticket page layout positioning to match dashboard structure - content now properly centered
- **Jun 15, 2025**: Enhanced mobile camera UX with retry button for camera permissions - users can now retry camera access when permissions are denied initially
- **Jun 15, 2025**: Improved QR scanner with optimized mobile camera constraints, visual overlay guides, and detailed permission instructions
- **Jun 15, 2025**: Added professional scanning interface with corner brackets, instruction overlay, and mobile-specific tips for better UX
- **Jun 15, 2025**: Created innovative full-height burger menu with ocean gradient (cyan to blue) for mobile/tablet - vertical bar design with centered burger lines and wave pattern overlay
- **Jun 15, 2025**: Optimized layout spacing - increased mobile/tablet margin to pl-20 for better separation from vertical burger menu
- **Jun 15, 2025**: Implemented responsive sidebar behavior - sidebar hidden on tablets, content auto-adjusts between collapsed (lg:ml-16) and expanded (xl:ml-64) desktop sidebar states
- **Jun 15, 2025**: Created dynamic sidebar system with shared context - desktop sidebar has collapse/expand button, all pages respond automatically to sidebar state changes
- **Jun 15, 2025**: Content layout adjusts in real-time: collapsed sidebar (64px margin) vs expanded sidebar (256px margin) with smooth transitions
- **Jun 15, 2025**: Improved QR scanner interface with better error handling and user guidance for mobile devices
- **Jun 15, 2025**: Fixed critical booking-success page bug that prevented retrieval of booking details after payment - corrected React Query configuration to fetch individual booking objects instead of arrays
- **Jun 15, 2025**: Enhanced text visibility and button styling throughout booking-success page - implemented consistent black text for data visibility and white text for action buttons
- **Jun 15, 2025**: Resolved redeem-ticket page layout issues with proper mobile camera QR scanning functionality and improved error handling for camera permissions
- **Jun 15, 2025**: Implemented comprehensive ticket validation system with alphanumeric codes and QR scanning capabilities
- **Jun 15, 2025**: Added digital ticket component with QR code generation, download, and sharing functionality
- **Jun 15, 2025**: Created complete ticket redemption interface for Business and Manager roles with camera scanning
- **Jun 15, 2025**: Enhanced booking success page with celebration effects and comprehensive ticket display
- **Jun 15, 2025**: Added camera icon in admin panel header for quick access to ticket scanner
- **Jun 15, 2025**: Integrated backup alphanumeric codes (9-character format) alongside QR codes for offline validation
- **Jun 15, 2025**: Fixed burger menu display consistency in redeem ticket page to match all other admin pages
- **Jun 15, 2025**: Fixed complete logout functionality - logout from customer interface now works correctly
- **Jun 15, 2025**: Improved logout system to clear server session and local state properly
- **Jun 15, 2025**: Updated useAuth hook to handle server logout and force page reload for clean state
- **Jun 15, 2025**: Logout now works consistently from both dashboard and customer interfaces
- **Jun 15, 2025**: Implemented optional authentication for customer interface - customers can browse and book tours without mandatory login
- **Jun 15, 2025**: Created usePublicTours hook for public API access without authentication credentials
- **Jun 15, 2025**: Updated customer pages (home and booking) to use public API endpoints, ensuring functionality without login
- **Jun 15, 2025**: Added optional login modal for customer interface with ocean-themed gradient buttons (blue to cyan)
- **Jun 15, 2025**: Finalized dashboard layout with responsive 2-column structure - financial panels show in horizontal line for web (4 panels) and 2x2 grid for tablet/mobile, maintaining user-friendly distribution
- **Jun 15, 2025**: Confirmed optimal dashboard sections arrangement: PaymentFlowChart + RecentTransactions, ActiveTours + RetentionConfig in 2-column layout
- **Jun 15, 2025**: Updated settings page with white text theme - all labels, titles, and descriptions now use white/gray-300 colors on dark card backgrounds
- **Jun 15, 2025**: Implemented automatic scroll-to-top functionality for all dashboard navigation links - provides smooth user experience when switching pages
- **Jun 15, 2025**: Enhanced mobile navigation UX with consistent scroll behavior across all dashboard sections
- **Jun 15, 2025**: Implemented complete authentication system with PostgreSQL database
- **Jun 15, 2025**: Added three user roles: Master Admin (Dario/gentedemar), Business (Business/tour2025), Manager (Manager/admin)
- **Jun 15, 2025**: Created role-based access control system with permission management
- **Jun 15, 2025**: Added animated logo with Framer Motion - appears centered in sidebar when no user logged in, hides when authenticated
- **Jun 15, 2025**: Created static logo component for dashboard and customer pages with consistent ocean/wave branding
- **Jun 15, 2025**: Implemented ocean-themed gradient buttons as global accent style (.btn-ocean-primary and .btn-ocean-secondary)
- **Jun 15, 2025**: Updated authentication modal, dashboard header, and customer homepage to use consistent branding
- **Jun 15, 2025**: Fixed authentication system by creating dedicated login page, replaced sidebar icon with static logo
- **Jun 15, 2025**: Integrated authentication modal with sidebar for seamless login/logout experience
- **Jun 15, 2025**: Fixed deployment health check issues - added proper root route handlers and health endpoints
- **Jun 15, 2025**: Implemented smart routing for deployment monitoring (detects health check requests vs browser requests)
- **Jun 15, 2025**: Added `/health` and `/api/health` endpoints for production deployment monitoring
- **Jan 15, 2025**: Completed comprehensive dashboard visual overhaul with unified white theme
- **Jan 15, 2025**: Fixed all page title margins (pl-16) to prevent burger menu overlap
- **Jan 15, 2025**: Converted all dashboard modules from blue to white with subtle shadows and blur effects
- **Jan 15, 2025**: Updated financial overview cards with consistent white backgrounds and light color accents
- **Jan 15, 2025**: Fixed mobile overflow issues in payments and reports pages with proper responsive design
- **Jan 15, 2025**: Changed redeem ticket "Instrucciones de Uso" title from white to black for visibility
- **Jan 15, 2025**: Added customers navigation link to sidebar footer alongside logout button
- **Jan 15, 2025**: Eliminated all remaining dark elements (buttons, fields, cards) across entire dashboard
- **Jan 15, 2025**: Implemented consistent gray-50 page backgrounds with white card overlays throughout
- **Jan 15, 2025**: Created complete customers management page (/customers) with statistics and client listings
- **Jan 15, 2025**: Added "Portal de Reservas" link below reports in navigation menu for customer booking platform access

## User Preferences
- Spanish language interface for Mexico market
- Simple, mobile-friendly user experience
- Minimal friction booking process
- Support for both traditional and crypto payments
- Next-day booking limitation for walk-in customers

## Technical Decisions
- Using PostgreSQL for production reliability
- ThirdWeb SDK 5 for comprehensive payment options
- Session-based booking holds to prevent overbooking
- QR code tickets with multiple sharing/saving options
- No mandatory user registration for booking process