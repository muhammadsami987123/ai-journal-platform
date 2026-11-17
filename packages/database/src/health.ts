import { loadEnvironment } from "./load-env.js";
import { getDatabase, closeDatabase } from "./index.js";

loadEnvironment();

/** T0.4 acceptance: a SELECT 1 round-trip through the package. */
async function main(): Promise<void> {
  const { pool } = getDatabase();
  const started = Date.now();
  const result = await pool.query<{ ok: number }>("select 1 as ok");
  console.info(`[db:health] ok=${result.rows[0]?.ok ?? "?"} latency=${Date.now() - started}ms`);
  await closeDatabase();
}

main().catch(async (error: unknown) => {
  console.error("[db:health] failed:", error instanceof Error ? error.message : error);
  await closeDatabase().catch(() => undefined);
  process.exitCode = 1;
});
