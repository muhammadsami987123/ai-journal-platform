import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Migration gate for CI (T1.7): every .sql file in migrations/ must be listed
 * in meta/_journal.json and vice versa. Catches a migration that was written
 * but never journalled (the classic "works locally, missing in CI" defect).
 */
async function main(): Promise<void> {
  const folder = path.join(here, "..", "migrations");
  const files = (await readdir(folder)).filter((file) => file.endsWith(".sql")).sort();
  const journal = JSON.parse(await readFile(path.join(folder, "meta", "_journal.json"), "utf8")) as {
    entries: { tag: string }[];
  };

  const journalled = new Set(journal.entries.map((entry) => `${entry.tag}.sql`));
  const onDisk = new Set(files);

  const missingFromJournal = files.filter((file) => !journalled.has(file));
  const missingFromDisk = [...journalled].filter((file) => !onDisk.has(file));

  if (missingFromJournal.length || missingFromDisk.length) {
    if (missingFromJournal.length) {
      console.error(`[db:check] migrations not journalled: ${missingFromJournal.join(", ")}`);
    }
    if (missingFromDisk.length) {
      console.error(`[db:check] journalled but missing on disk: ${missingFromDisk.join(", ")}`);
    }
    process.exitCode = 1;
    return;
  }

  console.info(`[db:check] ${files.length} migration(s) journalled and present.`);
}

main().catch((error: unknown) => {
  console.error("[db:check] failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
