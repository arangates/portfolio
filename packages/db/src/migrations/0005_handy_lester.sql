CREATE TABLE "real_estate_property" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"owner" text NOT NULL,
	"property_type" text NOT NULL,
	"location" text,
	"notes" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "real_estate_snapshot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"property_id" uuid NOT NULL,
	"as_of" timestamp with time zone DEFAULT now() NOT NULL,
	"area_cents" numeric(30, 8) NOT NULL,
	"area_square_feet" numeric(30, 8) NOT NULL,
	"ownership_share" numeric(12, 8) NOT NULL,
	"legal_status" text DEFAULT 'unknown' NOT NULL,
	"price_per_square_foot" numeric(30, 8) NOT NULL,
	"market_value" numeric(30, 8) NOT NULL,
	"currency" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "real_estate_property" ADD CONSTRAINT "real_estate_property_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_snapshot" ADD CONSTRAINT "real_estate_snapshot_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_estate_snapshot" ADD CONSTRAINT "real_estate_snapshot_property_id_real_estate_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."real_estate_property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "real_estate_property_id_user_uidx" ON "real_estate_property" USING btree ("id","user_id");--> statement-breakpoint
ALTER TABLE "real_estate_snapshot" ADD CONSTRAINT "real_estate_snapshot_owner_fk" FOREIGN KEY ("property_id","user_id") REFERENCES "public"."real_estate_property"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "real_estate_property_user_type_idx" ON "real_estate_property" USING btree ("user_id","property_type");--> statement-breakpoint
CREATE UNIQUE INDEX "real_estate_property_user_identity_uidx" ON "real_estate_property" USING btree ("user_id","name","owner","location");--> statement-breakpoint
CREATE UNIQUE INDEX "real_estate_snapshot_property_asof_uidx" ON "real_estate_snapshot" USING btree ("property_id","as_of");--> statement-breakpoint
CREATE INDEX "real_estate_snapshot_user_asof_idx" ON "real_estate_snapshot" USING btree ("user_id","as_of");
