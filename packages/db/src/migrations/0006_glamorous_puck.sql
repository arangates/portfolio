CREATE TABLE "salary_import" (
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
CREATE TABLE "salary_line_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"payslip_id" uuid NOT NULL,
	"row_index" integer NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"amount" numeric(30, 8) NOT NULL,
	"components" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"quantity" numeric(30, 8),
	"unit" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salary_payslip" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"import_id" uuid NOT NULL,
	"employer_name" text NOT NULL,
	"pay_period" date NOT NULL,
	"period_label" text NOT NULL,
	"currency" text NOT NULL,
	"revision" text,
	"base_salary" numeric(30, 8) NOT NULL,
	"supplemental_gross" numeric(30, 8) NOT NULL,
	"gross_pay" numeric(30, 8) NOT NULL,
	"taxable_wage" numeric(30, 8) NOT NULL,
	"wage_tax" numeric(30, 8) NOT NULL,
	"pension_contribution" numeric(30, 8) NOT NULL,
	"social_insurance" numeric(30, 8) NOT NULL,
	"thirty_percent_adjustment" numeric(30, 8) NOT NULL,
	"thirty_percent_compensation" numeric(30, 8) NOT NULL,
	"expense_reimbursements" numeric(30, 8) NOT NULL,
	"net_pay" numeric(30, 8) NOT NULL,
	"annual_salary" numeric(30, 8),
	"part_time_percentage" numeric(12, 8),
	"ytd_taxable_wage" numeric(30, 8),
	"ytd_wage_tax" numeric(30, 8),
	"ytd_net_pay" numeric(30, 8),
	"ytd_pension" numeric(30, 8),
	"validation_status" text NOT NULL,
	"validation_issues" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "salary_import_id_user_uidx" ON "salary_import" USING btree ("id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "salary_payslip_id_user_uidx" ON "salary_payslip" USING btree ("id","user_id");--> statement-breakpoint
ALTER TABLE "salary_import" ADD CONSTRAINT "salary_import_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_line_item" ADD CONSTRAINT "salary_line_item_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_line_item" ADD CONSTRAINT "salary_line_item_payslip_id_salary_payslip_id_fk" FOREIGN KEY ("payslip_id") REFERENCES "public"."salary_payslip"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_line_item" ADD CONSTRAINT "salary_line_item_payslip_owner_fk" FOREIGN KEY ("payslip_id","user_id") REFERENCES "public"."salary_payslip"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_payslip" ADD CONSTRAINT "salary_payslip_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_payslip" ADD CONSTRAINT "salary_payslip_import_id_salary_import_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."salary_import"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_payslip" ADD CONSTRAINT "salary_payslip_import_owner_fk" FOREIGN KEY ("import_id","user_id") REFERENCES "public"."salary_import"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "salary_import_user_hash_uidx" ON "salary_import" USING btree ("user_id","file_hash");--> statement-breakpoint
CREATE INDEX "salary_import_user_created_idx" ON "salary_import" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "salary_line_item_payslip_row_uidx" ON "salary_line_item" USING btree ("payslip_id","row_index");--> statement-breakpoint
CREATE INDEX "salary_line_item_user_category_idx" ON "salary_line_item" USING btree ("user_id","category");--> statement-breakpoint
CREATE UNIQUE INDEX "salary_payslip_import_uidx" ON "salary_payslip" USING btree ("import_id");--> statement-breakpoint
CREATE INDEX "salary_payslip_user_period_idx" ON "salary_payslip" USING btree ("user_id","pay_period");--> statement-breakpoint
CREATE INDEX "salary_payslip_user_employer_period_idx" ON "salary_payslip" USING btree ("user_id","employer_name","pay_period");
