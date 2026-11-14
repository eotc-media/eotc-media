"""Turn extract.py's JSON into a library file to upload on the site.

    python3 -I scripts/fathers/extract.py <dir with anfNN.xml> > fathers.json
    python3 -I scripts/fathers/to_bundle.py fathers.json > library.json

Then upload library.json at Admin → Church Fathers → "Import library file".
The site writes each work's text to R2 (library/<slug>/en.json) and keeps
only an index in the database (titles, chapter titles and lengths), and
points the Books entries listed in BOOK_LINKS at their text.

A file can hold any subset of works (--only=slug,slug); importing again
replaces a work's English text and refreshes its index, and never touches
translations, notes or reading progress.
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
    # ── St Justin Martyr ──────────────────────────────────────────────────────
    "justin-first-apology": dict(
        collection="St Justin Martyr", short="Justin, First Apology", short_am="ዮስጢኖስ፣ ቀዳሚ መከላከያ",
        title="The First Apology", title_am="ቀዳሚው መከላከያ",
        author="St Justin Martyr", author_am="ቅዱስ ዮስጢኖስ ሰማዕት",
        description="A defence of Christians to the Roman emperor, with the earliest description of Sunday worship, baptism and the Eucharist.",
        description_am="ለሮም ንጉሠ ነገሥት የቀረበ የክርስቲያኖች መከላከያ፤ ስለ እሑድ አምልኮ፣ ስለ ጥምቀትና ስለ ቅዱስ ቁርባን የመጀመሪያውን ገለጻ ይዟል።",
    ),
    "justin-second-apology": dict(
        collection="St Justin Martyr", short="Justin, Second Apology", short_am="ዮስጢኖስ፣ ዳግማዊ መከላከያ",
        title="The Second Apology", title_am="ዳግማዊው መከላከያ",
        author="St Justin Martyr", author_am="ቅዱስ ዮስጢኖስ ሰማዕት",
        description="A short appeal to the Roman Senate after Christians were put to death for their name alone.",
        description_am="ክርስቲያኖች በስማቸው ብቻ ከተገደሉ በኋላ ለሮም ሸንጎ የቀረበ አጭር ልመና።",
    ),
    "justin-dialogue-trypho": dict(
        collection="St Justin Martyr", short="Dialogue with Trypho", short_am="ከትሪፎን ጋር የተደረገ ውይይት",
        title="Dialogue with Trypho", title_am="ከትሪፎን ጋር የተደረገ ውይይት",
        author="St Justin Martyr", author_am="ቅዱስ ዮስጢኖስ ሰማዕት",
        description="Justin's conversation with a Jewish teacher, showing from the Old Testament that Jesus is the Christ. Opens with the story of his own conversion.",
        description_am="ዮስጢኖስ ከአንድ አይሁዳዊ መምህር ጋር ያደረገው ውይይት፤ ኢየሱስ ክርስቶስ መሆኑን ከብሉይ ኪዳን ያሳያል። በራሱ የንስሐ ታሪክ ይጀምራል።",
    ),
    "justin-discourse-greeks": dict(
        collection="St Justin Martyr", short="Discourse to the Greeks", short_am="ለግሪኮች የተደረገ ንግግር",
        title="The Discourse to the Greeks", title_am="ለግሪኮች የተደረገ ንግግር",
        author="Attributed to St Justin Martyr", author_am="ለቅዱስ ዮስጢኖስ የተሰጠ",
        description="A brief explanation of why the writer left the pagan religion of the Greeks for Christ.",
        description_am="ጸሐፊው የግሪኮችን አምልኮ ትቶ ወደ ክርስቶስ የመጣበትን ምክንያት የሚገልጽ አጭር ጽሑፍ።",
    ),
    "justin-hortatory-address": dict(
        collection="St Justin Martyr", short="Hortatory Address", short_am="ለግሪኮች የተደረገ ምክር",
        title="Hortatory Address to the Greeks", title_am="ለግሪኮች የተደረገ የምክር ንግግር",
        author="Attributed to St Justin Martyr", author_am="ለቅዱስ ዮስጢኖስ የተሰጠ",
        description="Urges the Greeks to turn from their poets and philosophers to the older and truer teaching of Moses and the prophets.",
        description_am="ግሪኮች ከባለ ቅኔዎቻቸውና ከፈላስፎቻቸው ተመልሰው የሙሴንና የነቢያትን ትምህርት እንዲቀበሉ ይመክራል።",
    ),
    "justin-sole-government": dict(
        collection="St Justin Martyr", short="On the Sole Government of God", short_am="ስለ አንዱ እግዚአብሔር ገዥነት",
        title="On the Sole Government of God", title_am="ስለ አንዱ እግዚአብሔር ገዥነት",
        author="Attributed to St Justin Martyr", author_am="ለቅዱስ ዮስጢኖስ የተሰጠ",
        description="That there is one God, shown even from the Greek poets themselves.",
        description_am="አንድ አምላክ ብቻ እንዳለ ከግሪክ ባለ ቅኔዎች ጽሑፍ ጭምር ያሳያል።",
    ),
    "justin-resurrection": dict(
        collection="St Justin Martyr", short="On the Resurrection", short_am="ስለ ትንሣኤ",
        title="On the Resurrection (Fragments)", title_am="ስለ ትንሣኤ (ቁርጥራጮች)",
        author="St Justin Martyr", author_am="ቅዱስ ዮስጢኖስ ሰማዕት",
        description="What survives of Justin's defence of the resurrection of the body.",
        description_am="ዮስጢኖስ ስለ ሥጋ ትንሣኤ ከጻፈው መከላከያ የተረፉ ክፍሎች።",
    ),
    "martyrdom-of-justin": dict(
        collection="St Justin Martyr", short="Martyrdom of Justin", short_am="የዮስጢኖስ ሰማዕትነት",
        title="The Martyrdom of Justin and his Companions", title_am="የቅዱስ ዮስጢኖስና የባልንጀሮቹ ሰማዕትነት",
        author="The early Church", author_am="የጥንቷ ቤተ ክርስቲያን",
        description="The court record of Justin's trial in Rome and the witness of the believers who died with him.",
        description_am="ዮስጢኖስ በሮም የተፈረደበት የፍርድ ቤት መዝገብና አብረውት የሞቱት ምእመናን ምስክርነት።",
    ),
    # ── St Irenaeus of Lyons ──────────────────────────────────────────────────
    "irenaeus-against-heresies-1": dict(
        collection="St Irenaeus of Lyons", short="Against Heresies I", short_am="መናፍቃንን መቃወም 1",
        title="Against Heresies, Book I", title_am="መናፍቃንን መቃወም፣ መጽሐፍ 1",
        author="St Irenaeus of Lyons", author_am="ቅዱስ ሄሬኔዎስ ዘሊዮን",
        description="Sets out the teachings of the Gnostic sects, above all the Valentinians, so the reader can recognise them.",
        description_am="የግኖስቲክ ወገኖችን በተለይም የቫለንቲኖስን ተከታዮች ትምህርት አንባቢው እንዲያውቃቸው ያቀርባል።",
    ),
    "irenaeus-against-heresies-2": dict(
        collection="St Irenaeus of Lyons", short="Against Heresies II", short_am="መናፍቃንን መቃወም 2",
        title="Against Heresies, Book II", title_am="መናፍቃንን መቃወም፣ መጽሐፍ 2",
        author="St Irenaeus of Lyons", author_am="ቅዱስ ሄሬኔዎስ ዘሊዮን",
        description="Refutes the Gnostic systems by reason: there is one God, the Creator of all.",
        description_am="የግኖስቲክ ትምህርቶችን በምክንያት ያስተባብላል፤ የሁሉ ፈጣሪ አንድ አምላክ ብቻ ነው።",
    ),
    "irenaeus-against-heresies-3": dict(
        collection="St Irenaeus of Lyons", short="Against Heresies III", short_am="መናፍቃንን መቃወም 3",
        title="Against Heresies, Book III", title_am="መናፍቃንን መቃወም፣ መጽሐፍ 3",
        author="St Irenaeus of Lyons", author_am="ቅዱስ ሄሬኔዎስ ዘሊዮን",
        description="Answers the heresies from the apostolic tradition kept in the churches and from the Scriptures. Includes the famous list of the bishops of Rome.",
        description_am="መናፍቃንን በአብያተ ክርስቲያናት በተጠበቀው ሐዋርያዊ ትውፊትና በመጻሕፍት ይመልሳል።",
    ),
    "irenaeus-against-heresies-4": dict(
        collection="St Irenaeus of Lyons", short="Against Heresies IV", short_am="መናፍቃንን መቃወም 4",
        title="Against Heresies, Book IV", title_am="መናፍቃንን መቃወም፣ መጽሐፍ 4",
        author="St Irenaeus of Lyons", author_am="ቅዱስ ሄሬኔዎስ ዘሊዮን",
        description="Shows from the words of Christ that the God of the Old Testament and the Father of Jesus Christ are one.",
        description_am="የብሉይ ኪዳን አምላክና የኢየሱስ ክርስቶስ አባት አንድ መሆናቸውን ከክርስቶስ ቃል ያሳያል።",
    ),
    "irenaeus-against-heresies-5": dict(
        collection="St Irenaeus of Lyons", short="Against Heresies V", short_am="መናፍቃንን መቃወም 5",
        title="Against Heresies, Book V", title_am="መናፍቃንን መቃወም፣ መጽሐፍ 5",
        author="St Irenaeus of Lyons", author_am="ቅዱስ ሄሬኔዎስ ዘሊዮን",
        description="On the salvation of the flesh, the resurrection and the world to come.",
        description_am="ስለ ሥጋ መዳን፣ ስለ ትንሣኤና ስለሚመጣው ዓለም።",
    ),
}

SOURCE = "Ante-Nicene Fathers (1885–1887), via the Christian Classics Ethereal Library. Public domain."
# Works without a collection of their own belong here.
COLLECTION = "Apostolic Fathers"


# Books entries (cb_books, by id) that are one of these works, or one part of
# it. The site links a book only if its title contains `match`, and only if it
# is not linked already.
BOOK_LINKS = [
    (142, "Clement", "1-clement", None), (143, "Diognetus", "diognetus", None),
    (144, "Polycarp", "polycarp-philippians", None),
    (145, "Ephesians", "ignatius", (1, 21)), (146, "Magnesians", "ignatius", (22, 36)),
    (147, "Trallians", "ignatius", (37, 49)), (148, "Romans", "ignatius", (50, 59)),
    (149, "Philadelphians", "ignatius", (60, 70)), (150, "Smyrnaeans", "ignatius", (71, 83)),
    (151, "Polycarp", "ignatius", (84, 91)),
    (152, "Barnabas", "barnabas", None),
    (155, "First Apology", "justin-first-apology", None), (156, "Second Apology", "justin-second-apology", None),
    (216, "Trypho", "justin-dialogue-trypho", None), (217, "Discourse to the Greeks", "justin-discourse-greeks", None),
    (218, "Hortatory Address", "justin-hortatory-address", None), (219, "Sole Government", "justin-sole-government", None),
    (220, "Resurrection", "justin-resurrection", None), (221, "Martyrdom", "martyrdom-of-justin", None),
    (222, "Book I", "irenaeus-against-heresies-1", None), (223, "Book III", "irenaeus-against-heresies-3", None),
    (224, "Book IV", "irenaeus-against-heresies-4", None), (225, "Book V", "irenaeus-against-heresies-5", None),
]


def main():
    works = json.load(open(sys.argv[1], encoding="utf-8"))
    only_arg = next((a for a in sys.argv[2:] if a.startswith("--only=")), None)
    only = set(only_arg[len("--only="):].split(",")) if only_arg else None
    unknown = (only or set()) - {w["slug"] for w in works}
    if unknown:
        sys.exit(f"Unknown works: {', '.join(sorted(unknown))}")

    out_works = []
    for pos, w in enumerate(works, start=1):
        if only and w["slug"] not in only:
            continue
        m = META[w["slug"]]
        out_works.append({
            "slug": w["slug"],
            "collection": m.get("collection", COLLECTION),
            "title": m["title"], "titleAm": m["title_am"],
            "short": m["short"], "shortAm": m["short_am"],
            "author": m["author"], "authorAm": m["author_am"],
            "description": m["description"], "descriptionAm": m["description_am"],
            "source": SOURCE,
            # Shelf order is the order of the full list, whatever is included.
            "position": pos,
            "sections": [
                {"position": i, "title": sec["title"], "words": sec["words"], "paragraphs": sec["paragraphs"]}
                for i, sec in enumerate(w["sections"], start=1)
            ],
        })
    included = {w["slug"] for w in out_works}
    books = [
        {"id": bid, "match": match, "work": slug, **({"range": {"from": r[0], "to": r[1]}} if r else {})}
        for bid, match, slug, r in BOOK_LINKS if slug in included
    ]
    json.dump({"format": "eotc-library/1", "works": out_works, "books": books}, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
