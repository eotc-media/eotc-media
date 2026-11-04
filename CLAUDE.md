# Working on this repo

- Database migrations are applied automatically by production deploys
  (`scripts/migrate.mjs`, run from `npm run build`). Merging a migration
  therefore changes the production database. Before merging any change that
  adds or edits a folder in `prisma/migrations`, show the owner the SQL and what
  it does, and wait for their explicit approval.
- Write migrations so they are safe to run twice (`IF NOT EXISTS`, guarded
  `DO` blocks), as the existing ones from `20261104_reading_plans` on are.
