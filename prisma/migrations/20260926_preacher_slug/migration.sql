-- Preachers become addressable, the way singers are: sm_preachers gains the
-- slug that /sermons/preacher/<slug> reads. Derived exactly as the singers'
-- were in 20260926_slug_routes.

ALTER TABLE "sm_preachers" ADD COLUMN IF NOT EXISTS "slug" TEXT;

UPDATE "sm_preachers"
SET "slug" = regexp_replace(
               regexp_replace(btrim("name"), '\s+', '-', 'g'),
               '[^[:alnum:]-]', '', 'g'
             )
WHERE "slug" IS NULL;

UPDATE "sm_preachers" SET "slug" = 'preacher-' || "id"
WHERE "slug" IS NULL OR btrim("slug", '-') = '';

UPDATE "sm_preachers" p
SET "slug" = p."slug" || '-' || p."id"
WHERE EXISTS (
  SELECT 1 FROM "sm_preachers" t WHERE t."slug" = p."slug" AND t."id" <> p."id"
);

ALTER TABLE "sm_preachers" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "sm_preachers_slug_key" ON "sm_preachers"("slug");
