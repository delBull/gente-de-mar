import { pgTable, serial, text, boolean, timestamp, numeric, integer } from 'drizzle-orm/pg-core';

// Businesses table
export const businesses = pgTable('businesses', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  contactEmail: text('contact_email').notNull(),
  contactPhone: text('contact_phone'),
  address: text('address'),
  logo: text('logo'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  fullName: text('full_name').notNull(),
  role: text('role').default('business').notNull(),
  businessId: integer('business_id').references(() => businesses.id),
  permissions: text('permissions').array(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  lastLogin: timestamp('last_login')
});

// Tours table
export const tours = pgTable('tours', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  location: text('location').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  status: text('status').default('active').notNull(),
  imageUrl: text('image_url'),
  description: text('description'),
  userId: integer('user_id').references(() => users.id),
  businessId: integer('business_id').references(() => businesses.id),
  capacity: integer('capacity').default(10).notNull(),
  duration: text('duration'),
  includes: text('includes').array(),
  requirements: text('requirements'),
  departureTime: text('departure_time'),
  category: text('category').default('tour').notNull(),
  gallery: text('gallery').array()
});

// Customers table
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  email: text('email'),
  phone: text('phone'),
  name: text('name').notNull(),
  walletAddress: text('wallet_address'),
  createdAt: timestamp('created_at').defaultNow()
});

// Bookings table
export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  tourId: integer('tour_id').notNull().references(() => tours.id),
  customerId: integer('customer_id').references(() => customers.id),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email'),
  customerPhone: text('customer_phone'),
  bookingDate: timestamp('booking_date').notNull(),
  adults: integer('adults').default(1).notNull(),
  children: integer('children').default(0).notNull(),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  status: text('status').default('pending').notNull(),
  specialRequests: text('special_requests'),
  healthConditions: text('health_conditions'),
  paymentMethod: text('payment_method'),
  transactionHash: text('transaction_hash'),
  qrCode: text('qr_code'),
  alphanumericCode: text('alphanumeric_code').unique(),
  redeemedAt: timestamp('redeemed_at'),
  redeemedBy: integer('redeemed_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  reservedUntil: timestamp('reserved_until')
});

// Retention Config table
export const retentionConfig = pgTable('retention_config', {
  id: serial('id').primaryKey(),
  appCommissionRate: numeric('app_commission_rate', { precision: 5, scale: 2 }).default('5.00').notNull(),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).default('16.00').notNull(),
  bankCommissionRate: numeric('bank_commission_rate', { precision: 5, scale: 2 }).default('3.00').notNull(),
  otherRetentionsRate: numeric('other_retentions_rate', { precision: 5, scale: 2 }).default('2.00').notNull()
});

// Seat Holds table
export const seatHolds = pgTable('seat_holds', {
  id: serial('id').primaryKey(),
  tourId: integer('tour_id').notNull().references(() => tours.id),
  bookingDate: timestamp('booking_date').notNull(),
  seatsHeld: integer('seats_held').notNull(),
  sessionId: text('session_id').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// Ticket Redemptions table
export const ticketRedemptions = pgTable('ticket_redemptions', {
  id: serial('id').primaryKey(),
  bookingId: integer('booking_id').notNull().references(() => bookings.id),
  redeemedBy: integer('redeemed_by').notNull().references(() => users.id),
  redemptionMethod: text('redemption_method').notNull(),
  redeemedAt: timestamp('redeemed_at').defaultNow(),
  notes: text('notes')
});

// Transactions table
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  tourId: integer('tour_id').references(() => tours.id),
  tourName: text('tour_name').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  status: text('status').default('completed').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  appCommission: numeric('app_commission', { precision: 10, scale: 2 }).notNull(),
  taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }).notNull(),
  bankCommission: numeric('bank_commission', { precision: 10, scale: 2 }).notNull(),
  otherRetentions: numeric('other_retentions', { precision: 10, scale: 2 }).notNull(),
  sellerPayout: numeric('seller_payout', { precision: 10, scale: 2 }).notNull()
});