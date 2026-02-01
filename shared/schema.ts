import { pgTable, text, serial, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("business"), // master_admin, business, manager
  businessId: integer("business_id").references(() => businesses.id),
  permissions: text("permissions").array(), // array of permission strings
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login"),
});

export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  address: text("address"),
  logo: text("logo"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tours = pgTable("tours", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("active"),
  imageUrl: text("image_url"),
  description: text("description"),
  userId: integer("user_id").references(() => users.id),
  businessId: integer("business_id").references(() => businesses.id),
  capacity: integer("capacity").notNull().default(10),
  duration: text("duration"),
  includes: text("includes").array(),
  requirements: text("requirements"),
  departureTime: text("departure_time"),
  category: text("category").notNull().default("tour"),
  gallery: text("gallery").array(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  tourId: integer("tour_id").references(() => tours.id),
  tourName: text("tour_name").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("completed"),
  createdAt: timestamp("created_at").defaultNow(),
  appCommission: decimal("app_commission", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull(),
  bankCommission: decimal("bank_commission", { precision: 10, scale: 2 }).notNull(),
  otherRetentions: decimal("other_retentions", { precision: 10, scale: 2 }).notNull(),
  sellerPayout: decimal("seller_payout", { precision: 10, scale: 2 }).notNull(),
});

export const retentionConfig = pgTable("retention_config", {
  id: serial("id").primaryKey(),
  appCommissionRate: decimal("app_commission_rate", { precision: 5, scale: 2 }).notNull().default("5.00"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).notNull().default("16.00"),
  bankCommissionRate: decimal("bank_commission_rate", { precision: 5, scale: 2 }).notNull().default("3.00"),
  otherRetentionsRate: decimal("other_retentions_rate", { precision: 5, scale: 2 }).notNull().default("2.00"),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  email: text("email"),
  phone: text("phone"),
  name: text("name").notNull(),
  walletAddress: text("wallet_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  tourId: integer("tour_id").references(() => tours.id).notNull(),
  customerId: integer("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  bookingDate: timestamp("booking_date").notNull(),
  adults: integer("adults").notNull().default(1),
  children: integer("children").notNull().default(0),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, confirmed, completed, cancelled
  specialRequests: text("special_requests"),
  healthConditions: text("health_conditions"),
  paymentMethod: text("payment_method"), // card, crypto
  transactionHash: text("transaction_hash"),
  qrCode: text("qr_code"),
  alphanumericCode: text("alphanumeric_code").unique(), // Código alfanumérico único
  redeemedAt: timestamp("redeemed_at"), // Cuándo se redimió
  redeemedBy: integer("redeemed_by").references(() => users.id), // Quién lo redimió
  createdAt: timestamp("created_at").defaultNow(),
  reservedUntil: timestamp("reserved_until"), // 15-minute hold
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeSessionId: text("stripe_session_id"),
  paymentStatus: text("payment_status").notNull().default("unpaid"), // unpaid, paid, partially_refunded, refunded
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("mxn"),
  status: text("status").notNull(), // succeeded, pending, failed, refunded, disputed
  paymentMethod: text("payment_method"),
  mode: text("mode").notNull().default("sandbox"), // sandbox, live
  verified: boolean("verified").notNull().default(false),
  refundedAmount: decimal("refunded_amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  metadata: text("metadata"), // Stringified JSON
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const seatHolds = pgTable("seat_holds", {
  id: serial("id").primaryKey(),
  tourId: integer("tour_id").references(() => tours.id).notNull(),
  bookingDate: timestamp("booking_date").notNull(),
  seatsHeld: integer("seats_held").notNull(),
  sessionId: text("session_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabla para historial de redención de tickets
export const ticketRedemptions = pgTable("ticket_redemptions", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  redeemedBy: integer("redeemed_by").references(() => users.id).notNull(),
  redemptionMethod: text("redemption_method").notNull(), // 'qr_scan', 'manual_code', 'manual_validation'
  redeemedAt: timestamp("redeemed_at").defaultNow(),
  notes: text("notes"), // Notas adicionales del proceso de redención
});

export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  mimeType: text("mime_type").notNull(),
  content: text("content").notNull(), // Base64 content
  size: integer("size").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  fullName: true,
  role: true,
  businessId: true,
  permissions: true,
}).partial({ role: true, businessId: true, permissions: true });

export const insertBusinessSchema = createInsertSchema(businesses).pick({
  name: true,
  description: true,
  contactEmail: true,
  contactPhone: true,
  address: true,
  logo: true,
}).partial({ description: true, contactPhone: true, address: true, logo: true });

export const insertTourSchema = createInsertSchema(tours).pick({
  name: true,
  location: true,
  price: true,
  status: true,
  imageUrl: true,
  description: true,
  userId: true,
}).partial({ status: true, imageUrl: true, description: true, userId: true });

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  tourId: true,
  tourName: true,
  amount: true,
  status: true,
  appCommission: true,
  taxAmount: true,
  bankCommission: true,
  otherRetentions: true,
  sellerPayout: true,
}).partial({ status: true, tourId: true });

export const insertRetentionConfigSchema = createInsertSchema(retentionConfig).pick({
  appCommissionRate: true,
  taxRate: true,
  bankCommissionRate: true,
  otherRetentionsRate: true,
});

export const insertCustomerSchema = createInsertSchema(customers).pick({
  email: true,
  phone: true,
  name: true,
  walletAddress: true,
});

export const insertBookingSchema = createInsertSchema(bookings).pick({
  tourId: true,
  customerId: true,
  customerName: true,
  customerEmail: true,
  customerPhone: true,
  bookingDate: true,
  adults: true,
  children: true,
  totalAmount: true,
  specialRequests: true,
  healthConditions: true,
  paymentMethod: true,
  transactionHash: true,
  stripePaymentIntentId: true,
  stripeSessionId: true,
  paymentStatus: true,
}).partial({
  customerId: true,
  customerEmail: true,
  customerPhone: true,
  specialRequests: true,
  healthConditions: true,
  paymentMethod: true,
  transactionHash: true,
  stripePaymentIntentId: true,
  stripeSessionId: true,
  paymentStatus: true
});

export const insertSeatHoldSchema = createInsertSchema(seatHolds).pick({
  tourId: true,
  bookingDate: true,
  seatsHeld: true,
  sessionId: true,
  expiresAt: true,
});

export const insertTicketRedemptionSchema = createInsertSchema(ticketRedemptions).pick({
  bookingId: true,
  redeemedBy: true,
  redemptionMethod: true,
  notes: true,
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  bookingId: true,
  stripePaymentIntentId: true,
  stripeCustomerId: true,
  amount: true,
  currency: true,
  status: true,
  paymentMethod: true,
  mode: true,
  verified: true,
  refundedAmount: true,
  metadata: true,
});

export const insertMediaSchema = createInsertSchema(media).pick({
  name: true,
  mimeType: true,
  content: true,
  size: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Business = typeof businesses.$inferSelect;
export type InsertTour = z.infer<typeof insertTourSchema>;
export type Tour = typeof tours.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertRetentionConfig = z.infer<typeof insertRetentionConfigSchema>;
export type RetentionConfig = typeof retentionConfig.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertSeatHold = z.infer<typeof insertSeatHoldSchema>;
export type SeatHold = typeof seatHolds.$inferSelect;
export type InsertTicketRedemption = z.infer<typeof insertTicketRedemptionSchema>;
export type TicketRedemption = typeof ticketRedemptions.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertMedia = z.infer<typeof insertMediaSchema>;
export type Media = typeof media.$inferSelect;
