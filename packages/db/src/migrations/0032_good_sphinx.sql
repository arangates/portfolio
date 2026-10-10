CREATE TABLE "zerodha_connection" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text NOT NULL,
	"public_token" text,
	"login_time" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_sync_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "zerodha_connection" ADD CONSTRAINT "zerodha_connection_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "zerodha_connection_user_uidx" ON "zerodha_connection" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "zerodha_connection_expires_idx" ON "zerodha_connection" USING btree ("expires_at");