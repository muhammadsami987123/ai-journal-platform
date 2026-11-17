import { Module } from "@nestjs/common";
import { AiController } from "./ai.controller.js";
import { AiRepository } from "./ai.repository.js";
import { AiService } from "./ai.service.js";
import { JournalsModule } from "../journals/journals.module.js";
import { VoiceModule } from "../voice/voice.module.js";

@Module({
  imports: [JournalsModule, VoiceModule],
  controllers: [AiController],
  providers: [AiService, AiRepository],
  exports: [AiService, AiRepository]
})
export class AiModule {}
