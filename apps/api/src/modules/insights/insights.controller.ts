import { Controller, Get, Query } from "@nestjs/common";
import type {
  ActivityResponse,
  HeatmapResponse,
  InsightsOverview
} from "@journal/shared";
import { z } from "zod";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { ZodPipe } from "../../common/pipes/zod.pipe.js";
import type { AuthenticatedUser } from "../../auth/session.types.js";
import { InsightsService } from "./insights.service.js";

const activityQuery = z.object({
  period: z.enum(["week", "month"]).default("week")
});

@Controller("v1/insights")
export class InsightsController {
  constructor(private readonly insights: InsightsService) {}

  @Get("overview")
  overview(@CurrentUser() user: AuthenticatedUser): Promise<InsightsOverview> {
    return this.insights.overview(user.id);
  }

  @Get("activity")
  activity(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodPipe(activityQuery)) query: { period: "week" | "month" }
  ): Promise<ActivityResponse> {
    return this.insights.activity(user.id, query.period);
  }

  @Get("moods")
  async moods(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodPipe(z.object({ from: z.string().optional(), to: z.string().optional() })))
    query: { from?: string; to?: string }
  ) {
    return this.insights.moodsInsights(user.id, query.from, query.to);
  }

  @Get("heatmap")
  heatmap(@CurrentUser() user: AuthenticatedUser): Promise<HeatmapResponse> {
    return this.insights.heatmap(user.id);
  }
}
