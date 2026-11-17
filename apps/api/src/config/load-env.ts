import path from "node:path";
import { config } from "dotenv";

/**
 * Loads environment in this order (first wins):
 *   1. the process environment (deployment / CI)
 *   2. apps/api/.env
 *   3. the repository root .env
 * Never throws: validation produces the readable error instead.
 */
export function loadEnvironment(): void {
  if (process.env.__JOURNAL_ENV_LOADED === "true") return;
  config({
    path: [path.resolve(process.cwd(), ".env"), path.resolve(process.cwd(), "../../.env")],
    quiet: true
  });
  process.env.__JOURNAL_ENV_LOADED = "true";
}
