CREATE TABLE "bank_statement_import" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"account_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"file_name" text NOT NULL,
	"file_hash" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"parser_version" text NOT NULL,
	"period_start" timestamp with time zone,
	"period_end" timestamp with time zone,
	"opening_balance" numeric(30, 8),
	"closing_balance" numeric(30, 8),
	"debit_total" numeric(30, 8) NOT NULL,
	"credit_total" numeric(30, 8) NOT NULL,
	"row_count" integer DEFAULT 0 NOT NULL,
	"inserted_rows" integer DEFAULT 0 NOT NULL,
	"skipped_rows" integer DEFAULT 0 NOT NULL,
	"validation_status" text NOT NULL,
	"validation_issues" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'processing' NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "bank_transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"account_id" uuid NOT NULL,
	"import_id" uuid NOT NULL,
	"transaction_hash" text NOT NULL,
	"booked_at" timestamp with time zone NOT NULL,
	"value_at" timestamp with time zone,
	"amount" numeric(30, 8) NOT NULL,
	"currency" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"transaction_type" text,
	"provider_code" text,
	"counterparty_name" text,
	"counterparty_account_last4" text,
	"category" text NOT NULL,
	"category_source" text DEFAULT 'rule' NOT NULL,
	"category_confidence" numeric(5, 4) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bank_account" ADD COLUMN "ownership_type" text DEFAULT 'personal' NOT NULL;--> statement-breakpoint
ALTER TABLE "bank_account" ADD COLUMN "account_fingerprint" text;--> statement-breakpoint
CREATE UNIQUE INDEX "bank_statement_import_id_user_uidx" ON "bank_statement_import" USING btree ("id","user_id");--> statement-breakpoint
ALTER TABLE "bank_statement_import" ADD CONSTRAINT "bank_statement_import_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_statement_import" ADD CONSTRAINT "bank_statement_import_account_id_bank_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."bank_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_statement_import" ADD CONSTRAINT "bank_statement_import_account_owner_fk" FOREIGN KEY ("account_id","user_id") REFERENCES "public"."bank_account"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transaction" ADD CONSTRAINT "bank_transaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transaction" ADD CONSTRAINT "bank_transaction_account_id_bank_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."bank_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transaction" ADD CONSTRAINT "bank_transaction_import_id_bank_statement_import_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."bank_statement_import"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transaction" ADD CONSTRAINT "bank_transaction_account_owner_fk" FOREIGN KEY ("account_id","user_id") REFERENCES "public"."bank_account"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transaction" ADD CONSTRAINT "bank_transaction_import_owner_fk" FOREIGN KEY ("import_id","user_id") REFERENCES "public"."bank_statement_import"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bank_statement_import_user_hash_uidx" ON "bank_statement_import" USING btree ("user_id","file_hash");--> statement-breakpoint
CREATE INDEX "bank_statement_import_user_period_idx" ON "bank_statement_import" USING btree ("user_id","period_end");--> statement-breakpoint
CREATE UNIQUE INDEX "bank_transaction_user_account_hash_uidx" ON "bank_transaction" USING btree ("user_id","account_id","transaction_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "bank_transaction_id_user_uidx" ON "bank_transaction" USING btree ("id","user_id");--> statement-breakpoint
CREATE INDEX "bank_transaction_user_booked_idx" ON "bank_transaction" USING btree ("user_id","booked_at");--> statement-breakpoint
CREATE INDEX "bank_transaction_user_category_idx" ON "bank_transaction" USING btree ("user_id","category");--> statement-breakpoint
CREATE UNIQUE INDEX "bank_account_user_fingerprint_uidx" ON "bank_account" USING btree ("user_id","account_fingerprint");
