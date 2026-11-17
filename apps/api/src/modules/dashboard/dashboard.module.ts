import { Module } from "@nestjs/common";
import { DashboardController } from "./dashboard.controller.js";
import { DashboardService } from "./dashboard.service.js";
import { JournalsModule } from "../journals/journals.module.js";
import { MoodsModule } from "../moods/moods.module.js";
import { InsightsModule } from "../insights/insights.module.js";
import { UsersModule } from "../users/users.module.js";
import { AiModule } from "../ai/ai.module.js";

@Module({
  imports: [JournalsModule, MoodsModule, InsightsModule, UsersModule, AiModule],
  controllers: [DashboardController],
  providers: [DashboardService]
})
export class DashboardModule {}
