import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { insertTransactionSchema, insertTourSchema, insertBookingSchema, insertSeatHoldSchema, insertTicketRedemptionSchema } from "../shared/schema.js";
import { nanoid } from "nanoid";
import { generateAlphanumericCode, canRedeemTickets, canCreateTours } from "../shared/utils.js";
import { log } from "./vite.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database with users on server start
  log("initializing database...");
  await storage.initializeDatabase();
  log("database initialized");

  // Health check endpoints for deployment
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok", message: "Server is running" });
  });

  // Root endpoint for health checks (production deployment requirement)
  app.get("/", (req, res, next) => {
    // Only respond with JSON if this is a health check request
    // Otherwise, let it fall through to static file serving
    const userAgent = req.get('User-Agent') || '';
    const acceptHeader = req.get('Accept') || '';

    // Check if this looks like a health check request
    if (userAgent.includes('kube-probe') ||
      userAgent.includes('GoogleHC') ||
      acceptHeader.includes('application/json') ||
      req.query.health !== undefined) {
      return res.status(200).json({ status: "ok", message: "Server is running" });
    }

    // Let static file serving handle regular browser requests
    next();
  });
  // Authentication endpoints
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Usuario y contraseña son requeridos" });
      }

      // Authenticate user with exact credentials from database
      const user = await storage.authenticateUser(username, password);

      if (!user) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      // Return user data with role-based permissions
      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          businessId: user.businessId,
          permissions: user.permissions,
          isActive: user.isActive
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    res.json({ message: "Logged out successfully" });
  });

  // Customer logout endpoint - forces complete session cleanup
  app.get("/api/customer/logout", async (req: any, res) => {
    try {
      // Destroy session if it exists
      if (req.session) {
        req.session.destroy((err: any) => {
          if (err) {
            console.error("Session destruction error:", err);
          }
        });
      }

      // Clear all possible session cookies
      res.clearCookie('connect.sid', { path: '/' });
      res.clearCookie('session', { path: '/' });
      res.clearCookie('auth', { path: '/' });

      // Return success response
      res.json({
        success: true,
        message: "Logged out successfully from customer interface"
      });
    } catch (error) {
      console.error("Customer logout error:", error);
      res.json({
        success: true,
        message: "Logged out (fallback)"
      });
    }
  });

  // Get financial summary
  app.get("/api/financial-summary", async (req, res) => {
    try {
      const summary = await storage.getFinancialSummary();
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Error fetching financial summary" });
    }
  });

  // Get recent transactions
  app.get("/api/transactions", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const transactions = await storage.getRecentTransactions(limit);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching transactions" });
    }
  });

  // Get all tours
  app.get("/api/tours", async (req, res) => {
    try {
      const tours = await storage.getTours();
      res.json(tours);
    } catch (error) {
      res.status(500).json({ message: "Error fetching tours" });
    }
  });

  // Get retention configuration
  app.get("/api/retention-config", async (req, res) => {
    try {
      const config = await storage.getRetentionConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ message: "Error fetching retention configuration" });
    }
  });

  // Update retention configuration
  app.put("/api/retention-config", async (req, res) => {
    try {
      const config = await storage.updateRetentionConfig(req.body);
      res.json(config);
    } catch (error) {
      res.status(500).json({ message: "Error updating retention configuration" });
    }
  });

  // Create new transaction (simulate payment processing)
  app.post("/api/transactions", async (req, res) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(transactionData);
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ message: "Invalid transaction data" });
    }
  });

  // Get single tour by ID
  app.get("/api/tours/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tour = await storage.getTour(id);
      if (!tour) {
        return res.status(404).json({ message: "Tour not found" });
      }
      res.json(tour);
    } catch (error) {
      res.status(500).json({ message: "Error fetching tour" });
    }
  });

  // Create new tour
  app.post("/api/tours", async (req, res) => {
    try {
      const tourData = insertTourSchema.parse(req.body);
      const tour = await storage.createTour(tourData);
      res.json(tour);
    } catch (error) {
      res.status(400).json({ message: "Invalid tour data" });
    }
  });

  // Update tour
  app.put("/api/tours/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tourData = insertTourSchema.partial().parse(req.body);
      const tour = await storage.updateTour(id, tourData);
      if (!tour) {
        return res.status(404).json({ message: "Tour not found" });
      }
      res.json(tour);
    } catch (error) {
      res.status(400).json({ message: "Invalid tour data" });
    }
  });

  // Create seat hold (15-minute temporary reservation)
  app.post("/api/seat-holds", async (req, res) => {
    try {
      const seatHoldData = insertSeatHoldSchema.parse(req.body);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

      const seatHold = await storage.createSeatHold({
        ...seatHoldData,
        expiresAt
      });

      res.json(seatHold);
    } catch (error) {
      res.status(400).json({ message: "Invalid seat hold data" });
    }
  });

  // Create booking
  app.post("/api/bookings", async (req, res) => {
    try {
      // Log the incoming data for debugging
      console.log("Booking request body:", req.body);

      // Parse the booking data with optional fields
      const bookingData = {
        tourId: parseInt(req.body.tourId),
        customerId: req.body.customerId || null,
        customerName: req.body.customerName,
        customerEmail: req.body.customerEmail || null,
        customerPhone: req.body.customerPhone || null,
        bookingDate: new Date(req.body.bookingDate),
        adults: parseInt(req.body.adults),
        children: parseInt(req.body.children),
        totalAmount: req.body.totalAmount.toString(),
        specialRequests: req.body.specialRequests || null
      };

      // Generate QR code data and alphanumeric code
      const qrCode = nanoid();
      const alphanumericCode = generateAlphanumericCode();

      const booking = await storage.createBooking({
        ...bookingData,
        qrCode,
        alphanumericCode,
        status: "confirmed",
        reservedUntil: new Date(Date.now() + 15 * 60 * 1000)
      });


      res.json(booking);
    } catch (error) {
      console.error("Booking creation error:", error);
      res.status(400).json({ message: "Invalid booking data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Get all bookings for debugging
  app.get("/api/bookings", async (req, res) => {
    try {
      const bookings = await storage.getBookings();
      console.log("All bookings:", bookings);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching all bookings:", error);
      res.status(500).json({ message: "Error fetching bookings" });
    }
  });

  // Get validation history
  app.get("/api/validation-history", async (req, res) => {
    try {
      const validationHistory = await storage.getValidationHistory();
      res.json(validationHistory);
    } catch (error) {
      console.error("Error fetching validation history:", error);
      res.status(500).json({ message: "Failed to fetch validation history" });
    }
  });

  // Get booking by ID
  app.get("/api/bookings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Fetching booking with ID: ${id}`);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid booking ID" });
      }

      const booking = await storage.getBooking(id);
      console.log(`Booking found:`, booking);

      if (!booking) {
        console.log(`Booking with ID ${id} not found`);
        // Let's also check all bookings to see what's available
        const allBookings = await storage.getBookings();
        console.log(`Available bookings:`, allBookings.map(b => ({ id: b.id, status: b.status })));
        return res.status(404).json({ message: "Booking not found" });
      }

      // Get tour details
      const tour = await storage.getTour(booking.tourId);
      console.log(`Tour found:`, tour);

      // Return booking with tour information
      const bookingWithTour = {
        ...booking,
        tour: tour ? {
          name: tour.name,
          location: tour.location,
          duration: tour.duration,
          departureTime: tour.departureTime,
          description: tour.description,
          imageUrl: tour.imageUrl,
          includes: tour.includes,
          requirements: tour.requirements
        } : null
      };

      res.json(bookingWithTour);
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ message: "Error fetching booking", error: (error as Error).message });
    }
  });

  // Validate ticket by QR code
  app.post("/api/validate-ticket", async (req, res) => {
    try {
      const { qrCode } = req.body;

      if (!qrCode) {
        return res.status(400).json({ message: "QR code is required" });
      }

      const booking = await storage.getBookingByQR(qrCode);

      if (!booking) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Error validating ticket" });
    }
  });

  // Validate ticket by alphanumeric code
  app.post("/api/validate-ticket-code", async (req, res) => {
    try {
      const { alphanumericCode } = req.body;

      if (!alphanumericCode) {
        return res.status(400).json({ message: "Alphanumeric code is required" });
      }

      const booking = await storage.getBookingByAlphanumericCode(alphanumericCode);

      if (!booking) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      // Get tour information
      const tour = await storage.getTour(booking.tourId);

      // Return booking with tour information
      const bookingWithTour = {
        ...booking,
        tour: tour ? {
          name: tour.name,
          location: tour.location,
          duration: tour.duration,
          departureTime: tour.departureTime,
          description: tour.description,
          imageUrl: tour.imageUrl,
          includes: tour.includes,
          requirements: tour.requirements
        } : null
      };

      res.json(bookingWithTour);
    } catch (error) {
      res.status(500).json({ message: "Error validating ticket" });
    }
  });

  // Redeem ticket (only for Business and Manager roles)
  app.post("/api/redeem-ticket", async (req, res) => {
    try {
      const { bookingId, method, notes } = req.body;
      const userId = req.session?.user?.id;
      const userRole = req.session?.user?.role;

      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      if (!userRole || !canRedeemTickets(userRole)) {
        return res.status(403).json({ message: "Only Business and Manager roles can redeem tickets" });
      }

      if (!bookingId || !method) {
        return res.status(400).json({ message: "Booking ID and method are required" });
      }

      // Verify booking exists
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Check if already redeemed
      if (booking.redeemedAt) {
        return res.status(400).json({ message: "Ticket already redeemed" });
      }

      const redemption = await storage.redeemTicket(bookingId, userId, method, notes);
      res.json(redemption);
    } catch (error) {
      console.error("Ticket redemption error:", error);
      res.status(500).json({ message: "Error redeeming ticket" });
    }
  });

  // Get ticket redemption history
  app.get("/api/ticket-redemptions", async (req, res) => {
    try {
      const userId = req.session?.user?.id;
      const userRole = req.session?.user?.role;
      const businessId = req.session?.user?.businessId;

      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      let redemptions;
      if (userRole === 'master_admin') {
        redemptions = await storage.getTicketRedemptions();
      } else if (userRole === 'business' || userRole === 'manager') {
        if (!businessId) {
          return res.status(400).json({ message: "Business ID required" });
        }
        redemptions = await storage.getTicketRedemptionsByBusiness(businessId);
      } else {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(redemptions);
    } catch (error) {
      console.error("Error fetching ticket redemptions:", error);
      res.status(500).json({ message: "Error fetching ticket redemptions" });
    }
  });



  // Calculate payment distribution
  app.post("/api/calculate-distribution", async (req, res) => {
    try {
      const { amount } = req.body;
      const config = await storage.getRetentionConfig();

      if (!config || !amount) {
        return res.status(400).json({ message: "Missing amount or configuration" });
      }

      const totalAmount = parseFloat(amount);
      const appCommissionRate = parseFloat(config.appCommissionRate) / 100;
      const taxRate = parseFloat(config.taxRate) / 100;
      const bankCommissionRate = parseFloat(config.bankCommissionRate) / 100;
      const otherRetentionsRate = parseFloat(config.otherRetentionsRate) / 100;

      const appCommission = totalAmount * appCommissionRate;
      const taxAmount = totalAmount * taxRate;
      const bankCommission = totalAmount * bankCommissionRate;
      const otherRetentions = totalAmount * otherRetentionsRate;
      const sellerPayout = totalAmount - appCommission - taxAmount - bankCommission - otherRetentions;

      const distribution = {
        totalAmount,
        appCommission,
        taxAmount,
        bankCommission,
        otherRetentions,
        sellerPayout,
        breakdown: {
          appCommissionPercentage: parseFloat(config.appCommissionRate),
          taxPercentage: parseFloat(config.taxRate),
          bankCommissionPercentage: parseFloat(config.bankCommissionRate),
          otherRetentionsPercentage: parseFloat(config.otherRetentionsRate),
          sellerPayoutPercentage: ((sellerPayout / totalAmount) * 100)
        }
      };

      res.json(distribution);
    } catch (error) {
      res.status(500).json({ message: "Error calculating distribution" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
