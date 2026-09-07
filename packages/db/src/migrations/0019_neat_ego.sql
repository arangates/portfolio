ALTER TABLE "exchange_rate_snapshot" ADD COLUMN "source" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "exchange_rate_snapshot" ADD COLUMN "rate_type" text DEFAULT 'reference' NOT NULL;--> statement-breakpoint
ALTER TABLE "exchange_rate_snapshot" ADD COLUMN "retrieved_at" timestamp with time zone DEFAULT now() NOT NULL;