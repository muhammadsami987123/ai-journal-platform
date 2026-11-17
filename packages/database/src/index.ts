import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";
import * as schema from "../schema/index.js";

export * as schema from "../schema/index.js";

export type Database = NodePgDatabase<typeof schema>;

export interface DatabaseHandle {
  db: Database;
  pool: Pool;
  close: () => Promise<void>;
}

/**
 * Connection strategy (TECH_STACK.md §6, decision recorded in
 * reports/implementation/decision-records.md): the runtime uses the
 * transaction-capable `pg` driver for every path — reads and writes alike —
 * because atomic multi-table writes are mandatory and mixing two drivers
 * silently breaks interactivity. The pooled Neon URL is used at runtime, the
 * direct URL only for migrations.
 */
export function createDatabase(connectionString: string, overrides: PoolConfig = {}): DatabaseHandle {
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and add your Neon pooled connection string."
    );
  }

  const requiresSsl =
    /sslmode=(require|verify-ca|verify-full)/.test(connectionString) ||
    !/@(localhost|127\.0\.0\.1)[:/]/.test(connectionString);

  const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
    ...overrides
  });

  // A pool error must never crash the process (e.g. Neon idle termination).
  pool.on("error", (error) => {
    console.error("[database] idle client error", error.message);
  });

  const db = drizzle(pool, { schema });

  return {
    db,
    pool,
    close: () => pool.end()
  };
}

let shared: DatabaseHandle | null = null;

/** Process-wide handle for the API. Lazily created so boot can report a readable error. */
export function getDatabase(): DatabaseHandle {
  if (!shared) {
    shared = createDatabase(process.env.DATABASE_URL ?? "");
  }
  return shared;
}

export async function closeDatabase(): Promise<void> {
  if (shared) {
    await shared.close();
    shared = null;
  }
}

/** Run a query inside a transaction on the transaction-capable driver. */
export async function withTransaction<T>(fn: (db: Database) => Promise<T>): Promise<T> {
  const { db } = getDatabase();
  return db.transaction(async (tx) => fn(tx as unknown as Database));
}
