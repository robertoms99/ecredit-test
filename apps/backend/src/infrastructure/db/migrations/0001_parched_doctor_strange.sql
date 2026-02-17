ALTER TABLE "banking_info" ADD COLUMN IF NOT EXISTS "external_request_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "banking_info" DROP COLUMN IF EXISTS "credit_score";--> statement-breakpoint
ALTER TABLE "banking_info" DROP COLUMN IF EXISTS "total_debt";--> statement-breakpoint
ALTER TABLE "banking_info" DROP COLUMN IF EXISTS "available_credit";--> statement-breakpoint
ALTER TABLE "banking_info" DROP COLUMN IF EXISTS "risk_level";
