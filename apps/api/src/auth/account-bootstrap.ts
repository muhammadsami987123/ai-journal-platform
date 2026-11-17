import { getDatabase, schema } from "@journal/database";

/**
 * Creates the profile, preferences and reminder rows that accompany a new auth
 * user. Idempotent, so it is safe to call from the sign-up hook and from
 * GET /me (which repairs accounts created before this code existed).
 *
 * Better Auth owns the `user` insert; everything owned by us is written in a
 * single transaction immediately after it (T2.5).
 */
export async function ensureUserRecords(input: {
  userId: string;
  name?: string | null;
  email?: string | null;
}): Promise<void> {
  const { db } = getDatabase();
  const fallbackName = input.email?.split("@")[0] ?? "Journal writer";

  await db.transaction(async (tx) => {
    await tx
      .insert(schema.profiles)
      .values({
        userId: input.userId,
        displayName: (input.name?.trim() || fallbackName).slice(0, 80)
      })
      .onConflictDoNothing({ target: schema.profiles.userId });

    await tx
      .insert(schema.preferences)
      .values({ userId: input.userId })
      .onConflictDoNothing({ target: schema.preferences.userId });

    await tx
      .insert(schema.reminders)
      .values({ userId: input.userId, enabled: false, timezone: "UTC" })
      .onConflictDoNothing({ target: schema.reminders.userId });
  });
}
