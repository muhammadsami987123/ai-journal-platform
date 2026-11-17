import { Module } from "@nestjs/common";
import { InsightsController } from "./insights.controller.js";
import { InsightsRepository } from "./insights.repository.js";
import { InsightsService } from "./insights.service.js";
import { MoodsModule } from "../moods/moods.module.js";

@Module({
  imports: [MoodsModule],
  controllers: [InsightsController],
  providers: [InsightsRepository, InsightsService],
  exports: [InsightsService, InsightsRepository]
})
export class InsightsModule {}
