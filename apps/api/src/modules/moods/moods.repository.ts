import { Inject, Injectable } from "@nestjs/common";
import { entries, moods} from "@journal/database/schema";
import type { Database } from "@journal/database";
import type { Mood, MoodRecord, MoodSetInput } from "@journal/shared";
import { and, asc, eq, gte, lte, sql, type SQL } from "drizzle-orm";
import { DATABASE } from "../../database/database.module.js";
import { AppException } from "../../common/errors/app.exception.js";
import { mapMood } from "../../common/mappers.js";
import { EntriesRepository } from "../journals/entries.repository.js";

export interface MoodDistributionRow {
  mood: Mood;
  count: number;
}

@Injectable()
export class MoodsRepository {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly entries: EntriesRepository
  ) {}

  /** One mood per entry (DATABASE_SCHEMA §3.6): replace on conflict. */
  async setForEntry(userId: string, entryId: string, input: MoodSetInput): Promise<MoodRecord> {
    await this.entries.verifyEntryOwnership(userId, entryId);

    const [entry] = await this.db
      .select({ entryDate: entries.entryDate })
      .from(entries)
      .where(and(eq(entries.id, entryId), eq(entries.userId, userId)))
      .limit(1);

    if (!entry) throw AppException.notFound("ENTRY_NOT_FOUND", "Journal entry not found.");

    const [row] = await this.db
      .insert(moods)
      .values({
        userId,
        entryId,
        recordDate: entry.entryDate,
        mood: input.mood,
        intensity: input.intensity ?? null,
        note: input.note ?? null
      })
      .onConflictDoUpdate({
        target: moods.entryId,
        set: {
          mood: input.mood,
          intensity: input.intensity ?? null,
          note: input.note ?? null,
          recordDate: entry.entryDate,
          updatedAt: new Date()
        }
      })
      .returning();

    if (!row) throw new AppException("INTERNAL_ERROR", "The mood could not be saved.", 500);
    return mapMood(row);
  }

  async removeForEntry(userId: string, entryId: string): Promise<void> {
    await this.entries.verifyEntryOwnership(userId, entryId);
    await this.db.delete(moods).where(and(eq(moods.userId, userId), eq(moods.entryId, entryId)));
  }

  async range(userId: string, from?: string, to?: string): Promise<MoodRecord[]> {
    const conditions: SQL[] = [eq(moods.userId, userId)];
    if (from) conditions.push(gte(moods.recordDate, from));
    if (to) conditions.push(lte(moods.recordDate, to));

    const rows = await this.db
      .select()
      .from(moods)
      .where(and(...conditions))
      .orderBy(asc(moods.recordDate));
    return rows.map(mapMood);
  }

  async distribution(userId: string, from?: string, to?: string): Promise<MoodDistributionRow[]> {
    const conditions: SQL[] = [eq(moods.userId, userId)];
    if (from) conditions.push(gte(moods.recordDate, from));
    if (to) conditions.push(lte(moods.recordDate, to));

    const rows = await this.db
      .select({ mood: moods.mood, count: sql<number>`count(*)::int` })
      .from(moods)
      .where(and(...conditions))
      .groupBy(moods.mood)
      .orderBy(sql`count(*) desc`);

    return rows.map((row) => ({ mood: row.mood as Mood, count: row.count }));
  }
}
