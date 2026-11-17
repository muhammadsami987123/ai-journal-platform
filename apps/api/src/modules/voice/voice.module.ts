import { Module } from "@nestjs/common";
import { VoiceController } from "./voice.controller.js";
import { VoiceService } from "./voice.service.js";
import { TranscriptionsRepository } from "./transcriptions.repository.js";
import { JournalsModule } from "../journals/journals.module.js";

@Module({
  imports: [JournalsModule],
  controllers: [VoiceController],
  providers: [VoiceService, TranscriptionsRepository],
  exports: [VoiceService, TranscriptionsRepository]
})
export class VoiceModule {}
