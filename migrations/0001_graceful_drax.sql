CREATE TABLE "availability_overrides" (
	"id" serial PRIMARY KEY NOT NULL,
	"tour_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"custom_capacity" integer,
	"reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"discount_type" text NOT NULL,
	"discount_value" integer NOT NULL,
	"expiration_date" timestamp,
	"usage_limit" integer,
	"usage_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"business_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"mime_type" text NOT NULL,
	"content" text,
	"url" text,
	"size" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"stripe_payment_intent_id" text NOT NULL,
	"stripe_customer_id" text,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'mxn' NOT NULL,
	"status" text NOT NULL,
	"payment_method" text,
	"mode" text DEFAULT 'sandbox' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"refunded_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" serial PRIMARY KEY NOT NULL,
	"referrer_id" integer NOT NULL,
	"referred_user_id" integer,
	"booking_id" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reward_amount" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webauthn_credentials" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"credential_id" text NOT NULL,
	"public_key" text NOT NULL,
	"counter" integer DEFAULT 0 NOT NULL,
	"device_name" text,
	"transports" text[],
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "webauthn_credentials_credential_id_unique" UNIQUE("credential_id")
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'seller';--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "nationality" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "checked_in" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "checked_in_at" timestamp;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "stripe_payment_intent_id" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "stripe_session_id" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "payment_status" text DEFAULT 'unpaid' NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "proposed_date" timestamp;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "reschedule_reason" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "reschedule_token" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "stripe_account_id" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "stripe_onboarding_completed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "retention_config" ADD COLUMN "default_seller_commission_rate" numeric(5, 2) DEFAULT '10.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "retention_config" ADD COLUMN "default_platform_fee_rate" numeric(5, 2) DEFAULT '5.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "tours" ADD COLUMN "seller_id" integer;--> statement-breakpoint
ALTER TABLE "tours" ADD COLUMN "provider_id" integer;--> statement-breakpoint
ALTER TABLE "tours" ADD COLUMN "rich_description" text;--> statement-breakpoint
ALTER TABLE "tours" ADD COLUMN "gallery_urls" text[];--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "seller_commission" numeric(10, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "provider_payout" numeric(10, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "platform_fee" numeric(10, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "payout_config" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "whatsapp_number" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "referral_code" text;--> statement-breakpoint
ALTER TABLE "availability_overrides" ADD CONSTRAINT "availability_overrides_tour_id_tours_id_fk" FOREIGN KEY ("tour_id") REFERENCES "public"."tours"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_user_id_users_id_fk" FOREIGN KEY ("referred_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webauthn_credentials" ADD CONSTRAINT "webauthn_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tours" ADD CONSTRAINT "tours_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tours" ADD CONSTRAINT "tours_provider_id_users_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_stripe_account_id_unique" UNIQUE("stripe_account_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code");