-- Reading plans: a plan, and one row per day of it.
--
-- Additive only. Guarded so pasting it into the SQL Editor a second time is a
-- no-op rather than an error.

CREATE TABLE IF NOT EXISTS "reading_plans" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'bible',
    "config" JSONB NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "total_days" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reading_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "reading_plan_days" (
    "id" SERIAL NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "day_number" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "readings" JSONB NOT NULL,
    "completed_at" TIMESTAMP(3),
    CONSTRAINT "reading_plan_days_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "reading_plans_user_id_status_idx" ON "reading_plans"("user_id", "status");
CREATE INDEX IF NOT EXISTS "reading_plan_days_plan_id_date_idx" ON "reading_plan_days"("plan_id", "date");
CREATE UNIQUE INDEX IF NOT EXISTS "reading_plan_days_plan_id_day_number_key" ON "reading_plan_days"("plan_id", "day_number");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reading_plans_user_id_fkey') THEN
    ALTER TABLE "reading_plans" ADD CONSTRAINT "reading_plans_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reading_plan_days_plan_id_fkey') THEN
    ALTER TABLE "reading_plan_days" ADD CONSTRAINT "reading_plan_days_plan_id_fkey"
      FOREIGN KEY ("plan_id") REFERENCES "reading_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
