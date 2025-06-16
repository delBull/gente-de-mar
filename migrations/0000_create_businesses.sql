CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"tour_id" integer NOT NULL,
	"customer_id" integer,
	"customer_name" text NOT NULL,
	"customer_email" text,
	"customer_phone" text,
	"booking_date" timestamp NOT NULL,
	"adults" integer DEFAULT 1 NOT NULL,
	"children" integer DEFAULT 0 NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"special_requests" text,
	"health_conditions" text,
	"payment_method" text,
	"transaction_hash" text,
	"qr_code" text,
	"alphanumeric_code" text,
	"redeemed_at" timestamp,
	"redeemed_by" integer,
	"created_at" timestamp DEFAULT now(),
	"reserved_until" timestamp,
	CONSTRAINT "bookings_alphanumeric_code_unique" UNIQUE("alphanumeric_code")
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"contact_email" text NOT NULL,
	"contact_phone" text,
	"address" text,
	"logo" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text,
	"phone" text,
	"name" text NOT NULL,
	"wallet_address" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "retention_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"app_commission_rate" numeric(5, 2) DEFAULT '5.00' NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '16.00' NOT NULL,
	"bank_commission_rate" numeric(5, 2) DEFAULT '3.00' NOT NULL,
	"other_retentions_rate" numeric(5, 2) DEFAULT '2.00' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seat_holds" (
	"id" serial PRIMARY KEY NOT NULL,
	"tour_id" integer NOT NULL,
	"booking_date" timestamp NOT NULL,
	"seats_held" integer NOT NULL,
	"session_id" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ticket_redemptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"redeemed_by" integer NOT NULL,
	"redemption_method" text NOT NULL,
	"redeemed_at" timestamp DEFAULT now(),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "tours" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"location" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"image_url" text,
	"description" text,
	"user_id" integer,
	"business_id" integer,
	"capacity" integer DEFAULT 10 NOT NULL,
	"duration" text,
	"includes" text[],
	"requirements" text,
	"departure_time" text,
	"category" text DEFAULT 'tour' NOT NULL,
	"gallery" text[]
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"tour_id" integer,
	"tour_name" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"app_commission" numeric(10, 2) NOT NULL,
	"tax_amount" numeric(10, 2) NOT NULL,
	"bank_commission" numeric(10, 2) NOT NULL,
	"other_retentions" numeric(10, 2) NOT NULL,
	"seller_payout" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"full_name" text NOT NULL,
	"role" text DEFAULT 'business' NOT NULL,
	"business_id" integer,
	"permissions" text[],
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"last_login" timestamp,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_tour_id_tours_id_fk" FOREIGN KEY ("tour_id") REFERENCES "public"."tours"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_redeemed_by_users_id_fk" FOREIGN KEY ("redeemed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seat_holds" ADD CONSTRAINT "seat_holds_tour_id_tours_id_fk" FOREIGN KEY ("tour_id") REFERENCES "public"."tours"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_redemptions" ADD CONSTRAINT "ticket_redemptions_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_redemptions" ADD CONSTRAINT "ticket_redemptions_redeemed_by_users_id_fk" FOREIGN KEY ("redeemed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tours" ADD CONSTRAINT "tours_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tours" ADD CONSTRAINT "tours_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_tour_id_tours_id_fk" FOREIGN KEY ("tour_id") REFERENCES "public"."tours"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;