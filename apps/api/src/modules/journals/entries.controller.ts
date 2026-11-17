import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query
} from "@nestjs/common";
import {
  answersUpsertSchema,
  entryCompleteSchema,
  entryCreateSchema,
  entryListQuerySchema,
  entryUpdateSchema,
  moodSetSchema,
  uuidSchema,
  type Answer,
  type AnswersUpsertInput,
  type EntryCreateInput,
  type EntryDetail,
  type EntryListQuery,
  type EntrySummary,
  type EntryUpdateInput,
  type JournalEntry,
  type MoodRecord,
  type MoodSetInput,
  type Paginated
} from "@journal/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { ZodPipe } from "../../common/pipes/zod.pipe.js";
import { AppException } from "../../common/errors/app.exception.js";
import type { AuthenticatedUser } from "../../auth/session.types.js";
import { JournalsService } from "./journals.service.js";

@Controller("v1/entries")
export class EntriesController {
  constructor(private readonly journals: JournalsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodPipe(entryListQuerySchema)) query: EntryListQuery
  ): Promise<Paginated<EntrySummary>> {
    return this.journals.list(user.id, query);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodPipe(entryCreateSchema)) body: EntryCreateInput
  ): Promise<JournalEntry> {
    return this.journals.create(user.id, body);
  }

  @Get(":id")
  detail(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ZodPipe(uuidSchema)) id: string
  ): Promise<EntryDetail> {
    return this.journals.detail(user.id, id);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ZodPipe(uuidSchema)) id: string,
    @Body(new ZodPipe(entryUpdateSchema)) body: EntryUpdateInput
  ): Promise<JournalEntry> {
    // `original_text` is append-only: editing it would rewrite the user's own
    // words. The schema accepts the key only so we can reject it here.
    if (body.original_text !== undefined) {
      throw new AppException(
        "IMMUTABLE_FIELD",
        "The original text cannot be changed. Edit the final text instead.",
        409
      );
    }
    return this.journals.update(user.id, id, body);
  }

  @Post(":id/complete")
  @HttpCode(200)
  complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ZodPipe(uuidSchema)) id: string,
    @Body(new ZodPipe(entryCompleteSchema)) body: { final_text?: string }
  ): Promise<JournalEntry> {
    return this.journals.complete(user.id, id, body.final_text);
  }

  @Post(":id/reopen")
  @HttpCode(200)
  reopen(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ZodPipe(uuidSchema)) id: string
  ): Promise<JournalEntry> {
    return this.journals.reopen(user.id, id);
  }

  @Delete(":id")
  @HttpCode(204)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ZodPipe(uuidSchema)) id: string
  ): Promise<void> {
    await this.journals.remove(user.id, id);
  }

  @Post(":id/restore")
  @HttpCode(200)
  restore(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ZodPipe(uuidSchema)) id: string
  ): Promise<JournalEntry> {
    return this.journals.restore(user.id, id);
  }

  /* ------------------------------------------------------------- answers */

  @Get(":id/answers")
  answers(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ZodPipe(uuidSchema)) id: string
  ): Promise<Answer[]> {
    return this.journals.answers(user.id, id);
  }

  @Put(":id/answers")
  upsertAnswers(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ZodPipe(uuidSchema)) id: string,
    @Body(new ZodPipe(answersUpsertSchema)) body: AnswersUpsertInput
  ): Promise<Answer[]> {
    return this.journals.upsertAnswers(user.id, id, body);
  }

  /* ---------------------------------------------------------------- mood */

  @Put(":id/mood")
  setMood(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ZodPipe(uuidSchema)) id: string,
    @Body(new ZodPipe(moodSetSchema)) body: MoodSetInput
  ): Promise<MoodRecord> {
    return this.journals.setMood(user.id, id, body);
  }

  @Delete(":id/mood")
  @HttpCode(204)
  async removeMood(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ZodPipe(uuidSchema)) id: string
  ): Promise<void> {
    await this.journals.removeMood(user.id, id);
  }
}
