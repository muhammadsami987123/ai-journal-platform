import { Inject, Injectable } from "@nestjs/common";
import { entries, moods} from "@journal/database/schema";
import type { Database } from "@journal/database";
import type { CalendarDay, CalendarMonth, Mood } from "@journal/shared";
import { and, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { DATABASE } from "../../database/database.module.js";

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function monthBounds(year: number, month: number): { from: string; to: string } {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    from: `${year}-${pad(month)}-01`,
    to: `${year}-${pad(month)}-${pad(daysInMonth)}`
  };
}

/** Month and day aggregates. One query per calendar surface — never per day. */
@Injectable()
export class CalendarRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async month(userId: string, year: number, month: number): Promise<CalendarMonth> {
    const { from, to } = monthBounds(year, month);

    const [dayRows, moodRows] = await Promise.all([
      this.db
        .select({
          date: entries.entryDate,
          entryCount: sql<number>`count(*)::int`,
          hasDraft: sql<boolean>`bool_or(${entries.status} = 'draft')`,
          hasComplete: sql<boolean>`bool_or(${entries.status} = 'complete')`,
          hasAi: sql<boolean>`bool_or(exists (
            select 1 from ai_generations g
            where g.entry_id = ${entries.id} and g.is_approved = true
          ))`
        })
        .from(entries)
        .where(
          and(
            eq(entries.userId, userId),
            isNull(entries.deletedAt),
            gte(entries.entryDate, from),
            lte(entries.entryDate, to)
          )
        )
        .groupBy(entries.entryDate),
      this.db
        .select({ date: moods.recordDate, mood: moods.mood })
        .from(moods)
        .where(and(eq(moods.userId, userId), gte(moods.recordDate, from), lte(moods.recordDate, to)))
    ]);

    const moodsByDate = new Map<string, Mood[]>();
    for (const row of moodRows) {
      const list = moodsByDate.get(row.date) ?? [];
      const mood = row.mood as Mood;
      if (!list.includes(mood)) list.push(mood);
      moodsByDate.set(row.date, list);
    }

    const days: CalendarDay[] = dayRows
      .map((row) => ({
        date: row.date,
        entryCount: row.entryCount,
        hasDraft: row.hasDraft,
        hasComplete: row.hasComplete,
        hasAi: row.hasAi,
        moods: moodsByDate.get(row.date) ?? []
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { year, month, days };
  }
}
