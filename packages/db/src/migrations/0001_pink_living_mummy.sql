CREATE TABLE "audit_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exchange_rate_snapshot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"base_currency" text NOT NULL,
	"quote_currency" text NOT NULL,
	"rate" numeric(30, 12) NOT NULL,
	"as_of" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manual_asset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"asset_type" text NOT NULL,
	"location" text,
	"risk_level" text DEFAULT 'moderate' NOT NULL,
	"is_liquid" boolean DEFAULT false NOT NULL,
	"notes" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manual_asset_snapshot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"asset_id" uuid NOT NULL,
	"as_of" timestamp with time zone DEFAULT now() NOT NULL,
	"value" numeric(30, 8) NOT NULL,
	"currency" text NOT NULL,
	"ownership_share" numeric(12, 8) DEFAULT '1' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_preference" (
	"user_id" text PRIMARY KEY NOT NULL,
	"base_currency" text DEFAULT 'INR' NOT NULL,
	"locale" text DEFAULT 'en-IN' NOT NULL,
	"time_zone" text DEFAULT 'UTC' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bank_account" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "bank_account" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bank_balance_snapshot" ADD COLUMN "user_id" text;--> statement-breakpoint
UPDATE "bank_balance_snapshot" AS snapshot SET "user_id" = account."user_id" FROM "bank_account" AS account WHERE snapshot."account_id" = account."id";--> statement-breakpoint
ALTER TABLE "bank_balance_snapshot" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "commodity_holding" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "commodity_snapshot" ADD COLUMN "user_id" text;--> statement-breakpoint
UPDATE "commodity_snapshot" AS snapshot SET "user_id" = holding."user_id" FROM "commodity_holding" AS holding WHERE snapshot."commodity_holding_id" = holding."id";--> statement-breakpoint
ALTER TABLE "commodity_snapshot" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "fixed_deposit" ADD COLUMN "currency" text DEFAULT 'INR' NOT NULL;--> statement-breakpoint
ALTER TABLE "fixed_deposit" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "fixed_deposit_snapshot" ADD COLUMN "user_id" text;--> statement-breakpoint
UPDATE "fixed_deposit_snapshot" AS snapshot SET "user_id" = deposit."user_id" FROM "fixed_deposit" AS deposit WHERE snapshot."fixed_deposit_id" = deposit."id";--> statement-breakpoint
ALTER TABLE "fixed_deposit_snapshot" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchange_rate_snapshot" ADD CONSTRAINT "exchange_rate_snapshot_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_asset" ADD CONSTRAINT "manual_asset_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_asset_snapshot" ADD CONSTRAINT "manual_asset_snapshot_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_asset_snapshot" ADD CONSTRAINT "manual_asset_snapshot_asset_id_manual_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."manual_asset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_preference" ADD CONSTRAINT "portfolio_preference_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_event_user_created_idx" ON "audit_event" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "exchange_rate_user_pair_asof_uidx" ON "exchange_rate_snapshot" USING btree ("user_id","base_currency","quote_currency","as_of");--> statement-breakpoint
CREATE INDEX "exchange_rate_user_asof_idx" ON "exchange_rate_snapshot" USING btree ("user_id","as_of");--> statement-breakpoint
CREATE INDEX "manual_asset_user_type_idx" ON "manual_asset" USING btree ("user_id","asset_type");--> statement-breakpoint
CREATE UNIQUE INDEX "manual_asset_user_name_uidx" ON "manual_asset" USING btree ("user_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "manual_asset_snapshot_asset_asof_uidx" ON "manual_asset_snapshot" USING btree ("asset_id","as_of");--> statement-breakpoint
CREATE INDEX "manual_asset_snapshot_user_asof_idx" ON "manual_asset_snapshot" USING btree ("user_id","as_of");--> statement-breakpoint
ALTER TABLE "bank_balance_snapshot" ADD CONSTRAINT "bank_balance_snapshot_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commodity_snapshot" ADD CONSTRAINT "commodity_snapshot_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixed_deposit_snapshot" ADD CONSTRAINT "fixed_deposit_snapshot_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bank_account_user_identity_uidx" ON "bank_account" USING btree ("user_id","institution","name","currency");--> statement-breakpoint
CREATE INDEX "bank_balance_user_asof_idx" ON "bank_balance_snapshot" USING btree ("user_id","as_of");--> statement-breakpoint
CREATE INDEX "commodity_snapshot_user_asof_idx" ON "commodity_snapshot" USING btree ("user_id","as_of");--> statement-breakpoint
CREATE INDEX "fixed_deposit_snapshot_user_asof_idx" ON "fixed_deposit_snapshot" USING btree ("user_id","as_of");
