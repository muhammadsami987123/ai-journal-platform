import { Injectable } from "@nestjs/common";
import { toBusinessDate, type DashboardPayload, type EntrySummary } from "@journal/shared";
import { EntriesRepository } from "../journals/entries.repository.js";
import { MoodsRepository } from "../moods/moods.repository.js";
import { InsightsService } from "../insights/insights.service.js";
import { UsersRepository } from "../users/users.repository.js";
import { AiRepository } from "../ai/ai.repository.js";

/** Remove markdown decoration for a one-glance summary line. */
function plainText(markdown: string, limit = 240): string {
  const text = markdown
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly entries: EntriesRepository,
    private readonly moods: MoodsRepository,
    private readonly insights: InsightsService,
    private readonly users: UsersRepository,
    private readonly ai: AiRepository
  ) {}

  async get(userId: string): Promise<DashboardPayload> {
    const profile = await this.users.getProfile(userId);
    const today = toBusinessDate(new Date(), profile.timezone);

    const [todayEntries, todayMoodRows, recent, stats] = await Promise.all([
      this.entries.forDate(userId, today),
      this.moods.range(userId, today, today),
      this.entries.recent(userId, 5),
      this.insights.dashboardStats(userId)
    ]);

    const summary = await this.buildSummary(userId, todayEntries);

    return {
      today,
      timezone: profile.timezone,
      display_name: profile.display_name,
      today_entries: todayEntries,
      today_mood: todayMoodRows[0] ?? null,
      summary,
      recent,
      stats
    };
  }

  /**
   * Explicit source order (T5.1): approved AI summary, then the entry text,
   * then nothing. Never a fabricated line.
   */
  private async buildSummary(
    userId: string,
    todayEntries: EntrySummary[]
  ): Promise<DashboardPayload["summary"]> {
    for (const entry of todayEntries) {
      const generation = await this.ai.latestApprovedForEntry(userId, entry.id);
      if (generation) {
        return { source: "ai", text: plainText(generation.output_markdown), entry_id: entry.id };
      }
    }

    const first = todayEntries[0];
    if (first) {
      return { source: "text", text: first.excerpt, entry_id: first.id };
    }

    return { source: "none", text: "", entry_id: null };
  }
}
