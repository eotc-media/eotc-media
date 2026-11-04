import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // The CLI (migrations) connects through DIRECT_URL when it is set: the
  // transaction pooler in DATABASE_URL cannot hold a migration's lock. The app
  // itself connects in lib/prisma.ts and is unaffected.
  datasource: {
    url: process.env.DIRECT_URL ?? env("DATABASE_URL"),
  },
});
