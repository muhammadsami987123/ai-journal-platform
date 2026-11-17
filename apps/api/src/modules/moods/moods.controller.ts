import { Controller, Delete, Get, Param, Query } from "@nestjs/common";
import {
  moodRangeQuerySchema,
  uuidSchema,
  type MoodRecord
} from "@journal/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { ZodPipe } from "../../common/pipes/zod.pipe.js";
import type { AuthenticatedUser } from "../../auth/session.types.js";
import { MoodsRepository } from "./moods.repository.js";
import { JournalsService } from "../journals/journals.service.js";

interface MoodRangeQuery {
  from?: string;
  to?: string;
}

@Controller("v1/moods")
export class MoodsController {
  constructor(
    private readonly moods: MoodsRepository,
    private readonly journals: JournalsService
  ) {}

  @Get()
  range(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodPipe(moodRangeQuerySchema)) query: MoodRangeQuery
  ): Promise<MoodRecord[]> {
    return this.moods.range(user.id, query.from, query.to);
  }

  @Delete(":entryId")
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param("entryId", new ZodPipe(uuidSchema)) entryId: string
  ): Promise<void> {
    await this.journals.removeMood(user.id, entryId);
  }
}
