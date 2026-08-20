CREATE TABLE "commodity_inventory_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"commodity_holding_id" uuid NOT NULL,
	"name" text NOT NULL,
	"item_count" numeric(20, 4) DEFAULT '1' NOT NULL,
	"count_unit" text DEFAULT 'piece' NOT NULL,
	"owner_label" text,
	"provenance" text,
	"location" text,
	"eligible_for_fire" boolean DEFAULT false NOT NULL,
	"notes" text,
	"source_key" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commodity_inventory_snapshot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"item_id" uuid NOT NULL,
	"as_of" timestamp with time zone DEFAULT now() NOT NULL,
	"gross_weight_grams" numeric(30, 8),
	"purity_fraction" numeric(12, 8),
	"ownership_share" numeric(12, 8),
	"liquidation_factor" numeric(12, 8),
	"appraisal_value" numeric(30, 8),
	"appraisal_currency" text,
	"source" text DEFAULT 'manual' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commodity_inventory_item" ADD CONSTRAINT "commodity_inventory_item_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commodity_inventory_item" ADD CONSTRAINT "commodity_inventory_item_commodity_holding_id_commodity_holding_id_fk" FOREIGN KEY ("commodity_holding_id") REFERENCES "public"."commodity_holding"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commodity_inventory_item" ADD CONSTRAINT "commodity_inventory_item_holding_owner_fk" FOREIGN KEY ("commodity_holding_id","user_id") REFERENCES "public"."commodity_holding"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "commodity_inventory_item_id_user_uidx" ON "commodity_inventory_item" USING btree ("id","user_id");--> statement-breakpoint
ALTER TABLE "commodity_inventory_snapshot" ADD CONSTRAINT "commodity_inventory_snapshot_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commodity_inventory_snapshot" ADD CONSTRAINT "commodity_inventory_snapshot_item_id_commodity_inventory_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."commodity_inventory_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commodity_inventory_snapshot" ADD CONSTRAINT "commodity_inventory_snapshot_owner_fk" FOREIGN KEY ("item_id","user_id") REFERENCES "public"."commodity_inventory_item"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "commodity_inventory_item_user_source_uidx" ON "commodity_inventory_item" USING btree ("user_id","source_key");--> statement-breakpoint
CREATE INDEX "commodity_inventory_item_user_holding_idx" ON "commodity_inventory_item" USING btree ("user_id","commodity_holding_id");--> statement-breakpoint
CREATE UNIQUE INDEX "commodity_inventory_snapshot_item_asof_uidx" ON "commodity_inventory_snapshot" USING btree ("item_id","as_of");--> statement-breakpoint
CREATE INDEX "commodity_inventory_snapshot_user_asof_idx" ON "commodity_inventory_snapshot" USING btree ("user_id","as_of");
