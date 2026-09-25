CREATE TABLE "evaluation_alert" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"evaluation_id" uuid NOT NULL,
	"category" text NOT NULL,
	"severity" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"action_label" text,
	"action_href" text,
	"alert_key" text NOT NULL,
	"acknowledged_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_evaluation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"trigger" text NOT NULL,
	"model" text DEFAULT 'typesafe-ai/jev' NOT NULL,
	"liquidity_score" integer,
	"fire_score" integer,
	"deployment_score" integer,
	"evidence_score" integer,
	"tax_score" integer,
	"overall_score" integer,
	"evaluation" jsonb NOT NULL,
	"alerts" jsonb DEFAULT '[]' NOT NULL,
	"context_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "evaluation_alert" ADD CONSTRAINT "evaluation_alert_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_alert" ADD CONSTRAINT "evaluation_alert_evaluation_id_financial_evaluation_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."financial_evaluation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_evaluation" ADD CONSTRAINT "financial_evaluation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "evaluation_alert_user_created_idx" ON "evaluation_alert" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "evaluation_alert_active_key_uidx" ON "evaluation_alert" USING btree ("user_id","alert_key","evaluation_id");--> statement-breakpoint
CREATE INDEX "evaluation_user_created_idx" ON "financial_evaluation" USING btree ("user_id","created_at");