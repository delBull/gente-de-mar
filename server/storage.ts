import {
  users, businesses, tours, transactions, retentionConfig, customers, bookings, seatHolds, ticketRedemptions,
  type User, type InsertUser, type Business, type InsertBusiness, type Tour, type InsertTour, type Transaction, type InsertTransaction,
  type RetentionConfig, type InsertRetentionConfig, type Customer, type InsertCustomer,
  type Booking, type InsertBooking, type SeatHold, type InsertSeatHold, type TicketRedemption, type InsertTicketRedemption
} from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "./db";
import { generateAlphanumericCode } from "@shared/utils";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  authenticateUser(username: string, password: string): Promise<User | null>;

  // Tours
  getTour(id: number): Promise<Tour | undefined>;
  getTours(): Promise<Tour[]>;
  getToursByUser(userId: number): Promise<Tour[]>;
  getToursByBusiness(businessId: number): Promise<Tour[]>;
  createTour(tour: InsertTour): Promise<Tour>;
  updateTour(id: number, tour: Partial<Tour>): Promise<Tour | undefined>;

  // Transactions
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactions(): Promise<Transaction[]>;
  getTransactionsByBusiness(businessId: number): Promise<Transaction[]>;
  getRecentTransactions(limit?: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;

  // Retention Config
  getRetentionConfig(): Promise<RetentionConfig | undefined>;
  updateRetentionConfig(config: InsertRetentionConfig): Promise<RetentionConfig>;

  // Bookings
  getBooking(id: number): Promise<Booking | undefined>;
  getBookings(): Promise<Booking[]>;
  getBookingsByBusiness(businessId: number): Promise<Booking[]>;
  getBookingByQR(qrCode: string): Promise<Booking | undefined>;
  getBookingByAlphanumericCode(code: string): Promise<Booking | undefined>;
  updateBookingStatus(id: number, status: string): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking & { qrCode: string; alphanumericCode: string; status: string; reservedUntil: Date }): Promise<Booking>;
  redeemTicket(bookingId: number, redeemedBy: number, method: string, notes?: string): Promise<TicketRedemption>;

  // Ticket Redemptions
  getTicketRedemptions(): Promise<TicketRedemption[]>;
  getTicketRedemptionsByBusiness(businessId: number): Promise<TicketRedemption[]>;
  getRedemptionHistory(bookingId: number): Promise<TicketRedemption[]>;
  getValidationHistory(): Promise<(TicketRedemption & { booking: Booking; tour: Tour })[]>;

  // Seat Holds
  createSeatHold(seatHold: InsertSeatHold & { expiresAt: Date }): Promise<SeatHold>;
  cleanupExpiredSeatHolds(): Promise<void>;

  // Dashboard calculations
  getFinancialSummary(): Promise<{
    totalRevenue: number;
    totalAppCommission: number;
    totalRetentions: number;
    totalSellerPayout: number;
  }>;

  getFinancialSummaryByBusiness(businessId: number): Promise<{
    totalRevenue: number;
    totalAppCommission: number;
    totalRetentions: number;
    totalSellerPayout: number;
  }>;

  // Initialize data
  initializeDatabase(): Promise<void>;

  // Missing methods
  getRedemptionHistory(bookingId: number): Promise<TicketRedemption[]>;
  getValidationHistory(): Promise<(TicketRedemption & { booking: Booking; tour: Tour })[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tours: Map<number, Tour>;
  private transactions: Map<number, Transaction>;
  private bookings: Map<number, Booking>;
  private seatHolds: Map<number, SeatHold>;
  private ticketRedemptions: Map<number, TicketRedemption>;
  private retentionConfigData: RetentionConfig;
  private currentUserId: number;
  private currentTourId: number;
  private currentTransactionId: number;
  private currentBookingId: number;
  private currentSeatHoldId: number;

  constructor() {
    this.users = new Map();
    this.tours = new Map();
    this.transactions = new Map();
    this.bookings = new Map();
    this.seatHolds = new Map();
    this.ticketRedemptions = new Map();
    this.currentUserId = 1;
    this.currentTourId = 1;
    this.currentTransactionId = 1;
    this.currentBookingId = 1;
    this.currentSeatHoldId = 1;

    // Initialize default retention config
    this.retentionConfigData = {
      id: 1,
      appCommissionRate: "5.00",
      taxRate: "16.00",
      bankCommissionRate: "3.00",
      otherRetentionsRate: "2.00",
    };

    this.initializeData();
  }

  private initializeData() {
    // Create default users with different roles
    const masterAdmin: User = {
      id: 1,
      username: "admin",
      password: "admin123",
      email: "admin@gentedemar.com",
      fullName: "Administrador Master",
      role: "master_admin",
      isActive: true,
      createdAt: new Date(),
      businessId: null,
      permissions: null,
      lastLogin: null
    };

    const businessUser: User = {
      id: 2,
      username: "dario",
      password: "password",
      email: "dario@gentedemar.com",
      fullName: "Darío",
      role: "business",
      isActive: true,
      createdAt: new Date(),
      businessId: 1,
      permissions: null,
      lastLogin: null
    };

    const managerUser: User = {
      id: 3,
      username: "manager",
      password: "manager123",
      email: "manager@gentedemar.com",
      fullName: "Manager de Tours",
      role: "manager",
      isActive: true,
      createdAt: new Date(),
      businessId: 1,
      permissions: ["tours", "reservations"],
      lastLogin: null
    };

    this.users.set(1, masterAdmin);
    this.users.set(2, businessUser);
    this.users.set(3, managerUser);
    this.currentUserId = 4;

    // Create sample tours with realistic Puerto Vallarta prices
    const sampleTours: Tour[] = [
      {
        id: 1,
        name: "Tour Islas Marietas - Playa del Amor",
        location: "Bahía de Banderas",
        price: "2450.00",
        status: "active",
        imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=150",
        description: "Descubre la famosa Playa del Amor en las Islas Marietas, Patrimonio de la Humanidad por la UNESCO. Incluye snorkel en aguas cristalinas y avistamiento de fauna marina.",
        userId: 2,
        businessId: 1,
        capacity: 12,
        duration: "8 horas",
        departureTime: "8:00 AM",
        includes: ["Transporte desde hotel", "Equipo de snorkel", "Almuerzo gourmet", "Bebidas ilimitadas", "Guía certificado", "Chaleco salvavidas", "Seguro de viaje"],
        requirements: "Saber nadar básico. Edad mínima 8 años. Reservación obligatoria con anticipación por ser área protegida.",
        category: "aventura",
        gallery: []
      },
      {
        id: 2,
        name: "Pesca Deportiva en Alta Mar",
        location: "Puerto Vallarta",
        price: "4800.00",
        status: "active",
        imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=150",
        description: "Experiencia de pesca deportiva profesional en busca de marlin, dorado y atún. Embarcación de lujo con capitán experimentado y equipo profesional.",
        userId: 2,
        businessId: 1,
        capacity: 6,
        duration: "8 horas",
        departureTime: "6:00 AM",
        includes: ["Embarcación de lujo", "Capitán y marinero expertos", "Equipo de pesca profesional", "Carnadas y señuelos", "Almuerzo y bebidas", "Hielo para el pescado", "Limpieza del pescado"],
        requirements: "Todas las edades. No se requiere experiencia previa. Recomendable tomar medicamento para mareo.",
        category: "pesca",
        gallery: []
      },
      {
        id: 3,
        name: "Catamaran Sunset con Cena",
        location: "Bahía de Banderas",
        price: "1890.00",
        status: "active",
        imageUrl: "https://images.unsplash.com/photo-1569950851668-6b7541dce11d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=150",
        description: "Navega en un elegante catamarán mientras disfrutas del atardecer más espectacular de Puerto Vallarta. Incluye cena gourmet y bar libre premium.",
        userId: 2,
        businessId: 1,
        capacity: 25,
        duration: "4 horas",
        departureTime: "5:00 PM",
        includes: ["Catamarán de lujo", "Cena gourmet de 3 tiempos", "Bar libre premium", "Música en vivo", "Photographer profesional", "Toallas", "Área de descanso VIP"],
        requirements: "Todas las edades. Vestimenta elegante-casual recomendada.",
        category: "romance",
        gallery: []
      },
      {
        id: 4,
        name: "ATV Adventure + Canopy",
        location: "Sierra Madre",
        price: "2100.00",
        status: "active",
        imageUrl: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=150",
        description: "Aventura extrema combinando manejo de ATVs por senderos de montaña y tirolesas en el corazón de la Sierra Madre. Adrenalina pura con vistas espectaculares.",
        userId: 2,
        businessId: 1,
        capacity: 16,
        duration: "6 horas",
        departureTime: "9:00 AM",
        includes: ["Transporte de ida y vuelta", "ATV individual o doble", "Equipo de seguridad completo", "Guías especializados", "Almuerzo típico mexicano", "Bebidas refrescantes", "Seguro de accidentes"],
        requirements: "Edad mínima 16 años para manejar. Menores acompañados por adulto. Ropa cómoda y tenis cerrados obligatorios.",
        category: "aventura",
        gallery: []
      },
      {
        id: 5,
        name: "Whale Watching Premium",
        location: "Bahía de Banderas",
        price: "2250.00",
        status: "active",
        imageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=150",
        description: "Observación de ballenas jorobadas en su hábitat natural. Temporada diciembre-marzo. Embarcación especializada con hidrófonos para escuchar el canto de las ballenas.",
        userId: 2,
        businessId: 1,
        capacity: 20,
        duration: "4 horas",
        departureTime: "10:00 AM",
        includes: ["Embarcación especializada", "Biólogo marino especialista", "Hidrófonos para escuchar ballenas", "Snacks y bebidas", "Equipo de fotografía submarina", "Certificado de avistamiento", "Guía naturalista"],
        requirements: "Temporada disponible dic-mar. Todas las edades. Medicamento para mareo recomendado.",
        category: "naturaleza",
        gallery: []
      },
      {
        id: 6,
        name: "Tequila Express Tour",
        location: "Tequila, Jalisco",
        price: "3200.00",
        status: "active",
        imageUrl: "https://images.unsplash.com/photo-1566139388792-a6cd83b2f271?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=150",
        description: "Viaje en tren de lujo hasta el pueblo mágico de Tequila. Incluye visita a destilería José Cuervo, degustación de tequilas premium y show de mariachis.",
        userId: 2,
        businessId: 1,
        capacity: 40,
        duration: "12 horas",
        departureTime: "7:00 AM",
        includes: ["Tren José Cuervo Express", "Desayuno continental", "Tour destilería premium", "Degustación de tequilas", "Almuerzo típico mexicano", "Show de mariachis", "Tiempo libre en el pueblo", "Cena ligera"],
        requirements: "Mayores de 18 años para degustación de alcohol. Documento de identidad obligatorio.",
        category: "cultural",
        gallery: []
      }
    ];

    sampleTours.forEach(tour => this.tours.set(tour.id, tour));
    this.currentTourId = 7;

    // Create sample transactions
    const sampleTransactions: Transaction[] = [
      {
        id: 1,
        tourId: 1,
        tourName: "Tour Bahía de Banderas",
        amount: "1200.00",
        status: "completed",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        appCommission: "60.00",
        taxAmount: "192.00",
        bankCommission: "36.00",
        otherRetentions: "24.00",
        sellerPayout: "888.00"
      },
      {
        id: 2,
        tourId: 2,
        tourName: "Snorkel en Los Arcos",
        amount: "850.00",
        status: "completed",
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        appCommission: "42.50",
        taxAmount: "136.00",
        bankCommission: "25.50",
        otherRetentions: "17.00",
        sellerPayout: "629.00"
      },
      {
        id: 3,
        tourId: 1,
        tourName: "Catamarán Sunset",
        amount: "2400.00",
        status: "completed",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        appCommission: "120.00",
        taxAmount: "384.00",
        bankCommission: "72.00",
        otherRetentions: "48.00",
        sellerPayout: "1776.00"
      }
    ];

    sampleTransactions.forEach(transaction => this.transactions.set(transaction.id, transaction));
    this.currentTransactionId = 4;
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async authenticateUser(username: string, password: string): Promise<User | null> {
    const user = Array.from(this.users.values()).find(
      user => user.username === username && user.password === password && user.isActive
    );
    return user || null;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      role: insertUser.role || "business",
      isActive: true,
      createdAt: new Date(),
      lastLogin: null,
      businessId: insertUser.businessId || null,
      permissions: insertUser.permissions || null
    };
    this.users.set(id, user);
    return user;
  }

  // Tours
  async getTour(id: number): Promise<Tour | undefined> {
    return this.tours.get(id);
  }

  async getTours(): Promise<Tour[]> {
    return Array.from(this.tours.values());
  }

  async getToursByUser(userId: number): Promise<Tour[]> {
    return Array.from(this.tours.values()).filter(tour => tour.userId === userId);
  }

  async getToursByBusiness(businessId: number): Promise<Tour[]> {
    return Array.from(this.tours.values()).filter(tour => tour.businessId === businessId);
  }

  async createTour(insertTour: InsertTour): Promise<Tour> {
    const id = this.currentTourId++;
    const tour: Tour = {
      ...insertTour,
      id,
      status: insertTour.status || "active",
      imageUrl: insertTour.imageUrl || null,
      description: insertTour.description || null,
      userId: insertTour.userId || null,
      capacity: 10,
      duration: null,
      includes: [],
      requirements: null,
      departureTime: null,
      category: "tour",
      gallery: [],
      businessId: null
    };
    this.tours.set(id, tour);
    return tour;
  }

  async updateTour(id: number, tourUpdate: Partial<Tour>): Promise<Tour | undefined> {
    const tour = this.tours.get(id);
    if (!tour) return undefined;

    const updatedTour = { ...tour, ...tourUpdate };
    this.tours.set(id, updatedTour);
    return updatedTour;
  }

  // Transactions
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionsByBusiness(businessId: number): Promise<Transaction[]> {
    return this.getTransactions();
  }

  async getTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).sort((a, b) =>
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
    const transactions = await this.getTransactions();
    return transactions.slice(0, limit);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      status: insertTransaction.status || "completed",
      tourId: insertTransaction.tourId || null,
      createdAt: new Date()
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  // Retention Config
  async getRetentionConfig(): Promise<RetentionConfig | undefined> {
    return this.retentionConfigData;
  }

  async updateRetentionConfig(config: InsertRetentionConfig): Promise<RetentionConfig> {
    this.retentionConfigData = { ...this.retentionConfigData, ...config };
    return this.retentionConfigData;
  }

  // Dashboard calculations
  async getFinancialSummary(): Promise<{
    totalRevenue: number;
    totalAppCommission: number;
    totalRetentions: number;
    totalSellerPayout: number;
  }> {
    const transactions = Array.from(this.transactions.values());

    const totalRevenue = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalAppCommission = transactions.reduce((sum, t) => sum + parseFloat(t.appCommission), 0);
    const totalTaxAmount = transactions.reduce((sum, t) => sum + parseFloat(t.taxAmount), 0);
    const totalBankCommission = transactions.reduce((sum, t) => sum + parseFloat(t.bankCommission), 0);
    const totalOtherRetentions = transactions.reduce((sum, t) => sum + parseFloat(t.otherRetentions), 0);
    const totalSellerPayout = transactions.reduce((sum, t) => sum + parseFloat(t.sellerPayout), 0);

    const totalRetentions = totalTaxAmount + totalBankCommission + totalOtherRetentions;

    return {
      totalRevenue,
      totalAppCommission,
      totalRetentions,
      totalSellerPayout
    };
  }

  // Booking methods
  async getBooking(id: number): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }

  async getBookingsByBusiness(businessId: number): Promise<Booking[]> {
    return this.getBookings();
  }

  async getBookingByQR(qrCode: string): Promise<Booking | undefined> {
    const bookings = Array.from(this.bookings.values());
    return bookings.find(b => b.qrCode === qrCode);
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (booking) {
      const updatedBooking = { ...booking, status };
      return updatedBooking;
    }
    return undefined;
  }

  async getBookingByAlphanumericCode(code: string): Promise<Booking | undefined> {
    const bookings = Array.from(this.bookings.values());
    return bookings.find(b => b.alphanumericCode === code);
  }

  async redeemTicket(bookingId: number, redeemedBy: number, method: string, notes?: string): Promise<TicketRedemption> {
    throw new Error("Method not implemented.");
  }

  async createBooking(bookingData: InsertBooking & { qrCode: string; alphanumericCode: string; status: string; reservedUntil: Date }): Promise<Booking> {
    const tour = this.tours.get(bookingData.tourId);
    const booking: Booking = {
      id: this.currentBookingId++,
      tourId: bookingData.tourId,
      customerId: bookingData.customerId || null,
      bookingDate: bookingData.bookingDate,
      adults: bookingData.adults || 1,
      children: bookingData.children || 0,
      customerName: bookingData.customerName,
      customerEmail: bookingData.customerEmail || null,
      customerPhone: bookingData.customerPhone || null,
      specialRequests: bookingData.specialRequests || null,
      totalAmount: bookingData.totalAmount,
      qrCode: bookingData.qrCode,
      status: bookingData.status,
      reservedUntil: bookingData.reservedUntil,
      createdAt: new Date(),
      transactionHash: bookingData.transactionHash || null,
      redeemedAt: null,
      redeemedBy: null,
      healthConditions: bookingData.healthConditions || null,
      paymentMethod: bookingData.paymentMethod || null,
      alphanumericCode: bookingData.alphanumericCode || null
    };
    this.bookings.set(booking.id, booking);
    return booking;
  }

  async getTicketRedemptions(): Promise<TicketRedemption[]> {
    return Array.from(this.ticketRedemptions.values());
  }

  async getTicketRedemptionsByBusiness(businessId: number): Promise<TicketRedemption[]> {
    const bookings = Array.from(this.bookings.values()).filter(b => {
      const tour = this.tours.get(b.tourId);
      return tour?.businessId === businessId;
    });
    const bookingIds = new Set(bookings.map(b => b.id));
    return Array.from(this.ticketRedemptions.values()).filter((tr: TicketRedemption) => bookingIds.has(tr.bookingId));
  }

  async initializeDatabase(): Promise<void> {
    // No-op for MemStorage
  }

  async getFinancialSummaryByBusiness(businessId: number): Promise<{
    totalRevenue: number;
    totalAppCommission: number;
    totalRetentions: number;
    totalSellerPayout: number;
  }> {
    return {
      totalRevenue: 0,
      totalAppCommission: 0,
      totalRetentions: 0,
      totalSellerPayout: 0
    };
  }

  async createSeatHold(seatHoldData: InsertSeatHold & { expiresAt: Date }): Promise<SeatHold> {
    const seatHold: SeatHold = {
      id: this.currentSeatHoldId++,
      tourId: seatHoldData.tourId,
      bookingDate: seatHoldData.bookingDate,
      seatsHeld: seatHoldData.seatsHeld,
      sessionId: seatHoldData.sessionId,
      expiresAt: seatHoldData.expiresAt,
      createdAt: new Date()
    };
    this.seatHolds.set(seatHold.id, seatHold);
    return seatHold;
  }

  async cleanupExpiredSeatHolds(): Promise<void> {
    const now = new Date();
    for (const [id, seatHold] of this.seatHolds.entries()) {
      if (seatHold.expiresAt < now) {
        this.seatHolds.delete(id);
      }
    }
  }

  async getRedemptionHistory(bookingId: number): Promise<TicketRedemption[]> {
    return [];
  }

  async getValidationHistory(): Promise<(TicketRedemption & { booking: Booking; tour: Tour })[]> {
    return [];
  }
}

// DatabaseStorage implementation
export class DatabaseStorage implements IStorage {
  async initializeDatabase(): Promise<void> {
    try {
      // Create default business first
      const [defaultBusiness] = await db.insert(businesses).values({
        name: "Gente de Mar Tours",
        description: "Empresa principal de tours marítimos",
        contactEmail: "info@gentedemar.com",
        contactPhone: "+52 322 123 4567",
        address: "Puerto Vallarta, Jalisco"
      }).onConflictDoNothing().returning();

      const businessId = defaultBusiness?.id || 1;

      // Create the exact users you specified
      const usersToCreate = [
        {
          username: "Dario",
          password: "gentedemar",
          email: "dario@gentedemar.com",
          fullName: "Dario - Master Admin",
          role: "master_admin" as const,
          businessId: null,
          permissions: ["all"]
        },
        {
          username: "Business",
          password: "tour2025",
          email: "business@gentedemar.com",
          fullName: "Business User",
          role: "business" as const,
          businessId: businessId,
          permissions: ["business_admin", "view_business_metrics", "manage_tours", "view_payments"]
        },
        {
          username: "Manager",
          password: "admin",
          email: "manager@gentedemar.com",
          fullName: "Manager User",
          role: "manager" as const,
          businessId: businessId,
          permissions: ["manage_tours", "view_bookings", "view_reports"]
        }
      ];

      for (const userData of usersToCreate) {
        await db.insert(users).values(userData).onConflictDoNothing();
      }

      // Create default retention config
      await db.insert(retentionConfig).values({
        appCommissionRate: "5.00",
        taxRate: "16.00",
        bankCommissionRate: "3.00",
        otherRetentionsRate: "2.00"
      }).onConflictDoNothing();

      console.log("Database initialized with default users and configuration");
    } catch (error) {
      console.error("Error initializing database:", error);
    }
  }

  async authenticateUser(username: string, password: string): Promise<User | null> {
    try {
      const [user] = await db.select().from(users).where(
        and(eq(users.username, username), eq(users.password, password), eq(users.isActive, true))
      );

      if (user) {
        // Update last login
        await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, user.id));
        return user;
      }
      return null;
    } catch (error) {
      console.error("Error authenticating user:", error);
      return null;
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error("Error getting user by username:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getTour(id: number): Promise<Tour | undefined> {
    try {
      const [tour] = await db.select().from(tours).where(eq(tours.id, id));
      return tour;
    } catch (error) {
      console.error("Error getting tour:", error);
      return undefined;
    }
  }

  async getTours(): Promise<Tour[]> {
    try {
      return await db.select().from(tours);
    } catch (error) {
      console.error("Error getting tours:", error);
      return [];
    }
  }

  async getToursByUser(userId: number): Promise<Tour[]> {
    try {
      return await db.select().from(tours).where(eq(tours.userId, userId));
    } catch (error) {
      console.error("Error getting tours by user:", error);
      return [];
    }
  }

  async getToursByBusiness(businessId: number): Promise<Tour[]> {
    try {
      return await db.select().from(tours).where(eq(tours.businessId, businessId));
    } catch (error) {
      console.error("Error getting tours by business:", error);
      return [];
    }
  }

  async createTour(insertTour: InsertTour): Promise<Tour> {
    const [tour] = await db.insert(tours).values(insertTour).returning();
    return tour;
  }

  async updateTour(id: number, tourUpdate: Partial<Tour>): Promise<Tour | undefined> {
    try {
      const [tour] = await db.update(tours).set(tourUpdate).where(eq(tours.id, id)).returning();
      return tour;
    } catch (error) {
      console.error("Error updating tour:", error);
      return undefined;
    }
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    try {
      const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
      return transaction;
    } catch (error) {
      console.error("Error getting transaction:", error);
      return undefined;
    }
  }

  async getTransactions(): Promise<Transaction[]> {
    try {
      return await db.select().from(transactions).orderBy(desc(transactions.createdAt));
    } catch (error) {
      console.error("Error getting transactions:", error);
      return [];
    }
  }

  async getTransactionsByBusiness(businessId: number): Promise<Transaction[]> {
    try {
      const rows = await db.select()
        .from(transactions)
        .innerJoin(tours, eq(transactions.tourId, tours.id))
        .where(eq(tours.businessId, businessId))
        .orderBy(desc(transactions.createdAt));

      return rows.map(r => r.transactions);
    } catch (error) {
      console.error("Error getting transactions by business:", error);
      return [];
    }
  }

  async getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
    try {
      return await db.select().from(transactions)
        .orderBy(desc(transactions.createdAt))
        .limit(limit);
    } catch (error) {
      console.error("Error getting recent transactions:", error);
      return [];
    }
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(insertTransaction).returning();
    return transaction;
  }

  async getRetentionConfig(): Promise<RetentionConfig | undefined> {
    try {
      const [config] = await db.select().from(retentionConfig).limit(1);
      return config;
    } catch (error) {
      console.error("Error getting retention config:", error);
      return undefined;
    }
  }

  async updateRetentionConfig(config: InsertRetentionConfig): Promise<RetentionConfig> {
    const [updated] = await db.update(retentionConfig).set(config).returning();
    return updated;
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    try {
      const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
      return booking;
    } catch (error) {
      console.error("Error getting booking:", error);
      return undefined;
    }
  }

  async getBookings(): Promise<Booking[]> {
    try {
      return await db.select().from(bookings).orderBy(desc(bookings.createdAt));
    } catch (error) {
      console.error("Error getting bookings:", error);
      return [];
    }
  }

  async getBookingsByBusiness(businessId: number): Promise<Booking[]> {
    try {
      const rows = await db.select()
        .from(bookings)
        .innerJoin(tours, eq(bookings.tourId, tours.id))
        .where(eq(tours.businessId, businessId))
        .orderBy(desc(bookings.createdAt));

      return rows.map(r => r.bookings);
    } catch (error) {
      console.error("Error getting bookings by business:", error);
      return [];
    }
  }

  async getBookingByQR(qrCode: string): Promise<Booking | undefined> {
    try {
      const [booking] = await db.select().from(bookings).where(eq(bookings.qrCode, qrCode));
      return booking;
    } catch (error) {
      console.error("Error getting booking by QR:", error);
      return undefined;
    }
  }

  async getBookingByAlphanumericCode(code: string): Promise<Booking | undefined> {
    try {
      const [booking] = await db.select().from(bookings).where(eq(bookings.alphanumericCode, code));
      return booking;
    } catch (error) {
      console.error("Error getting booking by alphanumeric code:", error);
      return undefined;
    }
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking | undefined> {
    try {
      const [booking] = await db.update(bookings).set({ status }).where(eq(bookings.id, id)).returning();
      return booking;
    } catch (error) {
      console.error("Error updating booking status:", error);
      return undefined;
    }
  }

  async createBooking(bookingData: InsertBooking & { qrCode: string; alphanumericCode: string; status: string; reservedUntil: Date }): Promise<Booking> {
    const [booking] = await db.insert(bookings).values(bookingData).returning();
    return booking;
  }

  async redeemTicket(bookingId: number, redeemedBy: number, method: string, notes?: string): Promise<TicketRedemption> {
    try {
      // Primero actualizamos el booking como redimido
      await db.update(bookings).set({
        redeemedAt: new Date(),
        redeemedBy: redeemedBy,
        status: 'completed'
      }).where(eq(bookings.id, bookingId));

      // Luego creamos el registro de redención
      const [redemption] = await db.insert(ticketRedemptions).values({
        bookingId,
        redeemedBy,
        redemptionMethod: method,
        notes: notes || null
      }).returning();

      return redemption;
    } catch (error) {
      console.error("Error redeeming ticket:", error);
      throw error;
    }
  }

  async getTicketRedemptions(): Promise<TicketRedemption[]> {
    try {
      return await db.select().from(ticketRedemptions).orderBy(desc(ticketRedemptions.redeemedAt));
    } catch (error) {
      console.error("Error getting ticket redemptions:", error);
      return [];
    }
  }

  async getTicketRedemptionsByBusiness(businessId: number): Promise<TicketRedemption[]> {
    try {
      const rows = await db.select()
        .from(ticketRedemptions)
        .innerJoin(bookings, eq(ticketRedemptions.bookingId, bookings.id))
        .innerJoin(tours, eq(bookings.tourId, tours.id))
        .where(eq(tours.businessId, businessId))
        .orderBy(desc(ticketRedemptions.redeemedAt));

      return rows.map(r => r.ticket_redemptions);
    } catch (error) {
      console.error("Error getting ticket redemptions by business:", error);
      return [];
    }
  }

  async getRedemptionHistory(bookingId: number): Promise<TicketRedemption[]> {
    try {
      return await db.select()
        .from(ticketRedemptions)
        .where(eq(ticketRedemptions.bookingId, bookingId))
        .orderBy(desc(ticketRedemptions.redeemedAt));
    } catch (error) {
      console.error("Error getting redemption history:", error);
      return [];
    }
  }

  async getValidationHistory(): Promise<(TicketRedemption & { booking: Booking; tour: Tour })[]> {
    try {
      const results = await db.select({
        id: ticketRedemptions.id,
        bookingId: ticketRedemptions.bookingId,
        redeemedBy: ticketRedemptions.redeemedBy,
        redeemedAt: ticketRedemptions.redeemedAt,
        redemptionMethod: ticketRedemptions.redemptionMethod,
        notes: ticketRedemptions.notes,
        booking: {
          id: bookings.id,
          tourId: bookings.tourId,
          customerId: bookings.customerId,
          customerName: bookings.customerName,
          customerEmail: bookings.customerEmail,
          customerPhone: bookings.customerPhone,
          bookingDate: bookings.bookingDate,
          adults: bookings.adults,
          children: bookings.children,
          totalAmount: bookings.totalAmount,
          status: bookings.status,
          qrCode: bookings.qrCode,
          alphanumericCode: bookings.alphanumericCode,
          redeemedAt: bookings.redeemedAt,
          redeemedBy: bookings.redeemedBy,
          createdAt: bookings.createdAt,
          reservedUntil: bookings.reservedUntil,
          specialRequests: bookings.specialRequests,
          healthConditions: bookings.healthConditions,
          paymentMethod: bookings.paymentMethod,
          transactionHash: bookings.transactionHash
        },
        tour: {
          id: tours.id,
          name: tours.name,
          location: tours.location,
          price: tours.price,
          status: tours.status,
          imageUrl: tours.imageUrl,
          description: tours.description,
          businessId: tours.businessId,
          userId: tours.userId,
          capacity: tours.capacity,
          duration: tours.duration,
          includes: tours.includes,
          requirements: tours.requirements,
          departureTime: tours.departureTime,
          category: tours.category,
          gallery: tours.gallery
        }
      })
        .from(ticketRedemptions)
        .innerJoin(bookings, eq(ticketRedemptions.bookingId, bookings.id))
        .innerJoin(tours, eq(bookings.tourId, tours.id))
        .orderBy(desc(ticketRedemptions.redeemedAt));

      return results.map(result => ({
        ...result,
        booking: result.booking as Booking,
        tour: result.tour as Tour
      }));
    } catch (error) {
      console.error("Error getting validation history:", error);
      return [];
    }
  }

  async createSeatHold(seatHoldData: InsertSeatHold & { expiresAt: Date }): Promise<SeatHold> {
    const [seatHold] = await db.insert(seatHolds).values(seatHoldData).returning();
    return seatHold;
  }

  async cleanupExpiredSeatHolds(): Promise<void> {
    try {
      await db.delete(seatHolds).where(sql`expires_at < NOW()`);
    } catch (error) {
      console.error("Error cleaning up expired seat holds:", error);
    }
  }

  async getFinancialSummary(): Promise<{
    totalRevenue: number;
    totalAppCommission: number;
    totalRetentions: number;
    totalSellerPayout: number;
  }> {
    try {
      const result = await db.select({
        totalRevenue: sql<number>`COALESCE(SUM(amount), 0)`,
        totalAppCommission: sql<number>`COALESCE(SUM(app_commission), 0)`,
        totalRetentions: sql<number>`COALESCE(SUM(tax_amount + bank_commission + other_retentions), 0)`,
        totalSellerPayout: sql<number>`COALESCE(SUM(seller_payout), 0)`
      }).from(transactions);

      return result[0] || { totalRevenue: 0, totalAppCommission: 0, totalRetentions: 0, totalSellerPayout: 0 };
    } catch (error) {
      console.error("Error getting financial summary:", error);
      return { totalRevenue: 0, totalAppCommission: 0, totalRetentions: 0, totalSellerPayout: 0 };
    }
  }

  async getFinancialSummaryByBusiness(businessId: number): Promise<{
    totalRevenue: number;
    totalAppCommission: number;
    totalRetentions: number;
    totalSellerPayout: number;
  }> {
    try {
      const result = await db.select({
        totalRevenue: sql<number>`COALESCE(SUM(transactions.amount), 0)`,
        totalAppCommission: sql<number>`COALESCE(SUM(transactions.app_commission), 0)`,
        totalRetentions: sql<number>`COALESCE(SUM(transactions.tax_amount + transactions.bank_commission + transactions.other_retentions), 0)`,
        totalSellerPayout: sql<number>`COALESCE(SUM(transactions.seller_payout), 0)`
      })
        .from(transactions)
        .innerJoin(tours, eq(transactions.tourId, tours.id))
        .where(eq(tours.businessId, businessId));

      return result[0] || { totalRevenue: 0, totalAppCommission: 0, totalRetentions: 0, totalSellerPayout: 0 };
    } catch (error) {
      console.error("Error getting financial summary by business:", error);
      return { totalRevenue: 0, totalAppCommission: 0, totalRetentions: 0, totalSellerPayout: 0 };
    }
  }
}

export const storage = new DatabaseStorage();
