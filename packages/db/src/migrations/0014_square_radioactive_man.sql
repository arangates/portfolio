CREATE TABLE "document_archive" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"source_type" text NOT NULL,
	"source_id" text NOT NULL,
	"file_name" text NOT NULL,
	"file_hash" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"provider" text DEFAULT 'google_drive' NOT NULL,
	"provider_file_id" text,
	"provider_folder_id" text,
	"status" text DEFAULT 'processing' NOT NULL,
	"error_message" text,
	"uploaded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_archive_setting" (
	"user_id" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"root_folder_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "import_batch" ALTER COLUMN "file_contents_base64" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "document_archive" ADD CONSTRAINT "document_archive_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_archive_setting" ADD CONSTRAINT "document_archive_setting_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "document_archive_user_source_uidx" ON "document_archive" USING btree ("user_id","source_type","source_id");--> statement-breakpoint
CREATE UNIQUE INDEX "document_archive_id_user_uidx" ON "document_archive" USING btree ("id","user_id");--> statement-breakpoint
CREATE INDEX "document_archive_user_created_idx" ON "document_archive" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "document_archive_user_hash_idx" ON "document_archive" USING btree ("user_id","file_hash");