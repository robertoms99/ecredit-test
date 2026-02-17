CREATE TABLE IF NOT EXISTS "banking_info" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_name" varchar(255) NOT NULL,
	"provider_response_at" timestamp with time zone,
	"financial_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"credit_score" integer,
	"total_debt" numeric,
	"available_credit" numeric,
	"risk_level" varchar(64),
	"fetch_status" varchar(64) DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"credit_request_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "credit_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country" varchar(2) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"document_id" varchar(64) NOT NULL,
	"requested_amount" double precision NOT NULL,
	"monthly_income" double precision NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"status_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "request_statuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_final" boolean DEFAULT false NOT NULL,
	"display_order" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "status_transitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reason" text,
	"triggered_by" varchar(32) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"credit_request_id" uuid NOT NULL,
	"from_status_id" uuid,
	"to_status_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"role" varchar(32) DEFAULT 'user' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "banking_info" ADD CONSTRAINT "banking_info_credit_request_id_credit_requests_id_fk" FOREIGN KEY ("credit_request_id") REFERENCES "public"."credit_requests"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "credit_requests" ADD CONSTRAINT "credit_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "credit_requests" ADD CONSTRAINT "credit_requests_status_id_request_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."request_statuses"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "status_transitions" ADD CONSTRAINT "status_transitions_credit_request_id_credit_requests_id_fk" FOREIGN KEY ("credit_request_id") REFERENCES "public"."credit_requests"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "status_transitions" ADD CONSTRAINT "status_transitions_from_status_id_request_statuses_id_fk" FOREIGN KEY ("from_status_id") REFERENCES "public"."request_statuses"("id") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "status_transitions" ADD CONSTRAINT "status_transitions_to_status_id_request_statuses_id_fk" FOREIGN KEY ("to_status_id") REFERENCES "public"."request_statuses"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credit_requests_country_idx" ON "credit_requests" USING btree ("country");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credit_requests_status_idx" ON "credit_requests" USING btree ("status_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credit_requests_requested_at_idx" ON "credit_requests" USING btree ("requested_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "request_statuses_code_unique" ON "request_statuses" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" USING btree ("email");