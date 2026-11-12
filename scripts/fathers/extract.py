"""Extract Church Fathers works from CCEL's ThML files into JSON.

Source: the Ante-Nicene Fathers (ed. Roberts, Donaldson, Coxe, 1885–1887),
as published by the Christian Classics Ethereal Library, which marks each
volume "Public Domain" (<DC.Rights>). Download the volumes first, e.g.

    curl -L -o anf01.xml https://ccel.org/ccel/schaff/anf01.xml

then run, from anywhere:

    python3 -I scripts/fathers/extract.py <dir with anfNN.xml> > fathers.json

Footnotes, editors' introductions and page markers are dropped; the
translators' own [bracketed] insertions are kept. Each work becomes an ordered
list of sections (its chapters), each a list of plain-text paragraphs.

To add a work, add an entry to WORKS below and re-run, then regenerate the
migration with scripts/fathers/to_sql.py.
"""

import json
import re
import sys
import xml.etree.ElementTree as ET

# Each work: where it is, and how its sections are cut.
#   ids     – the divs holding the text, in reading order
#   mode    – "chapters": one section per child div
#             "subchapters": split each child div at its "Chap. N." headings
#             "first_paragraph": as "chapters", but only each chapter's first
#                                paragraph (Ignatius: shorter recension)
WORKS = [
    {
        "slug": "didache", "vol": "anf07", "ids": ["viii.iii"], "mode": "chapters",
        "skip_titles": ["Elucidations"],
    },
    {"slug": "diognetus", "vol": "anf01", "ids": ["iii.ii"], "mode": "chapters"},
    {"slug": "polycarp-philippians", "vol": "anf01", "ids": ["iv.ii"], "mode": "chapters"},
    {"slug": "martyrdom-of-polycarp", "vol": "anf01", "ids": ["iv.iv"], "mode": "chapters"},
    {
        # The seven letters in the shorter (Greek) recension. CCEL prints each
        # chapter as the shorter text followed by the longer; three chapters
        # exist in one form only and are listed explicitly.
        "slug": "ignatius", "vol": "anf01",
        "ids": ["v.ii", "v.iii", "v.iv", "v.v", "v.vi", "v.vii", "v.viii"],
        "mode": "first_paragraph",
        "letter_titles": {
            "v.ii": "To the Ephesians", "v.iii": "To the Magnesians", "v.iv": "To the Trallians",
            "v.v": "To the Romans", "v.vi": "To the Philadelphians", "v.vii": "To the Smyrnaeans",
            "v.viii": "To Polycarp",
        },
        # v.ii.xxi is the longer recension's own chapter XX; leave it out.
        "skip_ids": ["v.ii.xxi"],
    },
    {"slug": "1-clement", "vol": "anf01", "ids": ["ii.ii"], "mode": "chapters"},
    {"slug": "barnabas", "vol": "anf01", "ids": ["vi.ii"], "mode": "chapters"},
    {"slug": "hermas", "vol": "anf02", "ids": ["ii.ii", "ii.iii", "ii.iv"], "mode": "subchapters"},
    {"slug": "papias", "vol": "anf01", "ids": ["vii.ii"], "mode": "chapters"},
]


def text_of(el):
    """Text of an element without its footnotes; whitespace collapsed."""
    out = []

    def rec(e):
        if e.tag == "note":
            if e.tail:
                out.append(e.tail)
            return
        if e.text:
            out.append(e.text)
        for c in e:
            rec(c)
        if e.tail:
            out.append(e.tail)

    if el.text:
        out.append(el.text)
    for c in el:
        rec(c)
    t = " ".join(" ".join(out).split())
    # Spacing left where a footnote anchor sat: "word ." -> "word."
    return re.sub(r"\s+([,.;:!?’”)\]])", r"\1", t)


def clean_title(t):
    t = " ".join(t.split())
    return re.sub(r"\s*—\s*", "—", t)


def paragraphs(el):
    return [p for p in (text_of(c) for c in el if c.tag == "p") if p]


def is_div(e):
    return e.tag.startswith("div") and e.tag[3:].isdigit()


def extract(work, roots):
    root = roots[work["vol"]]
    ids = {e.get("id"): e for e in root.iter() if e.get("id")}
    sections = []
    for div_id in work["ids"]:
        parent = ids[div_id]
        prefix = work.get("letter_titles", {}).get(div_id)
        for ch in (c for c in parent if is_div(c)):
            title = clean_title(ch.get("title", ""))
            if ch.get("id") in work.get("skip_ids", []) or title in work.get("skip_titles", []):
                continue
            if work["mode"] == "subchapters":
                # Hermas: "Vision First…", then "Chap. I.", "Chap. II." headings.
                head = clean_title(title.split(".")[0])
                current = None
                for c in ch:
                    tag_text = text_of(c) if c.tag in ("h4", "h5") else ""
                    m = re.match(r"Chap\.\s*([IVXLC]+)\.?", tag_text)
                    if m:
                        current = {"title": f"{head} · Chapter {m.group(1)}", "paragraphs": []}
                        sections.append(current)
                    elif c.tag == "p":
                        if current is None:
                            current = {"title": head, "paragraphs": []}
                            sections.append(current)
                        p = text_of(c)
                        if p:
                            current["paragraphs"].append(p)
                continue
            paras = paragraphs(ch)
            if work["mode"] == "first_paragraph":
                paras = paras[:1]
            if prefix:
                title = f"{prefix} · {title}"
            sections.append({"title": title, "paragraphs": paras})
    sections = [s for s in sections if s["paragraphs"]]
    for s in sections:
        s["words"] = sum(len(p.split()) for p in s["paragraphs"])
    return sections


def main():
    src = sys.argv[1]
    roots = {v: ET.parse(f"{src}/{v}.xml").getroot() for v in sorted({w["vol"] for w in WORKS})}
    out = []
    for w in WORKS:
        sections = extract(w, roots)
        out.append({"slug": w["slug"], "sections": sections, "words": sum(s["words"] for s in sections)})
    json.dump(out, sys.stdout, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
