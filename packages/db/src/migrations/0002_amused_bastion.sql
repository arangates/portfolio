CREATE UNIQUE INDEX "bank_account_id_user_uidx" ON "bank_account" USING btree ("id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "commodity_holding_id_user_uidx" ON "commodity_holding" USING btree ("id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fixed_deposit_id_user_uidx" ON "fixed_deposit" USING btree ("id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "manual_asset_id_user_uidx" ON "manual_asset" USING btree ("id","user_id");--> statement-breakpoint
ALTER TABLE "bank_balance_snapshot" ADD CONSTRAINT "bank_balance_account_owner_fk" FOREIGN KEY ("account_id","user_id") REFERENCES "public"."bank_account"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commodity_snapshot" ADD CONSTRAINT "commodity_snapshot_owner_fk" FOREIGN KEY ("commodity_holding_id","user_id") REFERENCES "public"."commodity_holding"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixed_deposit_snapshot" ADD CONSTRAINT "fixed_deposit_snapshot_owner_fk" FOREIGN KEY ("fixed_deposit_id","user_id") REFERENCES "public"."fixed_deposit"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_asset_snapshot" ADD CONSTRAINT "manual_asset_snapshot_owner_fk" FOREIGN KEY ("asset_id","user_id") REFERENCES "public"."manual_asset"("id","user_id") ON DELETE cascade ON UPDATE no action;
