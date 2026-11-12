#!/usr/bin/env node
// Translate a Church Fathers work into Amharic with Gemini CLI, on your own
// computer and Gemini subscription — no API key, no billing.
//
// Setup, once:
//   1. Install Node.js 20 or newer (https://nodejs.org).
//   2. Install Gemini CLI:   npm install -g @google/gemini-cli
//   3. Sign in:              run `gemini`, choose "Login with Google", use the
//                            account with your Gemini subscription, then quit.
//
// Run (from the folder this file is in, or give its path):
//   node translate.mjs didache --model gemini-4-argon
//
// It fetches the book's chapters from eotcmedia.com, translates one chapter at
// a time, and writes didache.am.json next to this script after every chapter.
// If it stops (a limit, a lost connection), run the same command again: done
// chapters are kept and it carries on. Then upload the .json file on the site:
// Admin → Church Fathers → the book → "Upload translation", and review it.
//
// Options:
//   --model <name>   Gemini model (leave out to use Gemini CLI's default).
//                    `gemini` then `/model` lists what your account can use.
//   --site <url>     Default https://eotcmedia.com
//   --only <n,n,…>   Just these chapter numbers (e.g. to redo a few).

import { spawnSync } from "node:child_process"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const args = process.argv.slice(2)
const slug = args.find(a => !a.startsWith("--") && !args[args.indexOf(a) - 1]?.startsWith("--"))
const opt = name => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined }
const model = opt("model")
const site = (opt("site") ?? "https://eotcmedia.com").replace(/\/$/, "")
const only = opt("only")?.split(",").map(Number)

if (!slug) {
  console.error("Usage: node translate.mjs <book> [--model gemini-4-argon]\nBooks: didache, diognetus, polycarp-philippians, martyrdom-of-polycarp, ignatius, 1-clement, barnabas, hermas, papias")
  process.exit(1)
}

const res = await fetch(`${site}/api/fathers/${slug}`)
if (!res.ok) { console.error(`Could not load "${slug}" from ${site} (${res.status}).`); process.exit(1) }
const work = await res.json()

const outPath = join(dirname(fileURLToPath(import.meta.url)), `${slug}.am.json`)
const out = existsSync(outPath)
  ? JSON.parse(readFileSync(outPath, "utf8"))
  : { slug, model: model ?? "default", sections: [] }
const done = new Map(out.sections.map(s => [s.position, s]))
const save = () => {
  out.sections = [...done.values()].sort((a, b) => a.position - b.position)
  writeFileSync(outPath, JSON.stringify(out, null, 1))
}

const ETHIOPIC = /[ሀ-᎟]/g

function prompt(section, paragraphs) {
  return `You are translating an early Christian text into Amharic for readers of the Ethiopian Orthodox Tewahedo Church.

Work: ${work.title}, by ${work.author}. Source: the English Ante-Nicene Fathers translation (1885).
Chapter: ${section.title}

Rules:
- Translate faithfully and completely. Do not add, leave out, summarise, explain or modernise.
- Write natural, dignified standard Amharic in Ge'ez script, using the established vocabulary of the Ethiopian Orthodox Tewahedo Church for God, Christ, the Holy Spirit, the sacraments, prayer, fasting and church offices.
- Where the text quotes or echoes Scripture, use the wording of the Amharic Bible as Ethiopian Orthodox readers know it, where you know it.
- Give names in their customary Amharic forms (for example ቀሌምንጦስ, ቆሮንቶስ, አግናጥዮስ, ፖሊካርፐስ).
- Words the English translators put in [square brackets] stay in square brackets, translated.
- Keep numbering such as "1." or "2." where it appears.
- First line of your answer: the chapter title, translated (keep its Roman numeral as an ordinary number, e.g. "ምዕራፍ 1፦ …").
- Then a blank line, then the text. It has exactly ${paragraphs.length} paragraph${paragraphs.length === 1 ? "" : "s"}; answer with exactly ${paragraphs.length}, in the same order, separated by one blank line.
- Answer with the Amharic only: no notes, no English.

Text:

${paragraphs.join("\n\n")}`
}

function gemini(text) {
  const r = spawnSync("gemini", [...(model ? ["-m", model] : []), "-p", text], {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
    shell: process.platform === "win32",
  })
  if (r.error) throw new Error(r.error.code === "ENOENT" ? "Gemini CLI not found. Install it: npm install -g @google/gemini-cli" : r.error.message)
  if (r.status !== 0) throw new Error((r.stderr || r.stdout || `exit ${r.status}`).trim().slice(0, 500))
  return r.stdout
}

function clean(text) {
  return text
    .replace(/^```[a-z]*\n?/i, "").replace(/\n?```\s*$/i, "")
    .split(/\n\s*\n/).map(p => p.replace(/\s+/g, " ").trim()).filter(Boolean)
}

const todo = work.sections.filter(s => (only ? only.includes(s.position) : !done.has(s.position)))
console.log(`${work.title}: ${work.sections.length} chapters, ${done.size} already translated, ${todo.length} to do. Writing ${outPath}`)

for (const section of todo) {
  const paragraphs = section.body.split("\n\n")
  let am = null
  for (let attempt = 1; attempt <= 2 && !am; attempt++) {
    let result
    try {
      result = clean(gemini(prompt(section, paragraphs)))
    } catch (err) {
      console.error(`\nStopped at chapter ${section.position}: ${err.message}\nRun the same command again to continue.`)
      save()
      process.exit(1)
    }
    const ethiopic = (result.join(" ").match(ETHIOPIC) ?? []).length
    if (result.length === paragraphs.length + 1 && ethiopic > 20) am = result
    else console.warn(`  chapter ${section.position}: got ${result.length - 1} paragraph(s) for ${paragraphs.length}${ethiopic <= 20 ? ", little Amharic" : ""}; ${attempt === 1 ? "retrying" : "skipped — redo it with --only " + section.position}`)
  }
  if (am) {
    done.set(section.position, { position: section.position, titleAm: am[0], bodyAm: am.slice(1).join("\n\n") })
    save()
    console.log(`  ✓ chapter ${section.position}/${work.sections.length}`)
  }
}

save()
const missing = work.sections.filter(s => !done.has(s.position)).map(s => s.position)
console.log(missing.length ? `\nDone except chapter(s) ${missing.join(", ")}.` : `\nAll ${work.sections.length} chapters translated. Upload ${outPath} on the site.`)
