-- The Church Fathers text now lives in R2 (library/<slug>/en.json). Before
-- this ran, all 358 chapters held here were checked identical to the text in
-- R2 (fingerprint 10094823abea246ee06c47194d8dfada, and all 823 chapters read
-- back from the live site). This removes the old copy. Safe to run twice.
ALTER TABLE "cf_sections" DROP COLUMN IF EXISTS "body";
