CREATE TABLE "netherlands_tax_assessment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"import_id" uuid NOT NULL,
	"taxpayer_member_id" uuid,
	"tax_year" integer NOT NULL,
	"assessment_type" text DEFAULT 'final' NOT NULL,
	"assessment_date" date NOT NULL,
	"assessment_reference_suffix" text,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"outcome_type" text NOT NULL,
	"settlement_amount" numeric(30, 2) NOT NULL,
	"payroll_tax_withheld" numeric(30, 2) NOT NULL,
	"dividend_gaming_tax_withheld" numeric(30, 2) NOT NULL,
	"provisional_refunds" numeric(30, 2) NOT NULL,
	"prior_balance_adjustment" numeric(30, 2) NOT NULL,
	"tax_interest" numeric(30, 2) NOT NULL,
	"final_tax_and_social_insurance" numeric(30, 2) NOT NULL,
	"box1_taxable_income" numeric(30, 2) NOT NULL,
	"box1_income_tax" numeric(30, 2) NOT NULL,
	"box2_taxable_income" numeric(30, 2) NOT NULL,
	"box2_income_tax" numeric(30, 2) NOT NULL,
	"box3_taxable_income" numeric(30, 2) NOT NULL,
	"box3_income_tax" numeric(30, 2) NOT NULL,
	"social_insurance_income" numeric(30, 2) NOT NULL,
	"social_insurance_premium" numeric(30, 2) NOT NULL,
	"general_tax_credit" numeric(30, 2) NOT NULL,
	"employment_tax_credit" numeric(30, 2) NOT NULL,
	"total_tax_credits" numeric(30, 2) NOT NULL,
	"aggregate_income" numeric(30, 2) NOT NULL,
	"validation_status" text NOT NULL,
	"validation_issues" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "netherlands_tax_import" (
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
ALTER TABLE "netherlands_tax_assessment" ADD CONSTRAINT "netherlands_tax_assessment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "netherlands_tax_assessment" ADD CONSTRAINT "netherlands_tax_assessment_import_id_netherlands_tax_import_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."netherlands_tax_import"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "netherlands_tax_assessment" ADD CONSTRAINT "netherlands_tax_assessment_taxpayer_member_id_family_member_id_fk" FOREIGN KEY ("taxpayer_member_id") REFERENCES "public"."family_member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "netherlands_tax_import_id_user_uidx" ON "netherlands_tax_import" USING btree ("id","user_id");--> statement-breakpoint
ALTER TABLE "netherlands_tax_assessment" ADD CONSTRAINT "netherlands_tax_assessment_import_owner_fk" FOREIGN KEY ("import_id","user_id") REFERENCES "public"."netherlands_tax_import"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "netherlands_tax_assessment" ADD CONSTRAINT "netherlands_tax_assessment_member_owner_fk" FOREIGN KEY ("taxpayer_member_id","user_id") REFERENCES "public"."family_member"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "netherlands_tax_import" ADD CONSTRAINT "netherlands_tax_import_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "netherlands_tax_assessment_import_uidx" ON "netherlands_tax_assessment" USING btree ("import_id");--> statement-breakpoint
CREATE UNIQUE INDEX "netherlands_tax_assessment_id_user_uidx" ON "netherlands_tax_assessment" USING btree ("id","user_id");--> statement-breakpoint
CREATE INDEX "netherlands_tax_assessment_user_year_idx" ON "netherlands_tax_assessment" USING btree ("user_id","taxpayer_member_id","tax_year");--> statement-breakpoint
CREATE UNIQUE INDEX "netherlands_tax_import_user_hash_uidx" ON "netherlands_tax_import" USING btree ("user_id","file_hash");--> statement-breakpoint
CREATE INDEX "netherlands_tax_import_user_created_idx" ON "netherlands_tax_import" USING btree ("user_id","created_at");
