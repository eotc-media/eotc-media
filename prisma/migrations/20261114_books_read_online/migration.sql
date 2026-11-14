-- Read Church Fathers books online, from Books and from reading plans, with
-- the text in R2 rather than the database.
--
-- Added: three empty, optional columns on cb_books (a book's online text);
-- two tables (where a member stopped reading, their notes per chapter).
-- cf_sections.body becomes optional, as nothing writes it any more; its text
-- stays until it is confirmed in R2. Dropped: cf_sections.title_am, body_am and
-- body_am_approved, which hold no data (no translation was ever saved) and are
-- replaced by a file per work in R2. Safe to run twice.

ALTER TABLE "cb_books" ADD COLUMN IF NOT EXISTS "cf_work_id" INTEGER;
ALTER TABLE "cb_books" ADD COLUMN IF NOT EXISTS "cf_from_section" INTEGER;
ALTER TABLE "cb_books" ADD COLUMN IF NOT EXISTS "cf_to_section" INTEGER;

CREATE TABLE IF NOT EXISTS "cf_reading_progress" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "work_id" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "cf_reading_progress_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "cf_reading_progress_user_id_work_id_key" ON "cf_reading_progress"("user_id", "work_id");

CREATE TABLE IF NOT EXISTS "cf_section_notes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "section_id" INTEGER NOT NULL,
    "note" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "cf_section_notes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "cf_section_notes_user_id_section_id_key" ON "cf_section_notes"("user_id", "section_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cb_books_cf_work_id_fkey') THEN
    ALTER TABLE "cb_books" ADD CONSTRAINT "cb_books_cf_work_id_fkey" FOREIGN KEY ("cf_work_id") REFERENCES "cf_works"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cf_reading_progress_user_id_fkey') THEN
    ALTER TABLE "cf_reading_progress" ADD CONSTRAINT "cf_reading_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cf_reading_progress_work_id_fkey') THEN
    ALTER TABLE "cf_reading_progress" ADD CONSTRAINT "cf_reading_progress_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "cf_works"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cf_section_notes_user_id_fkey') THEN
    ALTER TABLE "cf_section_notes" ADD CONSTRAINT "cf_section_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cf_section_notes_section_id_fkey') THEN
    ALTER TABLE "cf_section_notes" ADD CONSTRAINT "cf_section_notes_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "cf_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "cf_sections" ALTER COLUMN "body" DROP NOT NULL;
ALTER TABLE "cf_sections" DROP COLUMN IF EXISTS "title_am";
ALTER TABLE "cf_sections" DROP COLUMN IF EXISTS "body_am";
ALTER TABLE "cf_sections" DROP COLUMN IF EXISTS "body_am_approved";
