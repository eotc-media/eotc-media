-- Each member's name in Amharic and English letters, for the greeting.
-- Additive only: two new, empty, optional columns on users. Safe to run twice.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "name_am" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "name_en" TEXT;
