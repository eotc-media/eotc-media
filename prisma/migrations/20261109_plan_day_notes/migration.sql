-- A note per reading plan day. Additive only: one new, empty, nullable column;
-- no existing data changes. Safe to run twice.
ALTER TABLE "reading_plan_days" ADD COLUMN IF NOT EXISTS "note" TEXT;
