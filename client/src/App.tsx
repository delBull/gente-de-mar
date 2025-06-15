import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/providers/SidebarProvider";
import Dashboard from "@/pages/dashboard";
import Tours from "@/pages/tours";
import Reservations from "@/pages/reservations";
import Payments from "@/pages/payments";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import CustomerHome from "@/pages/customer-home";
import Customers from "@/pages/customers";
import Booking from "@/pages/booking";
import BookingSuccess from "@/pages/booking-success";
import Ticket from "@/pages/ticket";
import Payment from "@/pages/payment";
import RedeemTicket from "@/pages/redeem-ticket";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Admin Dashboard Routes - Require Authentication */}
      <Route path="/" component={isAuthenticated ? Dashboard : Login} />
      <Route path="/dashboard" component={isAuthenticated ? Dashboard : Login} />
      <Route path="/tours" component={isAuthenticated ? Tours : Login} />
      <Route path="/reservations" component={isAuthenticated ? Reservations : Login} />
      <Route path="/payments" component={isAuthenticated ? Payments : Login} />
      <Route path="/reports" component={isAuthenticated ? Reports : Login} />
      <Route path="/settings" component={isAuthenticated ? Settings : Login} />
      <Route path="/customers" component={isAuthenticated ? Customers : Login} />
      <Route path="/redeem" component={isAuthenticated ? RedeemTicket : Login} />
      <Route path="/redeem-ticket" component={isAuthenticated ? RedeemTicket : Login} />
      
      {/* Customer Booking Routes - Public */}
      <Route path="/customer" component={CustomerHome} />
      <Route path="/book/:id" component={Booking} />
      <Route path="/payment/:bookingData" component={Payment} />
      <Route path="/booking-success/:bookingId" component={BookingSuccess} />
      <Route path="/ticket/:id" component={Ticket} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider>
          <div className="dark">
            <Router />
            <Toaster />
          </div>
        </SidebarProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
