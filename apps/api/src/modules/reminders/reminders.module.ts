import { Module } from "@nestjs/common";
import { RemindersController } from "./reminders.controller.js";
import { RemindersRepository } from "./reminders.repository.js";

@Module({
  controllers: [RemindersController],
  providers: [RemindersRepository],
  exports: [RemindersRepository]
})
export class RemindersModule {}
