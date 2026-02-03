import { pgTable, text, serial, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("seller"), // master_admin, seller, provider
  businessId: integer("business_id").references(() => businesses.id),
  permissions: text("permissions").array(), // array of permission strings
  isActive: boolean("is_active").notNull().default(true),
  payoutConfig: text("payout_config"), // JSON string with bank details (CLABE, Bank name, etc.)
  whatsappNumber: text("whatsapp_number"), // For frictionless communication
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login"),
  referralCode: text("referral_code").unique(),
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
  stripeAccountId: text("stripe_account_id").unique(),
  stripeOnboardingCompleted: boolean("stripe_onboarding_completed").default(false),
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
  sellerId: integer("seller_id").references(() => users.id), // Independent Seller
  providerId: integer("provider_id").references(() => users.id), // Tour Owner/Operator
  richDescription: text("rich_description"), // Markdown content
  galleryUrls: text("gallery_urls").array(), // Multi-image support
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
  sellerCommission: decimal("seller_commission", { precision: 10, scale: 2 }).notNull().default("0.00"),
  providerPayout: decimal("provider_payout", { precision: 10, scale: 2 }).notNull().default("0.00"),
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).notNull().default("0.00"),
});

export const retentionConfig = pgTable("retention_config", {
  id: serial("id").primaryKey(),
  appCommissionRate: decimal("app_commission_rate", { precision: 5, scale: 2 }).notNull().default("5.00"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).notNull().default("16.00"),
  bankCommissionRate: decimal("bank_commission_rate", { precision: 5, scale: 2 }).notNull().default("3.00"),
  otherRetentionsRate: decimal("other_retentions_rate", { precision: 5, scale: 2 }).notNull().default("2.00"),
  defaultSellerCommissionRate: decimal("default_seller_commission_rate", { precision: 5, scale: 2 }).notNull().default("10.00"),
  defaultPlatformFeeRate: decimal("default_platform_fee_rate", { precision: 5, scale: 2 }).notNull().default("5.00"),
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
  nationality: text("nationality"), // For manifest
  checkedIn: boolean("checked_in").notNull().default(false), // For check-in app
  checkedInAt: timestamp("checked_in_at"),
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
  proposedDate: timestamp("proposed_date"), // New date proposed by system/provider
  rescheduleReason: text("reschedule_reason"), // Reason for the technical modification
  rescheduleToken: text("reschedule_token"), // Token for customer to resolve without login
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
  content: text("content"), // Base64 content (optional if using url)
  url: text("url"), // Blob storage URL
  size: integer("size").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const availabilityOverrides = pgTable("availability_overrides", {
  id: serial("id").primaryKey(),
  tourId: integer("tour_id").references(() => tours.id).notNull(),
  date: timestamp("date").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  customCapacity: integer("custom_capacity"),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").references(() => users.id).notNull(),
  referredUserId: integer("referred_user_id").references(() => users.id),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  status: text("status").notNull().default("pending"),
  rewardAmount: integer("reward_amount").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  fullName: true,
  role: true,
  businessId: true,
  permissions: true,
  whatsappNumber: true,
  referralCode: true,
}).partial({ role: true, businessId: true, permissions: true, whatsappNumber: true, referralCode: true });

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
  sellerId: true,
  providerId: true,
  richDescription: true,
  galleryUrls: true,
  capacity: true,
  duration: true,
  includes: true,
  requirements: true,
  departureTime: true,
  category: true,
  gallery: true,
  businessId: true,
}).partial({
  status: true,
  imageUrl: true,
  description: true,
  userId: true,
  sellerId: true,
  providerId: true,
  richDescription: true,
  galleryUrls: true,
  capacity: true,
  duration: true,
  includes: true,
  requirements: true,
  departureTime: true,
  category: true,
  gallery: true,
  businessId: true,
});

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
  sellerCommission: true,
  providerPayout: true,
  platformFee: true,
}).partial({ status: true, tourId: true, sellerCommission: true, providerPayout: true, platformFee: true });

export const insertRetentionConfigSchema = createInsertSchema(retentionConfig).pick({
  appCommissionRate: true,
  taxRate: true,
  bankCommissionRate: true,
  otherRetentionsRate: true,
  defaultSellerCommissionRate: true,
  defaultPlatformFeeRate: true,
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
  nationality: true,
  checkedIn: true,
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
  paymentStatus: true,
  nationality: true,
  checkedIn: true,
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
  url: true,
  size: true,
});

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountType: text("discount_type").notNull(), // 'percent' or 'fixed'
  discountValue: integer("discount_value").notNull(),
  expirationDate: timestamp("expiration_date"),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").default(0),
  isActive: boolean("is_active").default(true),
  businessId: integer("business_id").references(() => businesses.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCouponSchema = createInsertSchema(coupons).pick({
  code: true,
  discountType: true,
  discountValue: true,
  expirationDate: true,
  usageLimit: true,
  businessId: true,
});

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;

export const insertAvailabilityOverrideSchema = createInsertSchema(availabilityOverrides).pick({
  tourId: true,
  date: true,
  isAvailable: true,
  customCapacity: true,
  reason: true,
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
export type InsertAvailabilityOverride = z.infer<typeof insertAvailabilityOverrideSchema>;
export type AvailabilityOverride = typeof availabilityOverrides.$inferSelect;
