import { loadEnvironment } from "./load-env.js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

loadEnvironment();

const here = path.dirname(fileURLToPath(import.meta.url));
const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;

async function main(): Promise<void> {
  if (!url) {
    throw new Error("DATABASE_URL_DIRECT (or DATABASE_URL) is required to run migrations.");
  }

  const pool = new Pool({
    connectionString: url,
    max: 2,
    ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false }
  });

  try {
    const db = drizzle(pool);
    console.info("[migrate] applying generated migrations…");
    await migrate(db, { migrationsFolder: path.join(here, "..", "migrations") });

    // Hand-written guarantees that Drizzle cannot express: immutability
    // triggers and the acyclic-ish entries → ai_generations foreign key.
    const constraints = await readFile(path.join(here, "..", "sql", "constraints.sql"), "utf8");
    console.info("[migrate] applying constraints and triggers…");
    await pool.query(constraints);

    const { rows } = await pool.query<{ count: string }>("select count(*)::text as count from entries");
    console.info(`[migrate] done. entries present: ${rows[0]?.count ?? "0"}`);
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error("[migrate] failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
