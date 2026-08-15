CREATE TABLE "family_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"relationship" text NOT NULL,
	"birth_date" date,
	"linked_to_portfolio" boolean DEFAULT false NOT NULL,
	"net_worth" numeric(30, 8) DEFAULT '0' NOT NULL,
	"investable_assets" numeric(30, 8) DEFAULT '0' NOT NULL,
	"annual_net_income" numeric(30, 8) DEFAULT '0' NOT NULL,
	"currency" text NOT NULL,
	"included_in_plan" boolean DEFAULT true NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fire_expense" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"member_id" uuid,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"monthly_amount" numeric(30, 8) NOT NULL,
	"currency" text NOT NULL,
	"essential" boolean DEFAULT true NOT NULL,
	"start_year" integer,
	"end_year" integer,
	"inflation_rate_override" numeric(12, 8),
	"notes" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fire_income_stream" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"member_id" uuid,
	"name" text NOT NULL,
	"income_type" text NOT NULL,
	"annual_amount" numeric(30, 8) NOT NULL,
	"currency" text NOT NULL,
	"start_year" integer NOT NULL,
	"end_year" integer,
	"inflation_linked" boolean DEFAULT true NOT NULL,
	"notes" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fire_one_time_cost" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"member_id" uuid,
	"name" text NOT NULL,
	"amount" numeric(30, 8) NOT NULL,
	"currency" text NOT NULL,
	"planned_year" integer NOT NULL,
	"priority" text DEFAULT 'important' NOT NULL,
	"inflation_linked" boolean DEFAULT true NOT NULL,
	"notes" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fire_profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"birth_date" date,
	"planned_retirement_year" integer NOT NULL,
	"plan_end_age" integer DEFAULT 95 NOT NULL,
	"inflation_rate" numeric(12, 8) DEFAULT '0.03' NOT NULL,
	"expected_return_rate" numeric(12, 8) DEFAULT '0.06' NOT NULL,
	"return_volatility" numeric(12, 8) DEFAULT '0.12' NOT NULL,
	"safe_withdrawal_rate" numeric(12, 8) DEFAULT '0.035' NOT NULL,
	"safety_buffer" numeric(12, 8) DEFAULT '0.15' NOT NULL,
	"annual_savings" numeric(30, 8) DEFAULT '0' NOT NULL,
	"savings_currency" text DEFAULT 'INR' NOT NULL,
	"target_legacy" numeric(30, 8) DEFAULT '0' NOT NULL,
	"spending_policy" text DEFAULT 'essential_floor' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fire_scenario" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"spending_multiplier" numeric(12, 8) DEFAULT '1' NOT NULL,
	"buffer_rate" numeric(12, 8) DEFAULT '0' NOT NULL,
	"return_rate_override" numeric(12, 8),
	"inflation_rate_override" numeric(12, 8),
	"retirement_year_override" integer,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "family_member_id_user_uidx" ON "family_member" USING btree ("id","user_id");--> statement-breakpoint
ALTER TABLE "family_member" ADD CONSTRAINT "family_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fire_expense" ADD CONSTRAINT "fire_expense_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fire_expense" ADD CONSTRAINT "fire_expense_member_id_family_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."family_member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fire_expense" ADD CONSTRAINT "fire_expense_member_owner_fk" FOREIGN KEY ("member_id","user_id") REFERENCES "public"."family_member"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fire_income_stream" ADD CONSTRAINT "fire_income_stream_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fire_income_stream" ADD CONSTRAINT "fire_income_stream_member_id_family_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."family_member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fire_income_stream" ADD CONSTRAINT "fire_income_stream_member_owner_fk" FOREIGN KEY ("member_id","user_id") REFERENCES "public"."family_member"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fire_one_time_cost" ADD CONSTRAINT "fire_one_time_cost_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fire_one_time_cost" ADD CONSTRAINT "fire_one_time_cost_member_id_family_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."family_member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fire_one_time_cost" ADD CONSTRAINT "fire_one_time_cost_member_owner_fk" FOREIGN KEY ("member_id","user_id") REFERENCES "public"."family_member"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fire_profile" ADD CONSTRAINT "fire_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fire_scenario" ADD CONSTRAINT "fire_scenario_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "family_member_user_identity_uidx" ON "family_member" USING btree ("user_id","name","relationship");--> statement-breakpoint
CREATE INDEX "family_member_user_idx" ON "family_member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "fire_expense_user_category_idx" ON "fire_expense" USING btree ("user_id","category");--> statement-breakpoint
CREATE UNIQUE INDEX "fire_expense_id_user_uidx" ON "fire_expense" USING btree ("id","user_id");--> statement-breakpoint
CREATE INDEX "fire_income_stream_user_year_idx" ON "fire_income_stream" USING btree ("user_id","start_year");--> statement-breakpoint
CREATE UNIQUE INDEX "fire_income_stream_id_user_uidx" ON "fire_income_stream" USING btree ("id","user_id");--> statement-breakpoint
CREATE INDEX "fire_one_time_cost_user_year_idx" ON "fire_one_time_cost" USING btree ("user_id","planned_year");--> statement-breakpoint
CREATE UNIQUE INDEX "fire_one_time_cost_id_user_uidx" ON "fire_one_time_cost" USING btree ("id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fire_scenario_user_name_uidx" ON "fire_scenario" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "fire_scenario_user_idx" ON "fire_scenario" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fire_scenario_id_user_uidx" ON "fire_scenario" USING btree ("id","user_id");
