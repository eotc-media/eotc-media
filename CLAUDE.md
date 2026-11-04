# Working on this repo

- The owner is the sole developer. Commit and push straight to `main`; no
  branches or pull requests.
- Database changes: never remove or rewrite existing data unless the owner
  asks for it specifically. Additive changes (new tables, new nullable
  columns) are fine, but tell the owner what will change and wait for their
  OK before pushing.
- Write migrations so they are safe to run twice (`IF NOT EXISTS`, guarded
  `DO` blocks), as the existing ones from `20261104_reading_plans` on are.
