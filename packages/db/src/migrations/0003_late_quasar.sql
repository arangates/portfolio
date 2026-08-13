ALTER TABLE "import_row" ADD COLUMN "user_id" text;--> statement-breakpoint
UPDATE "import_row" AS "row"
SET "user_id" = "batch"."user_id"
FROM "import_batch" AS "batch"
WHERE "row"."batch_id" = "batch"."id";--> statement-breakpoint
ALTER TABLE "import_row" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "portfolio_source_id_user_uidx" ON "portfolio_source" USING btree ("id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "import_batch_id_user_uidx" ON "import_batch" USING btree ("id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "instrument_id_user_uidx" ON "instrument" USING btree ("id","user_id");--> statement-breakpoint
CREATE INDEX "import_row_user_idx" ON "import_row" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "import_batch" ADD CONSTRAINT "import_batch_source_owner_fk" FOREIGN KEY ("source_id","user_id") REFERENCES "public"."portfolio_source"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_row" ADD CONSTRAINT "import_row_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_row" ADD CONSTRAINT "import_row_batch_owner_fk" FOREIGN KEY ("batch_id","user_id") REFERENCES "public"."import_batch"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entry" ADD CONSTRAINT "ledger_entry_source_owner_fk" FOREIGN KEY ("source_id","user_id") REFERENCES "public"."portfolio_source"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entry" ADD CONSTRAINT "ledger_entry_batch_owner_fk" FOREIGN KEY ("batch_id","user_id") REFERENCES "public"."import_batch"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entry" ADD CONSTRAINT "ledger_entry_instrument_owner_fk" FOREIGN KEY ("instrument_id","user_id") REFERENCES "public"."instrument"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_snapshot" ADD CONSTRAINT "position_snapshot_source_owner_fk" FOREIGN KEY ("source_id","user_id") REFERENCES "public"."portfolio_source"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_snapshot" ADD CONSTRAINT "position_snapshot_batch_owner_fk" FOREIGN KEY ("batch_id","user_id") REFERENCES "public"."import_batch"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_snapshot" ADD CONSTRAINT "position_snapshot_instrument_owner_fk" FOREIGN KEY ("instrument_id","user_id") REFERENCES "public"."instrument"("id","user_id") ON DELETE restrict ON UPDATE no action;
