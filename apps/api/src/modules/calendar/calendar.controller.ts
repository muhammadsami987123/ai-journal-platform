import { Controller, Get, Param } from "@nestjs/common";
import {
  dateStringSchema,
  type CalendarDayDetail,
  type CalendarMonth
} from "@journal/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { ZodPipe } from "../../common/pipes/zod.pipe.js";
import type { AuthenticatedUser } from "../../auth/session.types.js";
import { CalendarRepository } from "./calendar.repository.js";
import { JournalsService } from "../journals/journals.service.js";
import { z } from "zod";

const monthParams = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12)
});

@Controller("v1/calendar")
export class CalendarController {
  constructor(
    private readonly calendar: CalendarRepository,
    private readonly journals: JournalsService
  ) {}

  @Get(":year/:month")
  month(
    @CurrentUser() user: AuthenticatedUser,
    @Param(new ZodPipe(monthParams)) params: { year: number; month: number }
  ): Promise<CalendarMonth> {
    return this.calendar.month(user.id, params.year, params.month);
  }

  @Get(":date")
  day(
    @CurrentUser() user: AuthenticatedUser,
    @Param("date", new ZodPipe(dateStringSchema)) date: string
  ): Promise<CalendarDayDetail> {
    return this.journals.day(user.id, date);
  }
}
