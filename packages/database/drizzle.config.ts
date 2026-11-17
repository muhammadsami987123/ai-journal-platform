import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

const here = path.dirname(fileURLToPath(import.meta.url));
// drizzle-kit runs from packages/database; the config lives at the repo root.
config({ path: path.resolve(here, "../../.env"), quiet: true });

/**
 * Migrations always run against the DIRECT Neon URL (no pooler) — DDL is not
 * safe through a transaction-mode pooler. The application runtime uses the
 * pooled URL via src/index.ts.
 */
const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;

export default defineConfig({
  dialect: "postgresql",
  schema: "./schema/index.ts",
  out: "./migrations",
  strict: true,
  verbose: true,
  dbCredentials: {
    url: url ?? "postgresql://placeholder:placeholder@localhost:5432/journal"
  }
});
