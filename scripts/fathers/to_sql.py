"""Turn extract.py's JSON into a migration that creates and fills the library.

    python3 -I scripts/fathers/extract.py <dir> > fathers.json
    python3 -I scripts/fathers/to_sql.py fathers.json > prisma/migrations/<name>/migration.sql

The SQL only adds: CREATE TABLE IF NOT EXISTS, and inserts that skip rows
already present, so it is safe to run twice and never changes existing data.
"""

import json
import sys

# Shelf order is the suggested reading order: shortest and most approachable
# first. Amharic titles and descriptions are drafts for the owner to correct.
META = {
    "didache": dict(
        short="Didache", short_am="ዲዳኬ",
        title="The Didache (Teaching of the Twelve Apostles)", title_am="የአሥራ ሁለቱ ሐዋርያት ትምህርት (ዲዳኬ)",
        author="The early Church", author_am="የጥንቷ ቤተ ክርስቲያን",
        description="The oldest Christian handbook: the Two Ways of life and death, then baptism, fasting, prayer and the Eucharist. A short, simple place to start.",
        description_am="ጥንታዊው የክርስትና መመሪያ፤ ስለ ሕይወትና ሞት ሁለቱ መንገዶች፣ ስለ ጥምቀት፣ ጾም፣ ጸሎትና ቁርባን። ለመጀመር ቀላልና አጭር።",
    ),
    "diognetus": dict(
        short="To Diognetus", short_am="ወደ ዲዮግኔጦስ",
        title="The Letter to Diognetus", title_am="መልእክት ወደ ዲዮግኔጦስ",
        author="Mathetes (\"a disciple\")", author_am="ማቴቴስ (\"ደቀ መዝሙር\")",
        description="A beautiful defence of the faith to a pagan inquirer, best known for its picture of Christians as the soul of the world.",
        description_am="ለአሕዛብ ጠያቂ የተጻፈ የእምነት መከላከያ፤ ክርስቲያኖችን የዓለም ነፍስ ብሎ በመግለጹ ይታወቃል።",
    ),
    "polycarp-philippians": dict(
        short="Polycarp to the Philippians", short_am="ፖሊካርፐስ ወደ ፊልጵስዩስ",
        title="Letter to the Philippians", title_am="መልእክት ወደ ፊልጵስዩስ ሰዎች",
        author="St Polycarp of Smyrna", author_am="ቅዱስ ፖሊካርፐስ ዘሰምርኔስ",
        description="A pastoral letter from a disciple of St John the Apostle: righteousness, patience and steadfast faith.",
        description_am="የሐዋርያው ቅዱስ ዮሐንስ ደቀ መዝሙር የጻፈው የእረኝነት መልእክት፤ ስለ ጽድቅ፣ ትዕግሥትና ጽኑ እምነት።",
    ),
    "martyrdom-of-polycarp": dict(
        short="Martyrdom of Polycarp", short_am="የፖሊካርፐስ ሰማዕትነት",
        title="The Martyrdom of Polycarp", title_am="የቅዱስ ፖሊካርፐስ ሰማዕትነት",
        author="The Church of Smyrna", author_am="የሰምርኔስ ቤተ ክርስቲያን",
        description="The earliest account of a Christian martyrdom outside the Bible, written by eyewitnesses: \"Eighty and six years have I served Him.\"",
        description_am="ከመጽሐፍ ቅዱስ ውጪ የመጀመሪያው የሰማዕትነት ታሪክ፣ በዓይን ምስክሮች የተጻፈ፤ «ሰማንያ ስድስት ዓመት አገለገልኩት።»",
    ),
    "ignatius": dict(
        short="Ignatius", short_am="አግናጥዮስ",
        title="The Seven Letters", title_am="ሰባቱ መልእክታት",
        author="St Ignatius of Antioch", author_am="ቅዱስ አግናጥዮስ ዘአንጾኪያ",
        description="Written on the road to his martyrdom in Rome: unity with the bishop, the true Incarnation, the Eucharist, and longing for Christ.",
        description_am="ወደ ሮም ለሰማዕትነት ሲሄድ የጻፋቸው፤ ስለ አንድነት፣ ስለ ሥጋዌ፣ ስለ ቅዱስ ቁርባንና ክርስቶስን ስለ መናፈቅ።",
    ),
    "1-clement": dict(
        short="1 Clement", short_am="1 ቀሌምንጦስ",
        title="First Letter to the Corinthians", title_am="የመጀመሪያ መልእክት ወደ ቆሮንቶስ ሰዎች",
        author="St Clement of Rome", author_am="ቅዱስ ቀሌምንጦስ ዘሮም",
        description="A call to peace and humility for a church torn by division, rich in examples from the Scriptures.",
        description_am="በመለያየት ለተጎዳች ቤተ ክርስቲያን የሰላምና የትሕትና ጥሪ፤ ከመጻሕፍት በተወሰዱ ምሳሌዎች የተሞላ።",
    ),
    "barnabas": dict(
        short="Barnabas", short_am="በርናባስ",
        title="The Letter of Barnabas", title_am="የበርናባስ መልእክት",
        author="Attributed to Barnabas", author_am="ለበርናባስ የተሰጠ",
        description="Reads the Old Testament as pointing to Christ, and closes with the Two Ways of light and darkness.",
        description_am="ብሉይ ኪዳንን ወደ ክርስቶስ እንደሚያመለክት ያነባል፤ በብርሃንና በጨለማ ሁለቱ መንገዶች ይደመድማል።",
    ),
    "hermas": dict(
        short="Hermas", short_am="ሄርማ",
        title="The Shepherd of Hermas", title_am="የሄርማ እረኛ",
        author="Hermas", author_am="ሄርማ",
        description="Visions, commandments and parables on repentance and the building of the Church. The longest of the Apostolic Fathers.",
        description_am="ስለ ንስሐና ስለ ቤተ ክርስቲያን መታነጽ ራእዮች፣ ትእዛዛትና ምሳሌዎች። ከሐዋርያውያን አበው መጻሕፍት ረጅሙ።",
    ),
    "papias": dict(
        short="Papias", short_am="ፓፒያስ",
        title="Fragments", title_am="ቁርጥራጮች",
        author="St Papias of Hierapolis", author_am="ቅዱስ ፓፒያስ ዘሄራፖሊስ",
        description="What survives of a hearer of St John: early witness to how the Gospels were written.",
        description_am="የቅዱስ ዮሐንስ ሰሚ ከነበረው የተረፉ ቁርጥራጮች፤ ወንጌላት እንዴት እንደተጻፉ የሚያሳዩ ጥንታዊ ምስክሮች።",
    ),
}

SOURCE = "Ante-Nicene Fathers (1885–1887), via the Christian Classics Ethereal Library. Public domain."
COLLECTION = "Apostolic Fathers"


def q(s):
    return "'" + s.replace("'", "''") + "'"


def main():
    works = json.load(open(sys.argv[1], encoding="utf-8"))
    out = [
        "-- The Church Fathers library: the Apostolic Fathers, from the public-domain",
        "-- Ante-Nicene Fathers translation. Additive only: two new tables and their",
        "-- rows; inserts skip anything already present. Safe to run twice.",
        "-- Generated by scripts/fathers/to_sql.py; do not edit by hand.",
        "",
        'CREATE TABLE IF NOT EXISTS "cf_works" (',
        '    "id" SERIAL NOT NULL,',
        '    "slug" TEXT NOT NULL,',
        '    "collection" TEXT NOT NULL,',
        '    "title" TEXT NOT NULL,',
        '    "title_am" TEXT,',
        '    "short" TEXT NOT NULL,',
        '    "short_am" TEXT,',
        '    "author" TEXT NOT NULL,',
        '    "author_am" TEXT,',
        '    "description" TEXT NOT NULL,',
        '    "description_am" TEXT,',
        '    "source" TEXT NOT NULL,',
        '    "position" INTEGER NOT NULL,',
        '    "words" INTEGER NOT NULL,',
        '    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,',
        '    CONSTRAINT "cf_works_pkey" PRIMARY KEY ("id")',
        ");",
        'CREATE UNIQUE INDEX IF NOT EXISTS "cf_works_slug_key" ON "cf_works"("slug");',
        "",
        'CREATE TABLE IF NOT EXISTS "cf_sections" (',
        '    "id" SERIAL NOT NULL,',
        '    "work_id" INTEGER NOT NULL,',
        '    "position" INTEGER NOT NULL,',
        '    "title" TEXT NOT NULL,',
        '    "body" TEXT NOT NULL,',
        '    "words" INTEGER NOT NULL,',
        '    CONSTRAINT "cf_sections_pkey" PRIMARY KEY ("id")',
        ");",
        'CREATE UNIQUE INDEX IF NOT EXISTS "cf_sections_work_id_position_key" ON "cf_sections"("work_id", "position");',
        "",
        "DO $$",
        "BEGIN",
        "  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cf_sections_work_id_fkey') THEN",
        '    ALTER TABLE "cf_sections" ADD CONSTRAINT "cf_sections_work_id_fkey"',
        '      FOREIGN KEY ("work_id") REFERENCES "cf_works"("id") ON DELETE CASCADE ON UPDATE CASCADE;',
        "  END IF;",
        "END $$;",
        "",
    ]
    for pos, w in enumerate(works, start=1):
        m = META[w["slug"]]
        out.append(
            'INSERT INTO "cf_works" ("slug","collection","title","title_am","short","short_am","author","author_am","description","description_am","source","position","words") VALUES ('
            + ",".join([q(w["slug"]), q(COLLECTION), q(m["title"]), q(m["title_am"]), q(m["short"]), q(m["short_am"]), q(m["author"]), q(m["author_am"]),
                        q(m["description"]), q(m["description_am"]), q(SOURCE), str(pos), str(w["words"])])
            + ") ON CONFLICT (\"slug\") DO NOTHING;"
        )
        for i, s in enumerate(w["sections"], start=1):
            out.append(
                'INSERT INTO "cf_sections" ("work_id","position","title","body","words") SELECT "id",'
                + ",".join([str(i), q(s["title"]), q("\n\n".join(s["paragraphs"])), str(s["words"])])
                + f' FROM "cf_works" WHERE "slug" = {q(w["slug"])} ON CONFLICT ("work_id","position") DO NOTHING;'
            )
        out.append("")
    sys.stdout.write("\n".join(out))


if __name__ == "__main__":
    main()
