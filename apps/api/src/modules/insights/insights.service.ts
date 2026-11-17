import { Injectable } from "@nestjs/common";
import {
  toBusinessDate,
  type ActivityResponse,
  type HeatmapResponse,
  type InsightsOverview,
  type MoodInsights
} from "@journal/shared";
import { InsightsRepository } from "./insights.repository.js";
import { MoodsRepository } from "../moods/moods.repository.js";
import { addDays } from "./streak.js";

export interface DashboardStats {
  total_entries: number;
  current_streak: number;
  entries_this_month: number;
  total_words: number;
}

@Injectable()
export class InsightsService {
  constructor(
    private readonly repository: InsightsRepository,
    private readonly moods: MoodsRepository
  ) {}

  private async today(userId: string): Promise<string> {
    const timezone = await this.repository.timezone(userId);
    return toBusinessDate(new Date(), timezone);
  }

  async overview(userId: string): Promise<InsightsOverview> {
    const today = await this.today(userId);
    const [totals, dates] = await Promise.all([
      this.repository.totals(userId, today),
      this.repository.journalDates(userId)
    ]);
    return this.repository.buildOverview(totals, dates, today);
  }

  async activity(userId: string, period: "week" | "month"): Promise<ActivityResponse> {
    const today = await this.today(userId);
    const days = period === "week" ? 7 : 30;
    const from = addDays(today, -(days - 1));
    const rows = await this.repository.activity(userId, from, today);

    const byDate = new Map(rows.map((row) => [row.bucket, row]));
    const buckets = Array.from({ length: days }, (_, index) => {
      const date = addDays(from, index);
      const row = byDate.get(date);
      return { bucket: date, entries: row?.entries ?? 0, words: row?.words ?? 0 };
    });

    return { period, buckets };
  }

  async moodsInsights(userId: string, from?: string, to?: string): Promise<MoodInsights> {
    const rows = await this.moods.distribution(userId, from, to);
    const total = rows.reduce((sum, row) => sum + row.count, 0);
    return {
      total,
      distribution: rows.map((row) => ({
        mood: row.mood,
        count: row.count,
        percentage: total === 0 ? 0 : Math.round((row.count / total) * 1000) / 10
      })),
      top_emotions: rows.slice(0, 3).map((row) => row.mood)
    };
  }

  async heatmap(userId: string, days = 365): Promise<HeatmapResponse> {
    const today = await this.today(userId);
    const from = addDays(today, -(days - 1));
    return { from, to: today, days: await this.repository.heatmap(userId, from, today) };
  }

  /** Dashboard strip (T5.4) — same source as insights, never a second formula. */
  async dashboardStats(userId: string): Promise<DashboardStats> {
    const overview = await this.overview(userId);
    return {
      total_entries: overview.total_entries,
      current_streak: overview.current_streak,
      entries_this_month: overview.entries_this_month,
      total_words: overview.total_words
    };
  }
}
