import { Module } from "@nestjs/common";
import { QuestionsController } from "./questions.controller.js";
import { QuestionsRepository } from "./questions.repository.js";

@Module({
  controllers: [QuestionsController],
  providers: [QuestionsRepository],
  exports: [QuestionsRepository]
})
export class QuestionsModule {}
