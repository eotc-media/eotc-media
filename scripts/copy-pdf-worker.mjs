// The PDF reader's worker must be served as a file of its own. Copy it from the
// installed pdfjs-dist into public/ at build time, so it always matches the
// library version (and is not kept in git).
import { copyFileSync, mkdirSync } from "node:fs"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const src = require.resolve("pdfjs-dist/build/pdf.worker.min.mjs")
mkdirSync("public", { recursive: true })
copyFileSync(src, "public/pdf.worker.min.mjs")
console.log("pdf.worker.min.mjs copied to public/")
