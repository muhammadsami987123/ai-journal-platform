import { Module } from "@nestjs/common";
import { CalendarController } from "./calendar.controller.js";
import { CalendarRepository } from "./calendar.repository.js";
import { JournalsModule } from "../journals/journals.module.js";

@Module({
  imports: [JournalsModule],
  controllers: [CalendarController],
  providers: [CalendarRepository],
  exports: [CalendarRepository]
})
export class CalendarModule {}
