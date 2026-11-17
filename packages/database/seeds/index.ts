import { loadEnvironment } from "../src/load-env.js";
import { eq, sql } from "drizzle-orm";
import { DEFAULT_QUESTIONS } from "@journal/shared";
import { questions } from "../schema/index.js";
import { closeDatabase, getDatabase } from "../src/index.js";

loadEnvironment();

/** Stable ids keep seeding idempotent across environments. */
const SYSTEM_QUESTIONS: { id: string; prompt: string }[] = DEFAULT_QUESTIONS.map(
  (prompt, index) => ({
    id: `11111111-1111-4111-8111-${String(index + 1).padStart(12, "0")}`,
    prompt
  })
);

async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed system data in production. Seeding is a development step.");
  }

  const { db } = getDatabase();

  for (const [index, question] of SYSTEM_QUESTIONS.entries()) {
    await db
      .insert(questions)
      .values({
        id: question.id,
        userId: null,
        prompt: question.prompt,
        sortOrder: index,
        isActive: true,
        isSystem: true
      })
      .onConflictDoUpdate({
        target: questions.id,
        set: { prompt: question.prompt, sortOrder: index, isSystem: true }
      });
  }

  const [{ count } = { count: 0 }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(questions)
    .where(eq(questions.isSystem, true));

  console.info(`[seed] system questions present: ${count}`);
  await closeDatabase();
}

main().catch(async (error: unknown) => {
  console.error("[seed] failed:", error instanceof Error ? error.message : error);
  await closeDatabase().catch(() => undefined);
  process.exitCode = 1;
});
