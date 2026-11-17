import { Module } from "@nestjs/common";
import { AuthModule } from "@thallesp/nestjs-better-auth";
import { auth } from "./auth/auth.js";
import { DatabaseModule } from "./database/database.module.js";
import { AiModule } from "./modules/ai/ai.module.js";
import { CalendarModule } from "./modules/calendar/calendar.module.js";
import { DashboardModule } from "./modules/dashboard/dashboard.module.js";
import { HealthModule } from "./modules/health/health.module.js";
import { InsightsModule } from "./modules/insights/insights.module.js";
import { JournalsModule } from "./modules/journals/journals.module.js";
import { MoodsModule } from "./modules/moods/moods.module.js";
import { QuestionsModule } from "./modules/questions/questions.module.js";
import { RemindersModule } from "./modules/reminders/reminders.module.js";
import { UsersModule } from "./modules/users/users.module.js";
import { VoiceModule } from "./modules/voice/voice.module.js";

/**
 * Root module.
 *
 * AuthModule.forRoot registers a global AuthGuard and mounts Better Auth at
 * `/api/auth/*`. Every other route is private unless decorated with
 * `@Public()` (T2.2).
 */
@Module({
  imports: [
    DatabaseModule,
    AuthModule.forRoot({
      auth,
      bodyParser: {
        json: { limit: "1mb" },
        urlencoded: { limit: "1mb", extended: true }
      }
    }),
    HealthModule,
    UsersModule,
    QuestionsModule,
    JournalsModule,
    MoodsModule,
    CalendarModule,
    InsightsModule,
    VoiceModule,
    AiModule,
    DashboardModule,
    RemindersModule
  ]
})
export class AppModule {}
