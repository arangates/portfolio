ALTER TABLE "notification_preference" ADD COLUMN "in_app_enabled" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "notification_preference" ADD COLUMN "push_enabled" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "notification_preference" ADD COLUMN "email_enabled" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
CREATE TABLE "in_app_notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"delivery_key" text,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"url" text DEFAULT '/dashboard' NOT NULL,
	"read_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "in_app_notification" ADD CONSTRAINT "in_app_notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "in_app_notification_user_created_idx" ON "in_app_notification" USING btree ("user_id","created_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "in_app_notification_delivery_uidx" ON "in_app_notification" USING btree ("user_id","delivery_key");