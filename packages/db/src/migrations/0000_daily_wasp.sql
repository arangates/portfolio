CREATE TABLE IF NOT EXISTS "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"institution" text NOT NULL,
	"name" text NOT NULL,
	"account_type" text NOT NULL,
	"account_last4" text,
	"currency" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_balance_snapshot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"batch_id" uuid,
	"as_of" timestamp with time zone NOT NULL,
	"amount" numeric(30, 8) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commodity_holding" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"commodity_type" text NOT NULL,
	"location" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commodity_snapshot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"commodity_holding_id" uuid NOT NULL,
	"as_of" timestamp with time zone DEFAULT now() NOT NULL,
	"quantity_grams" numeric(30, 8) NOT NULL,
	"ownership_share" numeric(12, 8) NOT NULL,
	"price_per_gram" numeric(30, 8) NOT NULL,
	"currency" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fixed_deposit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"bank" text NOT NULL,
	"deposit_type" text NOT NULL,
	"account_last4" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fixed_deposit_snapshot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fixed_deposit_id" uuid NOT NULL,
	"as_of" timestamp with time zone DEFAULT now() NOT NULL,
	"principal" numeric(30, 8) NOT NULL,
	"interest_rate" numeric(12, 8) NOT NULL,
	"start_date" date NOT NULL,
	"maturity_date" date NOT NULL,
	"compounding_per_year" integer DEFAULT 4 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_batch" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"source_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"file_name" text NOT NULL,
	"file_hash" text NOT NULL,
	"file_contents_base64" text NOT NULL,
	"statement_date" date,
	"status" text DEFAULT 'processing' NOT NULL,
	"row_count" integer DEFAULT 0 NOT NULL,
	"inserted_rows" integer DEFAULT 0 NOT NULL,
	"skipped_rows" integer DEFAULT 0 NOT NULL,
	"summary" jsonb,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "import_row" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"row_number" integer NOT NULL,
	"row_hash" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instrument" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"isin" text NOT NULL,
	"symbol" text,
	"name" text NOT NULL,
	"asset_class" text NOT NULL,
	"currency" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"source_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"instrument_id" uuid,
	"external_id" text,
	"entry_key" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"entry_type" text NOT NULL,
	"description" text,
	"quantity" numeric(30, 10),
	"price" numeric(30, 10),
	"gross_amount" numeric(30, 8),
	"fees" numeric(30, 8),
	"net_amount" numeric(30, 8),
	"balance" numeric(30, 8),
	"currency" text NOT NULL,
	"raw_row_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_source" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"name" text NOT NULL,
	"base_currency" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "position_snapshot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"source_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"instrument_id" uuid NOT NULL,
	"snapshot_at" timestamp with time zone NOT NULL,
	"quantity" numeric(30, 10) NOT NULL,
	"average_price" numeric(30, 10),
	"market_price" numeric(30, 10),
	"invested_value" numeric(30, 8),
	"market_value" numeric(30, 8),
	"unrealized_pnl" numeric(30, 8),
	"raw_row_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
ALTER TABLE "bank_account" ADD CONSTRAINT "bank_account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_balance_snapshot" ADD CONSTRAINT "bank_balance_snapshot_account_id_bank_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."bank_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_balance_snapshot" ADD CONSTRAINT "bank_balance_snapshot_batch_id_import_batch_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."import_batch"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commodity_holding" ADD CONSTRAINT "commodity_holding_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commodity_snapshot" ADD CONSTRAINT "commodity_snapshot_commodity_holding_id_commodity_holding_id_fk" FOREIGN KEY ("commodity_holding_id") REFERENCES "public"."commodity_holding"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixed_deposit" ADD CONSTRAINT "fixed_deposit_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixed_deposit_snapshot" ADD CONSTRAINT "fixed_deposit_snapshot_fixed_deposit_id_fixed_deposit_id_fk" FOREIGN KEY ("fixed_deposit_id") REFERENCES "public"."fixed_deposit"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_batch" ADD CONSTRAINT "import_batch_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_batch" ADD CONSTRAINT "import_batch_source_id_portfolio_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."portfolio_source"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_row" ADD CONSTRAINT "import_row_batch_id_import_batch_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."import_batch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instrument" ADD CONSTRAINT "instrument_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entry" ADD CONSTRAINT "ledger_entry_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entry" ADD CONSTRAINT "ledger_entry_source_id_portfolio_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."portfolio_source"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entry" ADD CONSTRAINT "ledger_entry_batch_id_import_batch_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."import_batch"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entry" ADD CONSTRAINT "ledger_entry_instrument_id_instrument_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instrument"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_source" ADD CONSTRAINT "portfolio_source_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_snapshot" ADD CONSTRAINT "position_snapshot_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_snapshot" ADD CONSTRAINT "position_snapshot_source_id_portfolio_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."portfolio_source"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_snapshot" ADD CONSTRAINT "position_snapshot_batch_id_import_batch_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."import_batch"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_snapshot" ADD CONSTRAINT "position_snapshot_instrument_id_instrument_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instrument"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "bank_account_user_currency_idx" ON "bank_account" USING btree ("user_id","currency");--> statement-breakpoint
CREATE UNIQUE INDEX "bank_balance_account_asof_uidx" ON "bank_balance_snapshot" USING btree ("account_id","as_of");--> statement-breakpoint
CREATE INDEX "commodity_holding_user_idx" ON "commodity_holding" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "commodity_snapshot_holding_asof_uidx" ON "commodity_snapshot" USING btree ("commodity_holding_id","as_of");--> statement-breakpoint
CREATE INDEX "fixed_deposit_user_idx" ON "fixed_deposit" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fixed_deposit_snapshot_deposit_asof_uidx" ON "fixed_deposit_snapshot" USING btree ("fixed_deposit_id","as_of");--> statement-breakpoint
CREATE UNIQUE INDEX "import_batch_user_kind_hash_uidx" ON "import_batch" USING btree ("user_id","kind","file_hash");--> statement-breakpoint
CREATE INDEX "import_batch_user_created_idx" ON "import_batch" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "import_row_batch_number_uidx" ON "import_row" USING btree ("batch_id","row_number");--> statement-breakpoint
CREATE INDEX "import_row_hash_idx" ON "import_row" USING btree ("row_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "instrument_user_isin_uidx" ON "instrument" USING btree ("user_id","isin");--> statement-breakpoint
CREATE INDEX "instrument_user_class_idx" ON "instrument" USING btree ("user_id","asset_class");--> statement-breakpoint
CREATE UNIQUE INDEX "ledger_entry_user_source_key_uidx" ON "ledger_entry" USING btree ("user_id","source_id","entry_key");--> statement-breakpoint
CREATE INDEX "ledger_entry_user_occurred_idx" ON "ledger_entry" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "portfolio_source_user_provider_name_uidx" ON "portfolio_source" USING btree ("user_id","provider","name");--> statement-breakpoint
CREATE INDEX "portfolio_source_user_idx" ON "portfolio_source" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "position_snapshot_batch_instrument_uidx" ON "position_snapshot" USING btree ("batch_id","instrument_id");--> statement-breakpoint
CREATE INDEX "position_snapshot_user_date_idx" ON "position_snapshot" USING btree ("user_id","snapshot_at");
