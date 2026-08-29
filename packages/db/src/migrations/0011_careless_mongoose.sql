CREATE TABLE "income_tax_import" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"file_name" text NOT NULL,
	"file_hash" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"parser_version" text NOT NULL,
	"status" text DEFAULT 'processing' NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "income_tax_return" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"import_id" uuid NOT NULL,
	"jurisdiction" text DEFAULT 'IN' NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"assessment_year_start" integer NOT NULL,
	"assessment_year_label" text NOT NULL,
	"financial_year_label" text NOT NULL,
	"form_type" text NOT NULL,
	"schema_version" text,
	"form_version" text,
	"source_created_on" date,
	"acknowledgement_number" text,
	"filing_section" text,
	"residential_status" text,
	"tax_regime" text DEFAULT 'unknown' NOT NULL,
	"salary_income" numeric(30, 2) NOT NULL,
	"house_property_income" numeric(30, 2) NOT NULL,
	"business_income" numeric(30, 2) NOT NULL,
	"capital_gains" numeric(30, 2) NOT NULL,
	"other_sources_income" numeric(30, 2) NOT NULL,
	"gross_total_income" numeric(30, 2) NOT NULL,
	"chapter_vi_deductions" numeric(30, 2) NOT NULL,
	"total_income" numeric(30, 2) NOT NULL,
	"net_tax_liability" numeric(30, 2) NOT NULL,
	"interest_and_fees" numeric(30, 2) NOT NULL,
	"aggregate_tax_liability" numeric(30, 2) NOT NULL,
	"advance_tax" numeric(30, 2) NOT NULL,
	"tds" numeric(30, 2) NOT NULL,
	"tcs" numeric(30, 2) NOT NULL,
	"self_assessment_tax" numeric(30, 2) NOT NULL,
	"total_taxes_paid" numeric(30, 2) NOT NULL,
	"balance_tax_payable" numeric(30, 2) NOT NULL,
	"refund_due" numeric(30, 2) NOT NULL,
	"validation_status" text NOT NULL,
	"validation_issues" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "income_tax_import" ADD CONSTRAINT "income_tax_import_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_tax_return" ADD CONSTRAINT "income_tax_return_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_tax_return" ADD CONSTRAINT "income_tax_return_import_id_income_tax_import_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."income_tax_import"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "income_tax_import_user_hash_uidx" ON "income_tax_import" USING btree ("user_id","file_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "income_tax_import_id_user_uidx" ON "income_tax_import" USING btree ("id","user_id");--> statement-breakpoint
ALTER TABLE "income_tax_return" ADD CONSTRAINT "income_tax_return_import_owner_fk" FOREIGN KEY ("import_id","user_id") REFERENCES "public"."income_tax_import"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "income_tax_import_user_created_idx" ON "income_tax_import" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "income_tax_return_import_uidx" ON "income_tax_return" USING btree ("import_id");--> statement-breakpoint
CREATE UNIQUE INDEX "income_tax_return_id_user_uidx" ON "income_tax_return" USING btree ("id","user_id");--> statement-breakpoint
CREATE INDEX "income_tax_return_user_year_idx" ON "income_tax_return" USING btree ("user_id","assessment_year_start");
