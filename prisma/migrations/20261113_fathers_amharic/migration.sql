-- Amharic translations for the Church Fathers library. Additive only: three
-- new columns on cf_sections, empty / false for every existing row; nothing
-- else changes. Safe to run twice.
ALTER TABLE "cf_sections" ADD COLUMN IF NOT EXISTS "title_am" TEXT;
ALTER TABLE "cf_sections" ADD COLUMN IF NOT EXISTS "body_am" TEXT;
ALTER TABLE "cf_sections" ADD COLUMN IF NOT EXISTS "body_am_approved" BOOLEAN NOT NULL DEFAULT false;
