// Applies pending database migrations as part of the production build, so a
// merged schema change reaches Supabase with the deploy that needs it.
//
// Runs only for Vercel production builds. Preview builds share the production
// database, and an unmerged branch must never change it.
//
// Needs DIRECT_URL: Supabase's session pooler (port 5432) or direct connection.
// Migrations take a session-level lock that the transaction pooler (6543, the
// one DATABASE_URL uses at runtime) cannot hold.

import { execFileSync } from "node:child_process"
import pg from "pg"

if (process.env.VERCEL_ENV !== "production") {
  console.log("migrate: not a production build, skipping")
  process.exit(0)
}

if (!process.env.DIRECT_URL) {
  console.error(
    "migrate: DIRECT_URL is not set. Add Supabase's session pooler connection string " +
    "(port 5432) as DIRECT_URL in the Vercel project's environment variables.",
  )
  process.exit(1)
}

// Migrations up to here were applied by hand in the Supabase SQL Editor before
// deploys ran them, so Prisma has no record of them. Recording them as applied
// (once; already-recorded ones are skipped) lets `migrate deploy` start after
// them instead of re-running SQL the database already has.
const APPLIED_BY_HAND = [
  "20260124_init",
  "20260511_publishedat_datetime_precision",
  "20260511_sm_category_language",
  "20260514_hm_collections",
  "20260611_restrict_classifier_fks",
  "20260614_cb_category_language",
  "20260614_email_opt_out",
  "20260620_daily_stats_clicks",
  "20260621_qz_round_filters",
  "20260830_email_campaigns",
  "20260926_preacher_slug",
  "20260926_slug_routes",
]

const prisma = (...args) => execFileSync("prisma", args, { stdio: "inherit" })

const client = new pg.Client({ connectionString: process.env.DIRECT_URL })
await client.connect()
const { rows } = await client.query(`
  SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL
`).catch(e => {
  if (e.code === "42P01") return { rows: [] } // table not created yet
  throw e
})
await client.end()

const recorded = new Set(rows.map(r => r.migration_name))
for (const name of APPLIED_BY_HAND) {
  if (!recorded.has(name)) prisma("migrate", "resolve", "--applied", name)
}

prisma("migrate", "deploy")
