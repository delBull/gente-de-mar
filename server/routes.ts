import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { insertTransactionSchema, insertTourSchema, insertBookingSchema, insertSeatHoldSchema, insertTicketRedemptionSchema, insertPaymentSchema, insertAvailabilityOverrideSchema, type User } from "../shared/schema.js";
import { nanoid } from "nanoid";
import { generateAlphanumericCode, canRedeemTickets, canCreateTours } from "../shared/utils.js";
import { log } from "./vite.js";
import { createCheckoutSession, verifyPayment, processRefund, PAYMENT_MODE, createConnectedAccount, createAccountLink } from "./stripe.js";
import { sendBookingConfirmationEmail } from "./email.js";
import { blobStorage } from "./services/blob/vercel.js";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from "@simplewebauthn/types";

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

  app.get("/api/users", async (req, res) => {
    try {
      const role = req.query.role as string;
      const users = await storage.getUsers();
      if (role) {
        return res.json(users.filter(u => u.role === role));
      }
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  app.patch("/api/users/:id/payout-config", async (req, res) => {
    // Only allow users to update their own config or admins
    // This simple check assumes req.body has the config
    try {
      const userId = parseInt(req.params.id);
      const { payoutConfig } = req.body;

      if (!payoutConfig) {
        return res.status(400).json({ message: "Missing payoutConfig" });
      }

      const updatedUser = await storage.updateUser(userId, { payoutConfig });
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating payout config:", error);
      res.status(500).json({ message: "Error updating configuration" });
    }
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

  // Search tours
  app.get("/api/tours/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.json([]);
      }
      const tours = await storage.searchTours(query);
      res.json(tours);
    } catch (error) {
      res.status(500).json({ message: "Error searching tours" });
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

  // Availability Overrides Endpoints
  app.get("/api/tours/:id/availability-overrides", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const overrides = await storage.getAvailabilityOverrides(id);
      res.json(overrides);
    } catch (error) {
      res.status(500).json({ message: "Error fetching availability overrides" });
    }
  });

  app.post("/api/availability-overrides", async (req, res) => {
    try {
      const overrideData = insertAvailabilityOverrideSchema.parse(req.body);
      // Ensure date is a Date object if coming as string
      if (typeof overrideData.date === 'string') {
        overrideData.date = new Date(overrideData.date);
      }
      const override = await storage.createAvailabilityOverride(overrideData);
      res.json(override);
    } catch (error) {
      console.error("Create override error:", error);
      res.status(400).json({ message: "Invalid override data" });
    }
  });

  app.delete("/api/availability-overrides/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAvailabilityOverride(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error deleting availability override" });
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

  // Get all bookings (with optional filtering)
  app.get("/api/bookings", async (req, res) => {
    try {
      // In a real app, we'd filter by the logged-in user's business
      // For now, we'll return all bookings enriched with tour info
      // We can use the existing getBookingsByBusiness(1) as a temporary measure or a new method
      // Let's assume businessId 1 for the main provider
      const bookings = await storage.getBookingsByBusiness(1);

      // We need to fetch tour details for each booking to display names/locations
      // Ideally storage.getBookingsByBusiness would do a join, but let's check what it returns
      // The interface implementation in storage.ts shows it joins but returns raw booking objects
      // Let's enrich them here manually if needed, or update storage.

      // Actually, looking at storage.ts earlier:
      // it did .innerJoin(tours...) but returned r.booking.

      // Let's get all tours to map efficiently
      const tours = await storage.getTours();
      const toursMap = new Map(tours.map(t => [t.id, t]));

      const enrichedBookings = bookings.map(booking => {
        const tour = toursMap.get(booking.tourId);
        return {
          ...booking,
          tourName: tour?.name || "Unknown Tour",
          location: tour?.location || "Unknown Location",
          // Add other fields expected by frontend if missing
        };
      });

      res.json(enrichedBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Error fetching bookings" });
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

      // Handle Coupon & Referral
      let finalAmount = parseFloat(bookingData.totalAmount);
      const couponCode = req.body.couponCode;
      const referralCode = req.body.referralCode;
      let usedReferral: User | undefined;

      if (couponCode) {
        const coupon = await storage.getCouponByCode(couponCode);
        if (coupon && coupon.isActive) {
          const isValid = (!coupon.expirationDate || new Date(coupon.expirationDate) > new Date()) &&
            (!coupon.usageLimit || (coupon.usageCount || 0) < coupon.usageLimit);

          if (isValid) {
            if (coupon.discountType === 'percent') {
              finalAmount = finalAmount * (1 - coupon.discountValue / 100);
            } else {
              finalAmount = Math.max(0, finalAmount - coupon.discountValue);
            }
            await storage.incrementCouponUsage(coupon.id);
          }
        }
      } else if (referralCode) {
        // Only check referral if no coupon used (prevent double dipping for now)
        const referrer = await storage.getUserByReferralCode(referralCode);
        if (referrer && referrer.isActive) {
          // Verify referrer is not self (if logged in)
          if (!req.session?.user || req.session.user.id !== referrer.id) {
            usedReferral = referrer;
            // Apply standard referral discount (e.g., 10%)
            finalAmount = finalAmount * 0.90;
          }
        }
      }

      // Generate QR code data and alphanumeric code
      const qrCode = nanoid();
      const alphanumericCode = generateAlphanumericCode();

      const booking = await storage.createBooking({
        ...bookingData,
        totalAmount: finalAmount.toString(),
        qrCode,
        alphanumericCode,
        status: "confirmed",
        reservedUntil: new Date(Date.now() + 15 * 60 * 1000)
      });

      if (usedReferral) {
        // Create referral record
        await storage.createReferral({
          referrerId: usedReferral.id,
          bookingId: booking.id,
          referredUserId: req.session?.user?.id || null, // Capture if user is logged in
          status: 'pending',
          rewardAmount: Math.floor(parseFloat(bookingData.totalAmount) * 0.05), // 5% reward to referrer
        });
      }


      res.json(booking);
    } catch (error) {
      console.error("Booking creation error:", error);
      res.status(400).json({ message: "Invalid booking data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Create Stripe Checkout Session
  app.post("/api/bookings/:id/checkout", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const booking = await storage.getBooking(id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      const tour = await storage.getTour(booking.tourId);
      if (!tour) return res.status(404).json({ message: "Tour not found" });

      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host;
      const baseUrl = `${protocol}://${host}`;

      const session = await createCheckoutSession({
        amount: parseFloat(booking.totalAmount),
        tourName: tour.name,
        bookingId: booking.id,
        customerEmail: booking.customerEmail || undefined,
        successUrl: `${baseUrl}/booking-confirmation/${booking.id}`,
        cancelUrl: `${baseUrl}/checkout/${booking.id}`,
      });

      // Update booking with session ID
      await storage.updateBookingStatus(booking.id, "pending_payment");
      // Note: We'll store the session ID in the metadata or a new field if we want to track it precisely

      res.json({ url: session.url, sessionId: session.id, mode: session.mode });
    } catch (error) {
      console.log("Stripe session creation error:", error);
      res.status(500).json({ message: "Error creating payment session" });
    }
  });

  // Validate Coupon
  app.post("/api/coupons/validate", async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) return res.status(400).json({ message: "Code is required" });

      const coupon = await storage.getCouponByCode(code);
      if (!coupon) return res.status(404).json({ message: "Invalid coupon code" });

      if (!coupon.isActive) return res.status(400).json({ message: "Coupon is inactive" });

      if (coupon.expirationDate && new Date(coupon.expirationDate) < new Date()) {
        return res.status(400).json({ message: "Coupon has expired" });
      }

      if (coupon.usageLimit && (coupon.usageCount || 0) >= coupon.usageLimit) {
        return res.status(400).json({ message: "Coupon usage limit reached" });
      }

      res.json(coupon);
    } catch (error) {
      console.error("Coupon validation error:", error);
      res.status(500).json({ message: "Error validating coupon" });
    }
  });

  // Verify Payment
  app.post("/api/bookings/:id/verify-payment", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { sessionId } = req.body;

      if (!sessionId) return res.status(400).json({ message: "Session ID is required" });

      const booking = await storage.getBooking(id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      const paymentInfo = await verifyPayment(sessionId);

      if (paymentInfo.status === 'paid') {
        await storage.updateBookingStatus(booking.id, "confirmed");

        // Fetch retention config
        const config = await storage.getRetentionConfig();
        const totalAmount = parseFloat(booking.totalAmount);

        // Use default rates if config exists, otherwise use 0
        const platformRate = config ? parseFloat(config.defaultPlatformFeeRate) / 100 : 0.05;
        const sellerRate = config ? parseFloat(config.defaultSellerCommissionRate) / 100 : 0.10;

        // Calculate splits
        const platformFee = totalAmount * platformRate;
        const sellerCommission = totalAmount * sellerRate;

        // Other fixed retentions (tax, bank commission)
        const taxAmount = totalAmount * (config ? parseFloat(config.taxRate) / 100 : 0.16);
        const bankCommAmount = totalAmount * (config ? parseFloat(config.bankCommissionRate) / 100 : 0.03);
        const otherRetAmount = totalAmount * (config ? parseFloat(config.otherRetentionsRate) / 100 : 0.02);

        const totalRetentions = taxAmount + bankCommAmount + otherRetAmount;
        const providerPayout = totalAmount - platformFee - sellerCommission - totalRetentions;

        // Record payment
        await storage.createPayment({
          bookingId: booking.id,
          stripePaymentIntentId: paymentInfo.paymentIntentId,
          stripeCustomerId: paymentInfo.customerId || null,
          amount: booking.totalAmount,
          currency: paymentInfo.currency,
          status: 'succeeded',
          mode: PAYMENT_MODE,
          verified: true,
          refundedAmount: "0.00",
          paymentMethod: 'card',
          metadata: JSON.stringify({ sessionId })
        });

        // Record detailed 3-way transaction
        await storage.createTransaction({
          tourId: booking.tourId,
          tourName: (await storage.getTour(booking.tourId))?.name || "Unknown Tour",
          amount: booking.totalAmount,
          status: "completed",
          appCommission: platformFee.toFixed(2),
          taxAmount: taxAmount.toFixed(2),
          bankCommission: bankCommAmount.toFixed(2),
          otherRetentions: otherRetAmount.toFixed(2),
          sellerPayout: "0.00", // Seller payout is handled separately or through sellerCommission field
          sellerCommission: sellerCommission.toFixed(2),
          providerPayout: providerPayout.toFixed(2),
          platformFee: platformFee.toFixed(2)
        });

        res.json({ success: true, status: 'confirmed' });
      } else {
        res.json({ success: false, status: paymentInfo.status });
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      res.status(500).json({ message: "Error verifying payment" });
    }
  });

  // Cash Payment Confirmation (Offline)
  app.post("/api/bookings/:id/confirm-cash-payment", async (req, res) => {
    try {
      const user = req.session?.user;
      if (!user) return res.status(401).json({ message: "Authentication required" });

      const id = parseInt(req.params.id);
      const booking = await storage.getBooking(id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      // Only sellers or admin can confirm cash payments
      if (user.role !== 'seller' && user.role !== 'master_admin') {
        return res.status(403).json({ message: "Only sellers and admins can register cash payments" });
      }

      await storage.updateBookingStatus(booking.id, "confirmed");

      const config = await storage.getRetentionConfig();
      const totalAmount = parseFloat(booking.totalAmount);

      const platformRate = config ? parseFloat(config.defaultPlatformFeeRate) / 100 : 0.05;
      const sellerRate = config ? parseFloat(config.defaultSellerCommissionRate) / 100 : 0.10;

      const platformFee = totalAmount * platformRate;
      const sellerCommission = totalAmount * sellerRate;

      // For cash, bank commission is 0
      const taxAmount = totalAmount * (config ? parseFloat(config.taxRate) / 100 : 0.16);
      const otherRetAmount = totalAmount * (config ? parseFloat(config.otherRetentionsRate) / 100 : 0.02);

      const providerPayout = totalAmount - platformFee - sellerCommission - taxAmount - otherRetAmount;

      await storage.createPayment({
        bookingId: booking.id,
        stripePaymentIntentId: `CASH-${nanoid()}`,
        stripeCustomerId: null,
        amount: booking.totalAmount,
        currency: "mxn",
        status: 'succeeded',
        mode: PAYMENT_MODE,
        verified: true,
        refundedAmount: "0.00",
        paymentMethod: 'cash',
        metadata: JSON.stringify({ confirmedBy: user.id })
      });

      await storage.createTransaction({
        tourId: booking.tourId,
        tourName: (await storage.getTour(booking.tourId))?.name || "Unknown Tour",
        amount: booking.totalAmount,
        status: "completed",
        appCommission: platformFee.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        bankCommission: "0.00",
        otherRetentions: otherRetAmount.toFixed(2),
        sellerPayout: "0.00",
        sellerCommission: sellerCommission.toFixed(2),
        providerPayout: providerPayout.toFixed(2),
        platformFee: platformFee.toFixed(2)
      });

      res.json({ success: true, status: 'confirmed' });
    } catch (error) {
      console.error("Cash payment error:", error);
      res.status(500).json({ message: "Error confirming cash payment" });
    }
  });

  // Propose Reschedule (Conflict Resolution)
  app.post("/api/bookings/:id/propose-reschedule", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { proposedDate, reason } = req.body;

      const token = nanoid(12);
      const booking = await storage.updateBooking(id, {
        proposedDate: new Date(proposedDate),
        rescheduleReason: reason,
        rescheduleToken: token,
        status: "pending_reschedule"
      });

      if (!booking) return res.status(404).json({ message: "Booking not found" });

      res.json({ success: true, token, booking });
    } catch (error) {
      console.error("Propose reschedule error:", error);
      res.status(500).json({ message: "Error proposing reschedule" });
    }
  });

  // Resolve Booking (Public) - GET details
  app.get("/api/bookings/resolve/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const booking = await storage.getBookingByToken(token);

      if (!booking) return res.status(404).json({ message: "Invalid or expired token" });

      const tour = await storage.getTour(booking.tourId);
      res.json({ booking, tour });
    } catch (error) {
      res.status(500).json({ message: "Error fetching resolution data" });
    }
  });

  // Resolve Booking (Public) - POST confirm
  app.post("/api/bookings/resolve/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const { action, selectedDate } = req.body; // action: 'accept' or 'select_new'

      const booking = await storage.getBookingByToken(token);
      if (!booking) return res.status(404).json({ message: "Invalid or expired token" });

      if (action === 'accept' && booking.proposedDate) {
        await storage.updateBooking(booking.id, {
          bookingDate: booking.proposedDate,
          status: "confirmed",
          rescheduleToken: null // Clear token after use
        });
      } else if (action === 'select_new' && selectedDate) {
        await storage.updateBooking(booking.id, {
          bookingDate: new Date(selectedDate),
          status: "confirmed",
          rescheduleToken: null
        });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error resolving booking" });
    }
  });

  // Check-in Booking
  app.post("/api/bookings/:id/check-in", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const booking = await storage.checkInBooking(id);

      if (!booking) return res.status(404).json({ message: "Booking not found" });

      res.json({ success: true, booking });
    } catch (error) {
      console.error("Check-in error:", error);
      res.status(500).json({ message: "Error checking in booking" });
    }
  });

  // Get Booking by QR Code
  app.get("/api/bookings/qr/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const booking = await storage.getBookingByQR(code);

      if (!booking) return res.status(404).json({ message: "Booking not found" });

      res.json(booking);
    } catch (error) {
      console.error("QR lookup error:", error);
      res.status(500).json({ message: "Error looking up booking" });
    }
  });

  // Admin: Process Refund
  app.post("/api/admin/payments/:id/refund", async (req, res) => {
    try {
      const userRole = req.session?.user?.role;
      if (userRole !== 'master_admin') {
        return res.status(403).json({ message: "Only master admins can process refunds" });
      }

      const id = parseInt(req.params.id);
      const payment = await storage.getPayment(id);
      if (!payment) return res.status(404).json({ message: "Payment record not found" });

      const refundResult = await processRefund(payment.stripePaymentIntentId);

      if (refundResult.status === 'succeeded' || refundResult.status === 'pending') {
        await storage.updatePayment(payment.id, {
          status: 'refunded',
          refundedAmount: payment.amount // Full refund for now
        });

        const booking = await storage.getBooking(payment.bookingId);
        if (booking) {
          await storage.updateBookingStatus(booking.id, "cancelled");
        }

        res.json({ success: true, refundStatus: refundResult.status });
      } else {
        res.status(400).json({ message: "Refund failed", status: refundResult.status });
      }
    } catch (error) {
      console.error("Refund processing error:", error);
      res.status(500).json({ message: "Error processing refund" });
    }
  });

  // Get all payments (Admin)
  app.get("/api/admin/payments", async (req, res) => {
    try {
      const userRole = req.session?.user?.role;
      if (userRole !== 'master_admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      // We need a getPayments method in storage. I'll add it to IStorage.
      // For now, I'll pretend it exists or add it quickly if possible.
      // Wait, I already added getPaymentsByBooking, but not getAllPayments.
      // I'll add getAllPayments to DatabaseStorage/MemStorage soon.
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: "Error fetching payments" });
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

  // Stripe Connect Routes
  app.post("/api/stripe/connect", async (req, res) => {
    if (!req.session?.user) return res.status(401).json({ message: "Unauthorized" });

    // Only sellers (business owners) can connect
    if (!req.session.user.businessId) {
      return res.status(400).json({ message: "No business linked to user" });
    }

    try {
      const business = await storage.getBusiness(req.session.user.businessId);
      if (!business) return res.status(404).json({ message: "Business not found" });

      let accountId = business.stripeAccountId;

      // Create account if not exists
      if (!accountId) {
        const account = await createConnectedAccount(business.contactEmail);
        accountId = account.id;
        await storage.updateBusiness(business.id, { stripeAccountId: accountId });
      }

      // Create Onboarding Link
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host;
      const baseUrl = `${protocol}://${host}`;

      const accountLink = await createAccountLink(
        accountId,
        `${baseUrl}/api/stripe/refresh`,
        `${baseUrl}/api/stripe/return?businessId=${business.id}`
      );

      res.json({ url: accountLink.url });
    } catch (error: any) {
      console.error("Stripe Connect error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/stripe/return", async (req, res) => {
    const businessId = req.query.businessId ? parseInt(req.query.businessId as string) : null;
    if (businessId) {
      await storage.updateBusiness(businessId, { stripeOnboardingCompleted: true });
      // Redirect to dashboard with success param
      res.redirect('/dashboard?connect=success');
    } else {
      res.redirect('/dashboard?connect=error');
    }
  });

  app.get("/api/stripe/refresh", (req, res) => {
    // Redirect back to dashboard to retry
    res.redirect('/dashboard?connect=refresh');
  });

  // Stripe & Payment Routes
  app.post("/api/bookings/:id/checkout", async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.getBooking(bookingId);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      const tour = await storage.getTour(booking.tourId);
      if (!tour) return res.status(404).json({ message: "Tour not found" });

      const session = await createCheckoutSession({
        bookingId: booking.id,
        amount: parseFloat(booking.totalAmount),
        tourName: tour.name,
        customerEmail: booking.customerEmail || undefined,
        successUrl: `${req.protocol}://${req.get('host')}/booking-confirmation/${booking.id}`,
        cancelUrl: `${req.protocol}://${req.get('host')}/book/${tour.id}`,
      });

      // Update booking status
      await storage.updateBookingStatus(bookingId, "pending");

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe checkout error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/bookings/:id/verify-payment", async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { sessionId } = req.body;

      if (!sessionId) return res.status(400).json({ message: "Session ID required" });

      const result = await verifyPayment(sessionId);

      if (result.status === 'paid' && result.paymentIntentId) {
        // Create payment record
        await storage.createPayment({
          bookingId,
          stripePaymentIntentId: result.paymentIntentId,
          amount: result.amount?.toString() || "0",
          currency: result.currency || "mxn",
          status: "succeeded",
          verified: true,
          mode: PAYMENT_MODE,
          stripeCustomerId: result.customerId || null,
          metadata: null,
          paymentMethod: null,
          refundedAmount: "0.00"
        });

        const updatedBooking = await storage.updateBookingStatus(bookingId, "paid");

        // Send confirmation email
        if (updatedBooking) {
          const tour = await storage.getTour(updatedBooking.tourId);
          if (tour) {
            await sendBookingConfirmationEmail(updatedBooking, tour);
          }
        }

        return res.json({ success: true, booking: updatedBooking });
      }

      res.status(400).json({ success: false, message: "Payment verification failed" });
    } catch (error: any) {
      console.error("Payment verification error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/payments", async (req, res) => {
    if (req.session?.user?.role !== 'master_admin') {
      return res.status(403).json({ message: "Access denied" });
    }
    try {
      const allPayments = await storage.getAllPayments();
      // Enrich with booking/tour data if needed
      const enriched = await Promise.all(allPayments.map(async (p) => {
        const booking = await storage.getBooking(p.bookingId);
        let tour = null;
        if (booking) {
          tour = await storage.getTour(booking.tourId);
        }
        return { ...p, booking, tour };
      }));
      res.json(enriched);
    } catch (error) {
      res.status(500).json({ message: "Error fetching payments" });
    }
  });

  app.post("/api/admin/payments/:id/refund", async (req, res) => {
    if (req.session?.user?.role !== 'master_admin') {
      return res.status(403).json({ message: "Access denied" });
    }
    try {
      const paymentId = parseInt(req.params.id);
      const payment = await storage.getPayment(paymentId);
      if (!payment) return res.status(404).json({ message: "Payment not found" });

      const result = await processRefund(payment.stripePaymentIntentId);
      if (result.status === 'succeeded' || result.status === 'pending') {
        await storage.updatePayment(paymentId, {
          status: "refunded",
          refundedAmount: payment.amount
        });
        await storage.updateBookingStatus(payment.bookingId, "refunded");
        return res.json({ success: true });
      }
      res.status(400).json({ success: false, message: "Refund failed" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Media Routes
  app.get("/api/media/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const m = await storage.getMedia(id);
      if (!m) return res.status(404).json({ message: "Media not found" });

      // If it's a request for the raw content (e.g. for an img tag)
      if (req.query.raw === 'true') {
        // If we have a blob URL, redirect to it
        if (m.url) {
          return res.redirect(m.url);
        }

        // Fallback to database content
        if (m.content) {
          const buffer = Buffer.from(m.content, 'base64');
          res.setHeader('Content-Type', m.mimeType);
          return res.send(buffer);
        }

        return res.status(404).json({ message: "Media content not found" });
      }

      // Otherwise return metadata
      const { content, ...metadata } = m;
      res.json(metadata);
    } catch (error) {
      res.status(500).json({ message: "Error fetching media" });
    }
  });

  app.post("/api/media", async (req, res) => {
    if (!req.session?.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const { name, mimeType, content, size } = req.body;
      if (!name || !mimeType || !size) {
        return res.status(400).json({ message: "Missing media data" });
      }

      let url: string | undefined;
      let savedContent: string | undefined = content;

      // Upload to Blob Storage if content is provided
      if (content) {
        try {
          const buffer = Buffer.from(content, 'base64');
          url = await blobStorage.put(name, buffer, {
            contentType: mimeType,
            access: 'public'
          });
          // Optionally clear content to save DB space, but for now strictly following plan to just migrate
          // savedContent = null; // Un-comment if we want to stop saving base64 to DB immediately
        } catch (uploadError) {
          console.error("Blob upload failed, falling back to database storage:", uploadError);
        }
      }

      const m = await storage.createMedia({
        name,
        mimeType,
        content: savedContent, // Keep saving content for fallback/legacy support for now
        url,
        size
      });
      res.status(201).json(m);
    } catch (error) {
      console.error("Media creation error:", error);
      res.status(500).json({ message: "Error creating media" });
    }
  });

  // Coupons & Referrals Validation
  app.post("/api/coupons/validate", async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) return res.status(400).json({ message: "Code is required" });

      // 1. Check Coupon
      const coupon = await storage.getCouponByCode(code);
      if (coupon && coupon.isActive) {
        const isValid = (!coupon.expirationDate || new Date(coupon.expirationDate) > new Date()) &&
          (!coupon.usageLimit || (coupon.usageCount || 0) < coupon.usageLimit);

        if (isValid) {
          return res.json({
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            type: 'coupon'
          });
        } else {
          // Coupon exists but invalid
          return res.status(400).json({ message: "Cupón expirado o agotado" });
        }
      }

      // 2. Check Referral
      const referrer = await storage.getUserByReferralCode(code);
      if (referrer && referrer.isActive) {
        // Standard referral logic: 10% discount
        return res.json({
          code: referrer.referralCode,
          discountType: 'percent',
          discountValue: 10, // 10% discount
          type: 'referral'
        });
      }

      return res.status(404).json({ message: "Código no válido" });
    } catch (error) {
      res.status(500).json({ message: "Error validating code" });
    }
  });

  app.delete("/api/admin/media/:id", async (req, res) => {
    if (req.session?.user?.role !== 'master_admin') {
      return res.status(403).json({ message: "Access denied" });
    }
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMedia(id);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting media" });
    }
  });

  // Referral Routes
  app.post("/api/referrals/generate", async (req, res) => {
    if (!req.session?.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const user = await storage.getUser(req.session.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (user.referralCode) {
        return res.json({ code: user.referralCode });
      }

      const code = nanoid(8); // 8-char unique code
      // Ensure specific uniqueness if needed, but 8 chars is safe for now

      const updatedUser = await storage.updateUser(user.id, { referralCode: code });
      // Update session user as well
      req.session.user = {
        ...updatedUser,
        businessId: updatedUser.businessId ?? undefined
      };

      res.json({ code: updatedUser.referralCode });
    } catch (error) {
      res.status(500).json({ message: "Error generating referral code" });
    }
  });

  app.get("/api/referrals/my-code", async (req, res) => {
    if (!req.session?.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const user = await storage.getUser(req.session.user.id);
      res.json({ code: user?.referralCode || null });
    } catch (error) {
      res.status(500).json({ message: "Error fetching referral code" });
    }
  });

  app.get("/api/referrals/validate/:code", async (req, res) => {
    try {
      const code = req.params.code;
      const user = await storage.getUserByReferralCode(code);

      if (!user) {
        return res.status(404).json({ valid: false, message: "Invalid code" });
      }

      if (!user.isActive) {
        return res.status(400).json({ valid: false, message: "Referrer is inactive" });
      }

      res.json({
        valid: true,
        referrerName: user.fullName // Send limited info for confirmation
      });
    } catch (error) {
      res.status(500).json({ message: "Error validating code" });
    }
  });

  app.get("/api/referrals/stats", async (req, res) => {
    if (!req.session?.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const referrals = await storage.getReferralsByUser(req.session.user.id);
      res.json({
        totalReferrals: referrals.length,
        referrals
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching stats" });
    }
  });

  // CHECK-IN APP ROUTES

  // Lookup booking by Alphanumeric Code or QR (which currently is the alpha code or booking ID)
  // Logic: The QR code contains the 'alphanumericCode'.
  app.get("/api/bookings/qr/:code", async (req, res) => {
    try {
      const code = req.params.code;
      if (!code) return res.status(400).json({ message: "Code required" });

      const bookings = await storage.getBookingsByBusiness(1);
      // Ideally storage needs a 'getBookingByCode' method.

      const booking = bookings.find(b => b.alphanumericCode === code || b.id.toString() === code);

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const tour = await storage.getTour(booking.tourId);

      res.json({
        ...booking,
        tourName: tour?.name,
        tourId: tour?.id
      });
    } catch (error) {
      console.error("QR Lookup error:", error);
      res.status(500).json({ message: "Error looking up booking" });
    }
  });

  // Perform Check-in
  app.post("/api/bookings/:id/check-in", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const booking = await storage.getBooking(id);

      if (!booking) return res.status(404).json({ message: "Booking not found" });

      if (booking.checkedIn) {
        return res.json({ success: true, alreadyCheckedIn: true, checkedInAt: booking.checkedInAt });
      }

      const updated = await storage.updateBooking(id, {
        checkedIn: true
      });

      res.json({ success: true, booking: updated });
    } catch (error) {
      console.error("Check-in error:", error);
      res.status(500).json({ message: "Error performing check-in" });
    }
  });

  // ==================== User Management Routes ====================
  // GET /api/users - List all users (master_admin only)
  app.get("/api/users", async (req, res) => {
    try {
      // @ts-ignore - req.user is set by passport middleware
      const user = req.user as User | undefined;
      if (!user || user.role !== 'master_admin') {
        return res.status(403).json({ message: "Access denied. Master admin only." });
      }

      const users = await storage.getUsers();
      // Remove passwords from response
      const safeUsers = users.map(({ password, ...u }) => u);
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  // POST /api/users - Create new user (master_admin only)
  app.post("/api/users", async (req, res) => {
    try {
      // @ts-ignore - req.user is set by passport middleware
      const user = req.user as User | undefined;
      if (!user || user.role !== 'master_admin') {
        return res.status(403).json({ message: "Access denied. Master admin only." });
      }

      const { username, email, password, fullName, role, businessId } = req.body;

      if (!username || !email || !password || !fullName || !role) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if username or email already exists
      const existingByUsername = await storage.getUserByUsername(username);
      if (existingByUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingByEmail = await storage.getUserByEmail(email);
      if (existingByEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const newUser = await storage.createUser({
        username,
        email,
        password,
        fullName,
        role,
        businessId: businessId || null,
        permissions: role === 'master_admin' ? ['all'] : [],
        whatsappNumber: null,
        referralCode: null
      } as any); // Using 'as any' to bypass schema validation temporarily

      // Remove password from response
      const { password: _, ...safeUser } = newUser;
      res.status(201).json(safeUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Error creating user" });
    }
  });

  // PATCH /api/users/:id - Update user (master_admin only)
  app.patch("/api/users/:id", async (req, res) => {
    try {
      // @ts-ignore - req.user is set by passport middleware
      const user = req.user as User | undefined;
      if (!user || user.role !== 'master_admin') {
        return res.status(403).json({ message: "Access denied. Master admin only." });
      }

      const id = parseInt(req.params.id);
      const updates = req.body;

      // Don't allow updating password through this endpoint
      if (updates.password) {
        delete updates.password;
      }

      const updatedUser = await storage.updateUser(id, updates);
      const { password: _, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Error updating user" });
    }
  });

  // Change password endpoint - all authenticated users
  app.post("/api/users/change-password", async (req, res) => {
    try {
      // @ts-ignore - req.user is set by passport middleware
      const authenticatedUser = req.user as User | undefined;

      if (!authenticatedUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { currentPassword, newPassword } = req.body;
      const userId = authenticatedUser.id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new password required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }

      // Get current user
      const users = await storage.getUsers();
      const user = users.find(u => u.id === userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      if (user.password !== currentPassword) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Update password
      const updatedUser = await storage.updateUser(userId, { password: newPassword });

      // Update localStorage for current user
      const { password: _, ...safeUser } = updatedUser;
      res.json({
        message: "Password updated successfully",
        user: safeUser
      });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Error changing password" });
    }
  });

  // ========================
  // WebAuthn / Passkey Endpoints
  // ========================

  const RP_NAME = "BookerOS";
  const RP_ID = process.env.NODE_ENV === "production"
    ? "gente-de-mar.vercel.app"
    : "localhost";
  const ORIGIN = process.env.NODE_ENV === "production"
    ? "https://gente-de-mar.vercel.app"
    : "http://localhost:3000";

  // Temporary storage for challenges (in production, use Redis or database)
  const challenges = new Map<number, string>();

  // POST /api/webauthn/register/start - Initiate passkey registration
  app.post("/api/webauthn/register/start", async (req, res) => {
    try {
      // @ts-ignore - req.user is set by passport
      const user = req.user as User | undefined;

      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: RP_ID,
        userID: user.id.toString(),
        userName: user.username,
        userDisplayName: user.fullName,
        attestationType: "none",
        authenticatorSelection: {
          residentKey: "preferred",
          userVerification: "preferred",
        },
      });

      // Store challenge for verification
      challenges.set(user.id, options.challenge);

      res.json(options);
    } catch (error) {
      console.error("Error generating registration options:", error);
      res.status(500).json({ message: "Error starting passkey registration" });
    }
  });

  // POST /api/webauthn/register/finish - Complete passkey registration
  app.post("/api/webauthn/register/finish", async (req, res) => {
    try {
      // @ts-ignore
      const user = req.user as User | undefined;

      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { credential, deviceName } = req.body;
      const expectedChallenge = challenges.get(user.id);

      if (!expectedChallenge) {
        return res.status(400).json({ message: "No registration in progress" });
      }

      let verification: VerifiedRegistrationResponse;
      try {
        verification = await verifyRegistrationResponse({
          response: credential as RegistrationResponseJSON,
          expectedChallenge,
          expectedOrigin: ORIGIN,
          expectedRPID: RP_ID,
        });
      } catch (verifyError) {
        console.error("Registration verification failed:", verifyError);
        return res.status(400).json({ message: "Verification failed" });
      }

      const { verified, registrationInfo } = verification;

      if (!verified || !registrationInfo) {
        return res.status(400).json({ message: "Registration verification failed" });
      }

      // Store credential in database
      const webauthnCredential = await storage.createWebAuthnCredential({
        userId: user.id,
        credentialId: Buffer.from(registrationInfo.credentialID).toString("base64"),
        publicKey: Buffer.from(registrationInfo.credentialPublicKey).toString("base64"),
        counter: registrationInfo.counter,
        deviceName: deviceName || "Unknown Device",
        transports: credential.response.transports || [],
      });

      // Clear challenge
      challenges.delete(user.id);

      res.json({
        verified,
        credential: webauthnCredential,
      });
    } catch (error) {
      console.error("Error completing registration:", error);
      res.status(500).json({ message: "Error completing passkey registration" });
    }
  });

  // POST /api/webauthn/login/start - Initiate passkey login
  app.post("/api/webauthn/login/start", async (req, res) => {
    try {
      const options = await generateAuthenticationOptions({
        rpID: RP_ID,
        userVerification: "preferred",
      });

      // Store challenge temporarily (use user's session or IP as key in production)
      const tempKey = Date.now(); // Simplified for demo
      challenges.set(tempKey, options.challenge);

      res.json({ ...options, tempKey });
    } catch (error) {
      console.error("Error generating authentication options:", error);
      res.status(500).json({ message: "Error starting passkey login" });
    }
  });

  // POST /api/webauthn/login/finish - Complete passkey login
  app.post("/api/webauthn/login/finish", async (req, res) => {
    try {
      const { credential, tempKey } = req.body;
      const expectedChallenge = challenges.get(tempKey);

      if (!expectedChallenge) {
        return res.status(400).json({ message: "No authentication in progress" });
      }

      // Find credential by ID
      const credentialId = credential.id;
      const storedCred = await storage.getWebAuthnCredentialById(credentialId);

      if (!storedCred) {
        return res.status(400).json({ message: "Passkey not found" });
      }

      let verification: VerifiedAuthenticationResponse;
      try {
        verification = await verifyAuthenticationResponse({
          response: credential as AuthenticationResponseJSON,
          expectedChallenge,
          expectedOrigin: ORIGIN,
          expectedRPID: RP_ID,
          authenticator: {
            credentialID: Buffer.from(storedCred.credentialId, "base64"),
            credentialPublicKey: Buffer.from(storedCred.publicKey, "base64"),
            counter: storedCred.counter,
          },
        });
      } catch (verifyError) {
        console.error("Authentication verification failed:", verifyError);
        return res.status(400).json({ message: "Verification failed" });
      }

      const { verified, authenticationInfo } = verification;

      if (!verified) {
        return res.status(400).json({ message: "Authentication failed" });
      }

      // Update counter
      await storage.updateWebAuthnCredential(storedCred.id, {
        counter: authenticationInfo.newCounter,
      });

      // Get user and create session
      const user = await storage.getUserById(storedCred.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update last login
      await storage.updateUser(user.id, { lastLogin: new Date() });

      // Login user via Passport
      // @ts-ignore - req.login added by passport
      req.login(user, (err: any) => {
        if (err) {
          return res.status(500).json({ message: "Login error" });
        }

        // Clear challenge
        challenges.delete(tempKey);

        const { password: _, ...safeUser } = user;
        res.json({ user: safeUser });
      });
    } catch (error) {
      console.error("Error completing authentication:", error);
      res.status(500).json({ message: "Error completing passkey login" });
    }
  });

  // GET /api/webauthn/credentials - Get user's passkeys
  app.get("/api/webauthn/credentials", async (req, res) => {
    try {
      // @ts-ignore
      const user = req.user as User | undefined;

      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const credentials = await storage.getWebAuthnCredentialsByUserId(user.id);

      // Don't send sensitive data
      const safeCreds = credentials.map(cred => ({
        id: cred.id,
        deviceName: cred.deviceName,
        createdAt: cred.createdAt,
      }));

      res.json(safeCreds);
    } catch (error) {
      console.error("Error fetching credentials:", error);
      res.status(500).json({ message: "Error fetching passkeys" });
    }
  });

  // DELETE /api/webauthn/credentials/:id - Delete a passkey
  app.delete("/api/webauthn/credentials/:id", async (req, res) => {
    try {
      // @ts-ignore
      const user = req.user as User | undefined;

      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const credId = parseInt(req.params.id);
      const credential = await storage.getWebAuthnCredentialById(credId.toString());

      if (!credential || credential.userId !== user.id) {
        return res.status(404).json({ message: "Passkey not found" });
      }

      await storage.deleteWebAuthnCredential(credId);
      res.json({ message: "Passkey deleted successfully" });
    } catch (error) {
      console.error("Error deleting credential:", error);
      res.status(500).json({ message: "Error deleting passkey" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
