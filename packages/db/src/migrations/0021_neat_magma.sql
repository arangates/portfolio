CREATE TYPE "public"."bank_account_type" AS ENUM('NRE', 'NRO', 'PIS', 'SALARY', 'RESIDENT SB', 'Personal current account', 'Joint current account', 'JOINT SAVINGS', 'NEO', 'RDG', 'Broker cash', 'Current account', 'Other');--> statement-breakpoint
CREATE TYPE "public"."manual_asset_type" AS ENUM('Vehicle', 'Insurance', 'Provident fund', 'Pension', 'Bond', 'Cash', 'Collectible', 'Business interest', 'Real estate', 'Other');--> statement-breakpoint
CREATE TYPE "public"."bank_name" AS ENUM('SBI', 'HDFC', 'ICICI', 'Kotak', 'INDUSIND', 'Axis Bank', 'Bank of Baroda', 'Canara Bank', 'IDFC FIRST', 'Yes Bank', 'ABN AMRO', 'ING', 'Rabobank', 'Wise', 'Bunq', 'N26', 'Revolut', 'PNB', 'UNION', 'RBI', 'Other');--> statement-breakpoint
CREATE TYPE "public"."commodity_type" AS ENUM('Gold', 'Silver', 'Brass', 'Platinum', 'Palladium', 'Other');--> statement-breakpoint
CREATE TYPE "public"."currency_code" AS ENUM('INR', 'EUR', 'USD', 'GBP', 'CHF', 'SGD', 'AED', 'JPY', 'CAD', 'AUD');--> statement-breakpoint
CREATE TYPE "public"."deposit_type" AS ENUM('NRE', 'NRO', 'RESIDENT', 'RECURRING', 'TAX_SAVER', 'CORPORATE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."risk_level" AS ENUM('low', 'moderate', 'high');--> statement-breakpoint
UPDATE "bank_account" SET "institution" = CASE "institution"
  WHEN 'KOTAK' THEN 'Kotak' WHEN 'CANARA' THEN 'Canara Bank'
  WHEN 'AXIS' THEN 'Axis Bank' WHEN 'BOB' THEN 'Bank of Baroda'
  ELSE "institution" END
WHERE "institution" IN ('KOTAK', 'CANARA', 'AXIS', 'BOB');--> statement-breakpoint
UPDATE "fixed_deposit" SET "bank" = 'INDUSIND' WHERE "bank" = 'Indusind';--> statement-breakpoint
ALTER TABLE "bank_account" ALTER COLUMN "institution" SET DATA TYPE "public"."bank_name" USING "institution"::"public"."bank_name";--> statement-breakpoint
ALTER TABLE "bank_account" ALTER COLUMN "account_type" SET DATA TYPE "public"."bank_account_type" USING "account_type"::"public"."bank_account_type";--> statement-breakpoint
ALTER TABLE "bank_account" ALTER COLUMN "currency" SET DATA TYPE "public"."currency_code" USING "currency"::"public"."currency_code";--> statement-breakpoint
ALTER TABLE "commodity_holding" ALTER COLUMN "commodity_type" SET DATA TYPE "public"."commodity_type" USING "commodity_type"::"public"."commodity_type";--> statement-breakpoint
ALTER TABLE "commodity_snapshot" ALTER COLUMN "currency" SET DATA TYPE "public"."currency_code" USING "currency"::"public"."currency_code";--> statement-breakpoint
ALTER TABLE "fixed_deposit" ALTER COLUMN "bank" SET DATA TYPE "public"."bank_name" USING "bank"::"public"."bank_name";--> statement-breakpoint
ALTER TABLE "fixed_deposit" ALTER COLUMN "deposit_type" SET DATA TYPE "public"."deposit_type" USING "deposit_type"::"public"."deposit_type";--> statement-breakpoint
ALTER TABLE "fixed_deposit" ALTER COLUMN "currency" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "fixed_deposit" ALTER COLUMN "currency" SET DATA TYPE "public"."currency_code" USING "currency"::"public"."currency_code";--> statement-breakpoint
ALTER TABLE "fixed_deposit" ALTER COLUMN "currency" SET DEFAULT 'INR'::"public"."currency_code";--> statement-breakpoint
ALTER TABLE "manual_asset" ALTER COLUMN "asset_type" SET DATA TYPE "public"."manual_asset_type" USING "asset_type"::"public"."manual_asset_type";--> statement-breakpoint
ALTER TABLE "manual_asset" ALTER COLUMN "risk_level" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "manual_asset" ALTER COLUMN "risk_level" SET DATA TYPE "public"."risk_level" USING "risk_level"::"public"."risk_level";--> statement-breakpoint
ALTER TABLE "manual_asset" ALTER COLUMN "risk_level" SET DEFAULT 'moderate'::"public"."risk_level";--> statement-breakpoint
ALTER TABLE "manual_asset_snapshot" ALTER COLUMN "currency" SET DATA TYPE "public"."currency_code" USING "currency"::"public"."currency_code";
