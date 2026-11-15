-- Sermon topics: one list of topics with an Amharic and an English name, in
-- place of the categories and sub-categories that exist once per language.
--
-- Added: sm_topics (the list, seeded below) and sm_sermon_topics (which
-- sermons have which topics). A link starts as a suggestion and counts once an
-- admin approves it (approved_at). Nothing existing is changed: the old
-- categories, sub-categories and their links stay as they are. Safe to run twice.

CREATE TABLE IF NOT EXISTS "sm_topics" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "group_key" TEXT NOT NULL,
    "name_am" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sm_topics_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "sm_topics_slug_key" ON "sm_topics"("slug");

CREATE TABLE IF NOT EXISTS "sm_sermon_topics" (
    "id" SERIAL NOT NULL,
    "sermon_id" INTEGER NOT NULL,
    "topic_id" INTEGER NOT NULL,
    -- "ai" (suggested by Gemini) or "admin" (chosen by a person)
    "source" TEXT NOT NULL DEFAULT 'admin',
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sm_sermon_topics_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "sm_sermon_topics_sermon_id_topic_id_key" ON "sm_sermon_topics"("sermon_id", "topic_id");
CREATE INDEX IF NOT EXISTS "sm_sermon_topics_topic_id_idx" ON "sm_sermon_topics"("topic_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sm_sermon_topics_sermon_id_fkey') THEN
    ALTER TABLE "sm_sermon_topics" ADD CONSTRAINT "sm_sermon_topics_sermon_id_fkey" FOREIGN KEY ("sermon_id") REFERENCES "sm_sermons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sm_sermon_topics_topic_id_fkey') THEN
    ALTER TABLE "sm_sermon_topics" ADD CONSTRAINT "sm_sermon_topics_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "sm_topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "sm_topics" ("slug", "group_key", "name_am", "name_en", "position") VALUES
  -- Feasts and seasons, in the order of the church year
  ('new-year',            'feasts', 'አዲስ ዓመት',                 'New Year', 1),
  ('meskel',              'feasts', 'መስቀል',                     'Meskel (the Holy Cross)', 2),
  ('season-of-flowers',   'feasts', 'ዘመነ ጽጌ',                   'Season of Flowers', 3),
  ('nativity',            'feasts', 'ልደት (ገና)',                 'Nativity', 4),
  ('epiphany',            'feasts', 'ጥምቀት',                     'Epiphany (Timket)', 5),
  ('season-of-epiphany',  'feasts', 'ዘመነ አስተርእዮ',              'Season of Epiphany', 6),
  ('nineveh',             'feasts', 'ጾመ ነነዌ',                   'Fast of Nineveh', 7),
  ('great-lent',          'feasts', 'ዐቢይ ጾም',                   'Great Lent', 8),
  ('hosanna',             'feasts', 'ሆሣዕና',                     'Hosanna (Palm Sunday)', 9),
  ('holy-week',           'feasts', 'ሰሙነ ሕማማት',                'Holy Week', 10),
  ('good-friday',         'feasts', 'ስቅለት',                     'Good Friday', 11),
  ('resurrection',        'feasts', 'ትንሣኤ',                     'Resurrection (Easter)', 12),
  ('pentecost',           'feasts', 'በዓለ ኀምሳ (ጰራቅሊጦስ)',        'Pentecost', 13),
  ('apostles-fast',       'feasts', 'ጾመ ሐዋርያት',                'Apostles'' Fast', 14),
  ('transfiguration',     'feasts', 'ደብረ ታቦር',                 'Transfiguration', 15),
  ('dormition',           'feasts', 'ፍልሰታ',                     'Dormition (Filseta)', 16),
  -- Christian life
  ('repentance',          'life', 'ንስሓ',                        'Repentance', 1),
  ('fasting-prayer',      'life', 'ጾምና ጸሎት',                   'Fasting and prayer', 2),
  ('holy-communion',      'life', 'ቅዱስ ቁርባን',                  'Holy Communion', 3),
  ('love-forgiveness',    'life', 'ፍቅርና ይቅርታ',                 'Love and forgiveness', 4),
  ('faith-hope',          'life', 'እምነትና ተስፋ',                 'Faith and hope', 5),
  ('virtues',             'life', 'ምግባራት',                     'Virtues', 6),
  ('trials-perseverance', 'life', 'ፈተናና ጽናት',                  'Trials and perseverance', 7),
  ('marriage-family',     'life', 'ትዳርና ቤተሰብ',                 'Marriage and family', 8),
  ('monastic-life',       'life', 'ገዳማዊ ሕይወት',                 'Monastic life', 9),
  -- Guidance for daily life
  ('youth',               'guidance', 'ወጣትነትና ክርስትና',          'Youth and faith', 1),
  ('work-daily-life',     'guidance', 'ሥራና የዕለት ተዕለት ሕይወት',    'Work and daily life', 2),
  ('illness-grief',       'guidance', 'ሕመምና ሐዘን',               'Illness and grief', 3),
  ('service-mission',     'guidance', 'አገልግሎትና ተልእኮ',           'Service and mission', 4),
  ('social-moral',        'guidance', 'ማኅበራዊና ሥነ ምግባራዊ ጉዳዮች',   'Social and moral issues', 5),
  -- Saints and fathers
  ('st-mary',             'saints', 'ቅድስት ድንግል ማርያም',         'St Mary', 1),
  ('lives-of-saints',     'saints', 'የቅዱሳን ሕይወት',               'Lives of the saints', 2),
  ('martyrs',             'saints', 'ሰማዕታት',                     'Martyrs', 3),
  ('fathers-teaching',    'saints', 'ትምህርተ አበው',                'Teachings of the Fathers', 4),
  ('desert-fathers',      'saints', 'የበረሓ አባቶች ምክር',           'Sayings of the Desert Fathers', 5),
  -- Faith and doctrine
  ('trinity',             'doctrine', 'ምሥጢረ ሥላሴ',              'The Holy Trinity', 1),
  ('incarnation',         'doctrine', 'ምሥጢረ ሥጋዌ',              'The Incarnation', 2),
  ('baptism',             'doctrine', 'ምሥጢረ ጥምቀት',             'Baptism', 3),
  ('resurrection-of-dead','doctrine', 'ምሥጢረ ትንሣኤ ሙታን',         'Resurrection of the dead', 4),
  ('sacraments',          'doctrine', 'ምሥጢራተ ቤተ ክርስቲያን',      'The sacraments', 5),
  ('salvation',           'doctrine', 'ነገረ ድኅነት',               'Salvation', 6),
  ('church',              'doctrine', 'ነገረ ቤተ ክርስቲያን',          'The Church', 7),
  ('angels',              'doctrine', 'ነገረ መላእክት',              'The angels', 8),
  ('bible',               'doctrine', 'መጽሐፍ ቅዱስ',               'The Bible', 9)
ON CONFLICT ("slug") DO NOTHING;
