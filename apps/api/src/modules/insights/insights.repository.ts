import { Inject, Injectable } from "@nestjs/common";
import { entries, profiles} from "@journal/database/schema";
import type { Database } from "@journal/database";
import type { ActivityBucket, HeatmapDay, InsightsOverview } from "@journal/shared";
import { and, asc, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { DATABASE } from "../../database/database.module.js";
import { addDays, computeStreaks } from "./streak.js";

interface Totals {
  totalEntries: number;
  totalWords: number;
  complete: number;
  daysJournaled: number;
  firstDate: string | null;
  thisMonth: number;
  lastSeven: number;
}

@Injectable()
export class InsightsRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async timezone(userId: string): Promise<string> {
    const [row] = await this.db
      .select({ timezone: profiles.timezone })
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);
    return row?.timezone ?? "UTC";
  }

  async journalDates(userId: string): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ date: entries.entryDate })
      .from(entries)
      .where(and(eq(entries.userId, userId), isNull(entries.deletedAt)))
      .orderBy(asc(entries.entryDate));
    return rows.map((row) => row.date);
  }

  async totals(userId: string, today: string): Promise<Totals> {
    const monthStart = `${today.slice(0, 7)}-01`;
    const weekStart = addDays(today, -6);

    const [row] = await this.db
      .select({
        totalEntries: sql<number>`count(*)::int`,
        totalWords: sql<number>`coalesce(sum(${entries.wordCount}), 0)::int`,
        complete: sql<number>`count(*) filter (where ${entries.status} = 'complete')::int`,
        daysJournaled: sql<number>`count(distinct ${entries.entryDate})::int`,
        firstDate: sql<string | null>`min(${entries.entryDate})`,
        thisMonth: sql<number>`count(*) filter (where ${entries.entryDate} >= ${monthStart})::int`,
        lastSeven: sql<number>`count(*) filter (where ${entries.entryDate} >= ${weekStart})::int`
      })
      .from(entries)
      .where(and(eq(entries.userId, userId), isNull(entries.deletedAt)));

    return (
      row ?? {
        totalEntries: 0,
        totalWords: 0,
        complete: 0,
        daysJournaled: 0,
        firstDate: null,
        thisMonth: 0,
        lastSeven: 0
      }
    );
  }

  async activity(userId: string, from: string, to: string): Promise<ActivityBucket[]> {
    const rows = await this.db
      .select({
        date: entries.entryDate,
        entries: sql<number>`count(*)::int`,
        words: sql<number>`coalesce(sum(${entries.wordCount}), 0)::int`
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
      .groupBy(entries.entryDate)
      .orderBy(asc(entries.entryDate));

    return rows.map((row) => ({ bucket: row.date, entries: row.entries, words: row.words }));
  }

  async heatmap(userId: string, from: string, to: string): Promise<HeatmapDay[]> {
    const rows = await this.db
      .select({
        date: entries.entryDate,
        entries: sql<number>`count(*)::int`
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
      .groupBy(entries.entryDate)
      .orderBy(asc(entries.entryDate));

    return rows.map((row) => ({ date: row.date, entries: row.entries }));
  }

  buildOverview(totals: Totals, dates: readonly string[], today: string): InsightsOverview {
    const { current, longest } = computeStreaks(dates, today);
    return {
      total_entries: totals.totalEntries,
      total_words: totals.totalWords,
      current_streak: current,
      longest_streak: longest,
      days_journaled: totals.daysJournaled,
      completion_rate:
        totals.totalEntries === 0
          ? 0
          : Math.round((totals.complete / totals.totalEntries) * 1000) / 10,
      entries_this_month: totals.thisMonth,
      entries_last_7_days: totals.lastSeven,
      first_entry_date: totals.firstDate
    };
  }
}
