CREATE TABLE "household_budget_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"flow_type" text NOT NULL,
	"essential" boolean DEFAULT true NOT NULL,
	"notes" text,
	"source_key" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "household_budget_snapshot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"item_id" uuid NOT NULL,
	"effective_from" date NOT NULL,
	"monthly_amount" numeric(30, 8) NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "household_profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"adults_count" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "household_purchase" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"scope" text NOT NULL,
	"category" text NOT NULL,
	"vendor" text,
	"amount" numeric(30, 8) NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"purchased_on" date,
	"payment_source" text,
	"notes" text,
	"source_key" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "household_scenario" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"scenario_type" text DEFAULT 'custom' NOT NULL,
	"description" text,
	"adults_count" integer DEFAULT 1 NOT NULL,
	"uses_current_budget" boolean DEFAULT false NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "household_scenario_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"scenario_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"flow_type" text NOT NULL,
	"monthly_amount" numeric(30, 8) NOT NULL,
	"essential" boolean DEFAULT true NOT NULL,
	"notes" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"source_key" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "household_service_contract" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"budget_item_id" uuid,
	"service" text NOT NULL,
	"provider" text NOT NULL,
	"source_key" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "household_service_contract_snapshot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"contract_id" uuid NOT NULL,
	"effective_from" date NOT NULL,
	"monthly_cost" numeric(30, 8),
	"billing_day" integer,
	"contract_end_date" date,
	"duration_months" integer,
	"renewal_type" text DEFAULT 'unknown' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"source" text DEFAULT 'manual' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "household_budget_item_id_user_uidx" ON "household_budget_item" USING btree ("id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "household_scenario_id_user_uidx" ON "household_scenario" USING btree ("id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "household_contract_id_user_uidx" ON "household_service_contract" USING btree ("id","user_id");--> statement-breakpoint
ALTER TABLE "household_budget_item" ADD CONSTRAINT "household_budget_item_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_budget_snapshot" ADD CONSTRAINT "household_budget_snapshot_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_budget_snapshot" ADD CONSTRAINT "household_budget_snapshot_item_id_household_budget_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."household_budget_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_budget_snapshot" ADD CONSTRAINT "household_budget_snapshot_owner_fk" FOREIGN KEY ("item_id","user_id") REFERENCES "public"."household_budget_item"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_profile" ADD CONSTRAINT "household_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_purchase" ADD CONSTRAINT "household_purchase_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_scenario" ADD CONSTRAINT "household_scenario_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_scenario_line" ADD CONSTRAINT "household_scenario_line_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_scenario_line" ADD CONSTRAINT "household_scenario_line_scenario_id_household_scenario_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."household_scenario"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_scenario_line" ADD CONSTRAINT "household_scenario_line_owner_fk" FOREIGN KEY ("scenario_id","user_id") REFERENCES "public"."household_scenario"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_service_contract" ADD CONSTRAINT "household_service_contract_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_service_contract" ADD CONSTRAINT "household_service_contract_budget_item_id_household_budget_item_id_fk" FOREIGN KEY ("budget_item_id") REFERENCES "public"."household_budget_item"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_service_contract" ADD CONSTRAINT "household_contract_budget_owner_fk" FOREIGN KEY ("budget_item_id","user_id") REFERENCES "public"."household_budget_item"("id","user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_service_contract_snapshot" ADD CONSTRAINT "household_service_contract_snapshot_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_service_contract_snapshot" ADD CONSTRAINT "household_service_contract_snapshot_contract_id_household_service_contract_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."household_service_contract"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_service_contract_snapshot" ADD CONSTRAINT "household_contract_snapshot_owner_fk" FOREIGN KEY ("contract_id","user_id") REFERENCES "public"."household_service_contract"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "household_budget_item_user_identity_uidx" ON "household_budget_item" USING btree ("user_id","name","category","flow_type");--> statement-breakpoint
CREATE UNIQUE INDEX "household_budget_item_user_source_uidx" ON "household_budget_item" USING btree ("user_id","source_key");--> statement-breakpoint
CREATE INDEX "household_budget_item_user_category_idx" ON "household_budget_item" USING btree ("user_id","category");--> statement-breakpoint
CREATE UNIQUE INDEX "household_budget_snapshot_item_date_uidx" ON "household_budget_snapshot" USING btree ("item_id","effective_from");--> statement-breakpoint
CREATE INDEX "household_budget_snapshot_user_date_idx" ON "household_budget_snapshot" USING btree ("user_id","effective_from");--> statement-breakpoint
CREATE UNIQUE INDEX "household_purchase_user_source_uidx" ON "household_purchase" USING btree ("user_id","source_key");--> statement-breakpoint
CREATE INDEX "household_purchase_user_scope_idx" ON "household_purchase" USING btree ("user_id","scope");--> statement-breakpoint
CREATE INDEX "household_purchase_user_date_idx" ON "household_purchase" USING btree ("user_id","purchased_on");--> statement-breakpoint
CREATE UNIQUE INDEX "household_scenario_user_name_uidx" ON "household_scenario" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "household_scenario_user_idx" ON "household_scenario" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "household_scenario_line_user_source_uidx" ON "household_scenario_line" USING btree ("user_id","source_key");--> statement-breakpoint
CREATE INDEX "household_scenario_line_scenario_idx" ON "household_scenario_line" USING btree ("user_id","scenario_id");--> statement-breakpoint
CREATE UNIQUE INDEX "household_contract_user_identity_uidx" ON "household_service_contract" USING btree ("user_id","service","provider");--> statement-breakpoint
CREATE UNIQUE INDEX "household_contract_user_source_uidx" ON "household_service_contract" USING btree ("user_id","source_key");--> statement-breakpoint
CREATE INDEX "household_contract_user_idx" ON "household_service_contract" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "household_contract_snapshot_contract_date_uidx" ON "household_service_contract_snapshot" USING btree ("contract_id","effective_from");--> statement-breakpoint
CREATE INDEX "household_contract_snapshot_user_date_idx" ON "household_service_contract_snapshot" USING btree ("user_id","effective_from");
