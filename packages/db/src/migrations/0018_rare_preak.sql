CREATE TABLE "mutual_fund_instrument_link" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"instrument_id" uuid NOT NULL,
	"scheme_code" integer,
	"match_method" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"matched_at" timestamp with time zone,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mutual_fund_nav" (
	"scheme_code" integer NOT NULL,
	"nav_date" date NOT NULL,
	"nav" numeric(30, 10) NOT NULL,
	"source" text DEFAULT 'mfapi.in' NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mutual_fund_nav_scheme_code_nav_date_pk" PRIMARY KEY("scheme_code","nav_date")
);
--> statement-breakpoint
CREATE TABLE "mutual_fund_scheme" (
	"scheme_code" integer PRIMARY KEY NOT NULL,
	"scheme_name" text NOT NULL,
	"fund_house" text NOT NULL,
	"scheme_type" text NOT NULL,
	"scheme_category" text NOT NULL,
	"isin_growth" text,
	"isin_div_reinvestment" text,
	"source" text DEFAULT 'mfapi.in' NOT NULL,
	"source_updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mutual_fund_sync_run" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'processing' NOT NULL,
	"schemes_requested" integer DEFAULT 0 NOT NULL,
	"schemes_matched" integer DEFAULT 0 NOT NULL,
	"schemes_synced" integer DEFAULT 0 NOT NULL,
	"nav_rows_written" integer DEFAULT 0 NOT NULL,
	"summary" jsonb,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "mutual_fund_instrument_link" ADD CONSTRAINT "mutual_fund_instrument_link_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mutual_fund_instrument_link" ADD CONSTRAINT "mutual_fund_instrument_link_instrument_id_instrument_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instrument"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mutual_fund_instrument_link" ADD CONSTRAINT "mutual_fund_instrument_link_scheme_code_mutual_fund_scheme_scheme_code_fk" FOREIGN KEY ("scheme_code") REFERENCES "public"."mutual_fund_scheme"("scheme_code") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mutual_fund_instrument_link" ADD CONSTRAINT "mutual_fund_link_instrument_owner_fk" FOREIGN KEY ("instrument_id","user_id") REFERENCES "public"."instrument"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mutual_fund_nav" ADD CONSTRAINT "mutual_fund_nav_scheme_code_mutual_fund_scheme_scheme_code_fk" FOREIGN KEY ("scheme_code") REFERENCES "public"."mutual_fund_scheme"("scheme_code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mutual_fund_sync_run" ADD CONSTRAINT "mutual_fund_sync_run_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "mutual_fund_link_user_instrument_uidx" ON "mutual_fund_instrument_link" USING btree ("user_id","instrument_id");--> statement-breakpoint
CREATE INDEX "mutual_fund_link_user_status_idx" ON "mutual_fund_instrument_link" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "mutual_fund_nav_date_idx" ON "mutual_fund_nav" USING btree ("nav_date");--> statement-breakpoint
CREATE INDEX "mutual_fund_scheme_growth_isin_idx" ON "mutual_fund_scheme" USING btree ("isin_growth");--> statement-breakpoint
CREATE INDEX "mutual_fund_scheme_div_isin_idx" ON "mutual_fund_scheme" USING btree ("isin_div_reinvestment");--> statement-breakpoint
CREATE INDEX "mutual_fund_scheme_category_idx" ON "mutual_fund_scheme" USING btree ("scheme_category");--> statement-breakpoint
CREATE INDEX "mutual_fund_sync_user_created_idx" ON "mutual_fund_sync_run" USING btree ("user_id","created_at");