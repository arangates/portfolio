CREATE TABLE "mortgage_extra_repayment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"loan_id" uuid NOT NULL,
	"paid_on" date NOT NULL,
	"amount" numeric(30, 2) NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mortgage_import" (
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
CREATE TABLE "mortgage_loan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"lender" text DEFAULT 'ING' NOT NULL,
	"loan_number" text NOT NULL,
	"rate_basis" text DEFAULT 'implied' NOT NULL,
	"property_appreciation" numeric(8, 5) DEFAULT '0.02' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mortgage_overview" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"loan_id" uuid NOT NULL,
	"import_id" uuid,
	"source" text DEFAULT 'import' NOT NULL,
	"as_of" date NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"repayment_type" text DEFAULT 'annuity' NOT NULL,
	"start_date" date NOT NULL,
	"first_payment_date" date NOT NULL,
	"end_date" date NOT NULL,
	"fixed_rate_end_date" date NOT NULL,
	"original_amount" numeric(30, 2) NOT NULL,
	"current_balance" numeric(30, 2) NOT NULL,
	"monthly_payment" numeric(30, 2) NOT NULL,
	"stated_rate" numeric(8, 5) NOT NULL,
	"discount" numeric(8, 5) DEFAULT '0' NOT NULL,
	"sustainability_discount" boolean DEFAULT false NOT NULL,
	"registration_amount" numeric(30, 2),
	"free_repayment_allowance" numeric(30, 2),
	"property_value" numeric(30, 2),
	"valuation_date" date,
	"energy_label" text,
	"nhg" boolean DEFAULT false NOT NULL,
	"bouwdepot_original" numeric(30, 2),
	"bouwdepot_remaining" numeric(30, 2),
	"validation_status" text DEFAULT 'verified' NOT NULL,
	"validation_issues" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "mortgage_loan_id_user_uidx" ON "mortgage_loan" USING btree ("id","user_id");--> statement-breakpoint
ALTER TABLE "mortgage_extra_repayment" ADD CONSTRAINT "mortgage_extra_repayment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mortgage_extra_repayment" ADD CONSTRAINT "mortgage_extra_repayment_loan_id_mortgage_loan_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."mortgage_loan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mortgage_extra_repayment" ADD CONSTRAINT "mortgage_extra_repayment_loan_owner_fk" FOREIGN KEY ("loan_id","user_id") REFERENCES "public"."mortgage_loan"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mortgage_import" ADD CONSTRAINT "mortgage_import_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mortgage_loan" ADD CONSTRAINT "mortgage_loan_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mortgage_overview" ADD CONSTRAINT "mortgage_overview_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mortgage_overview" ADD CONSTRAINT "mortgage_overview_loan_id_mortgage_loan_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."mortgage_loan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mortgage_overview" ADD CONSTRAINT "mortgage_overview_import_id_mortgage_import_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."mortgage_import"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mortgage_overview" ADD CONSTRAINT "mortgage_overview_loan_owner_fk" FOREIGN KEY ("loan_id","user_id") REFERENCES "public"."mortgage_loan"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mortgage_extra_repayment_loan_idx" ON "mortgage_extra_repayment" USING btree ("loan_id","paid_on");--> statement-breakpoint
CREATE UNIQUE INDEX "mortgage_import_user_hash_uidx" ON "mortgage_import" USING btree ("user_id","file_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "mortgage_import_id_user_uidx" ON "mortgage_import" USING btree ("id","user_id");--> statement-breakpoint
CREATE INDEX "mortgage_import_user_created_idx" ON "mortgage_import" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "mortgage_loan_user_number_uidx" ON "mortgage_loan" USING btree ("user_id","loan_number");--> statement-breakpoint
CREATE UNIQUE INDEX "mortgage_overview_loan_as_of_uidx" ON "mortgage_overview" USING btree ("loan_id","as_of");--> statement-breakpoint
CREATE UNIQUE INDEX "mortgage_overview_id_user_uidx" ON "mortgage_overview" USING btree ("id","user_id");--> statement-breakpoint
CREATE INDEX "mortgage_overview_user_as_of_idx" ON "mortgage_overview" USING btree ("user_id","as_of");