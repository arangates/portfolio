CREATE TABLE "capital_allocation_target" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"bucket" text NOT NULL,
	"target_weight" numeric(12, 8) NOT NULL,
	"minimum_weight" numeric(12, 8) NOT NULL,
	"maximum_weight" numeric(12, 8) NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "capital_deployment_policy" (
	"user_id" text PRIMARY KEY NOT NULL,
	"staging_instrument_id" uuid,
	"monthly_deployment_amount" numeric(30, 8) DEFAULT '0' NOT NULL,
	"deployment_currency" text DEFAULT 'INR' NOT NULL,
	"reserve_floor" numeric(30, 8) DEFAULT '0' NOT NULL,
	"fixed_deposit_horizon_days" integer DEFAULT 365 NOT NULL,
	"transfer_match_window_days" integer DEFAULT 7 NOT NULL,
	"transfer_match_tolerance" numeric(12, 8) DEFAULT '0.15' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "capital_allocation_target" ADD CONSTRAINT "capital_allocation_target_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capital_deployment_policy" ADD CONSTRAINT "capital_deployment_policy_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capital_deployment_policy" ADD CONSTRAINT "capital_deployment_policy_staging_instrument_id_instrument_id_fk" FOREIGN KEY ("staging_instrument_id") REFERENCES "public"."instrument"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capital_deployment_policy" ADD CONSTRAINT "capital_deployment_policy_staging_owner_fk" FOREIGN KEY ("staging_instrument_id","user_id") REFERENCES "public"."instrument"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "capital_allocation_target_user_bucket_uidx" ON "capital_allocation_target" USING btree ("user_id","bucket");--> statement-breakpoint
CREATE UNIQUE INDEX "capital_allocation_target_id_user_uidx" ON "capital_allocation_target" USING btree ("id","user_id");--> statement-breakpoint
CREATE INDEX "capital_allocation_target_user_idx" ON "capital_allocation_target" USING btree ("user_id");