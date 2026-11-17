import { forwardRef, Module } from "@nestjs/common";
import { EntriesController } from "./entries.controller.js";
import { EntriesRepository } from "./entries.repository.js";
import { AnswersRepository } from "./answers.repository.js";
import { JournalsService } from "./journals.service.js";
import { MoodsModule } from "../moods/moods.module.js";

// MoodsModule needs JournalsService (entry ownership checks) and JournalsService
// needs MoodsRepository (entry mood), so the two modules reference each other.
@Module({
  imports: [forwardRef(() => MoodsModule)],
  controllers: [EntriesController],
  providers: [JournalsService, EntriesRepository, AnswersRepository],
  exports: [JournalsService, EntriesRepository, AnswersRepository]
})
export class JournalsModule {}
