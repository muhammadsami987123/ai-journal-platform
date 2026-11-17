import { Inject, Injectable } from "@nestjs/common";
import { questions} from "@journal/database/schema";
import type { Database } from "@journal/database";
import type { Question, QuestionCreateInput, QuestionUpdateInput } from "@journal/shared";
import { and, asc, desc, eq, or, sql } from "drizzle-orm";
import { DATABASE } from "../../database/database.module.js";
import { AppException } from "../../common/errors/app.exception.js";
import { mapQuestion } from "../../common/mappers.js";

@Injectable()
export class QuestionsRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /** System questions (global, read-only) plus the caller's custom questions. */
  async list(userId: string): Promise<Question[]> {
    const rows = await this.db
      .select()
      .from(questions)
      .where(
        and(
          eq(questions.isActive, true),
          or(eq(questions.isSystem, true), eq(questions.userId, userId))
        )
      )
      .orderBy(desc(questions.isSystem), asc(questions.sortOrder), asc(questions.createdAt));
    return rows.map(mapQuestion);
  }

  async create(userId: string, input: QuestionCreateInput): Promise<Question> {
    let sortOrder = input.sort_order;
    if (sortOrder === undefined) {
      const [row] = await this.db
        .select({ max: sql<number>`coalesce(max(${questions.sortOrder}), 0)::int` })
        .from(questions)
        .where(and(eq(questions.userId, userId), eq(questions.isSystem, false)));
      sortOrder = (row?.max ?? 0) + 1;
    }

    const [created] = await this.db
      .insert(questions)
      .values({
        userId,
        prompt: input.prompt,
        sortOrder,
        isSystem: false,
        isActive: true
      })
      .returning();

    if (!created) throw new AppException("INTERNAL_ERROR", "The question could not be saved.", 500);
    return mapQuestion(created);
  }

  async update(userId: string, questionId: string, input: QuestionUpdateInput): Promise<Question> {
    const [row] = await this.db
      .update(questions)
      .set({
        ...(input.prompt !== undefined ? { prompt: input.prompt } : {}),
        ...(input.sort_order !== undefined ? { sortOrder: input.sort_order } : {}),
        ...(input.is_active !== undefined ? { isActive: input.is_active } : {}),
        updatedAt: new Date()
      })
      .where(
        and(
          eq(questions.id, questionId),
          eq(questions.userId, userId),
          eq(questions.isSystem, false)
        )
      )
      .returning();

    if (!row) {
      throw AppException.notFound(
        "QUESTION_NOT_FOUND",
        "That question was not found, or it is a system question."
      );
    }
    return mapQuestion(row);
  }

  /** Soft delete: deactivates a custom question so its answers stay readable. */
  async deactivate(userId: string, questionId: string): Promise<void> {
    const [row] = await this.db
      .update(questions)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(questions.id, questionId),
          eq(questions.userId, userId),
          eq(questions.isSystem, false)
        )
      )
      .returning({ id: questions.id });

    if (!row) {
      throw AppException.notFound(
        "QUESTION_NOT_FOUND",
        "That question was not found, or it is a system question."
      );
    }
  }
}
