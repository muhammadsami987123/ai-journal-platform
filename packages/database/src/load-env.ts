import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Package scripts run from packages/database, but the single source of truth
 * for configuration is the repository-root `.env`. The first file wins.
 */
export function loadEnvironment(): void {
  if (process.env.__JOURNAL_ENV_LOADED === "true") return;
  config({
    path: [
      path.resolve(process.cwd(), ".env"),
      path.resolve(here, "../../../.env"),
      path.resolve(here, "../../.env")
    ],
    quiet: true
  });
  process.env.__JOURNAL_ENV_LOADED = "true";
}
