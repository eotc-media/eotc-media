-- Channels and singers move from id URLs to slug URLs.
--
-- hm_channels.slug already existed and was already required. This gives
-- hm_singers the same, and makes sm_channels.slug required now that every row
-- has one.

-- ── hm_singers.slug ──────────────────────────────────────────────────────────
ALTER TABLE "hm_singers" ADD COLUMN IF NOT EXISTS "slug" TEXT;

-- Spaces become hyphens; anything that is neither a letter, a digit nor a
-- hyphen is dropped. [:alnum:] is locale-aware under UTF-8, so Ge'ez survives
-- and a singer's name stays readable in the address bar.
UPDATE "hm_singers"
SET "slug" = regexp_replace(
               regexp_replace(btrim("name"), '\s+', '-', 'g'),
               '[^[:alnum:]-]', '', 'g'
             )
WHERE "slug" IS NULL;

-- A name that reduced to nothing, or to nothing but punctuation.
UPDATE "hm_singers" SET "slug" = 'singer-' || "id"
WHERE "slug" IS NULL OR btrim("slug", '-') = '';

-- Two singers can share a name. Only the duplicates carry an id.
UPDATE "hm_singers" s
SET "slug" = s."slug" || '-' || s."id"
WHERE EXISTS (
  SELECT 1 FROM "hm_singers" t WHERE t."slug" = s."slug" AND t."id" <> s."id"
);

ALTER TABLE "hm_singers" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "hm_singers_slug_key" ON "hm_singers"("slug");

-- ── sm_channels.slug ─────────────────────────────────────────────────────────
-- Every row is expected to have one already; this only covers the case where
-- one does not, so the NOT NULL cannot fail.
UPDATE "sm_channels" SET "slug" = 'channel-' || "id"
WHERE "slug" IS NULL OR btrim("slug") = '';

ALTER TABLE "sm_channels" ALTER COLUMN "slug" SET NOT NULL;
