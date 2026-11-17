import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from "@nestjs/common";
import {
  questionCreateSchema,
  questionUpdateSchema,
  uuidSchema,
  type Question,
  type QuestionCreateInput,
  type QuestionUpdateInput
} from "@journal/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { ZodPipe } from "../../common/pipes/zod.pipe.js";
import type { AuthenticatedUser } from "../../auth/session.types.js";
import { QuestionsRepository } from "./questions.repository.js";

@Controller("v1/questions")
export class QuestionsController {
  constructor(private readonly questions: QuestionsRepository) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser): Promise<Question[]> {
    return this.questions.list(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodPipe(questionCreateSchema)) body: QuestionCreateInput
  ): Promise<Question> {
    return this.questions.create(user.id, body);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ZodPipe(uuidSchema)) id: string,
    @Body(new ZodPipe(questionUpdateSchema)) body: QuestionUpdateInput
  ): Promise<Question> {
    return this.questions.update(user.id, id, body);
  }

  @Delete(":id")
  @HttpCode(204)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ZodPipe(uuidSchema)) id: string
  ): Promise<void> {
    await this.questions.deactivate(user.id, id);
  }
}
