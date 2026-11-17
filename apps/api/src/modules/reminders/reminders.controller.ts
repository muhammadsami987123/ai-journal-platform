import { Body, Controller, Get, HttpCode, Post, Put } from "@nestjs/common";
import {
  reminderUpdateSchema,
  type ReminderSettings,
  type ReminderUpdateInput
} from "@journal/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { ZodPipe } from "../../common/pipes/zod.pipe.js";
import type { AuthenticatedUser } from "../../auth/session.types.js";
import { RemindersRepository } from "./reminders.repository.js";

@Controller("v1/reminders")
export class RemindersController {
  constructor(private readonly reminders: RemindersRepository) {}

  @Get()
  get(@CurrentUser() user: AuthenticatedUser): Promise<ReminderSettings> {
    return this.reminders.get(user.id);
  }

  @Put()
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodPipe(reminderUpdateSchema)) body: ReminderUpdateInput
  ): Promise<ReminderSettings> {
    return this.reminders.update(user.id, body);
  }

  /** Called only after the browser has actually granted permission. */
  @Post("consent")
  @HttpCode(200)
  consent(@CurrentUser() user: AuthenticatedUser): Promise<ReminderSettings> {
    return this.reminders.recordConsent(user.id);
  }
}
