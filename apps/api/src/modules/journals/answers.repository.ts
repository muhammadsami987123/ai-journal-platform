import { Inject, Injectable } from "@nestjs/common";
import { answers, questions} from "@journal/database/schema";
import type { Database } from "@journal/database";
import type { Answer, AnswersUpsertInput } from "@journal/shared";
import { and, asc, eq, inArray, or } from "drizzle-orm";
import { DATABASE } from "../../database/database.module.js";
import { AppException } from "../../common/errors/app.exception.js";
import { mapAnswer } from "../../common/mappers.js";
import { EntriesRepository } from "./entries.repository.js";

@Injectable()
export class AnswersRepository {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly entries: EntriesRepository
  ) {}

  async list(userId: string, entryId: string): Promise<Answer[]> {
    await this.entries.verifyEntryOwnership(userId, entryId);
    const rows = await this.db
      .select({ answer: answers, prompt: questions.prompt })
      .from(answers)
      .innerJoin(questions, eq(answers.questionId, questions.id))
      .where(eq(answers.entryId, entryId))
      .orderBy(asc(questions.sortOrder));
    return rows.map(({ answer, prompt }) => mapAnswer(answer, prompt));
  }

  /**
   * Atomic batch upsert. Question ids are validated against the caller's
   * custom questions plus system questions before anything is written.
   */
  async upsert(userId: string, entryId: string, input: AnswersUpsertInput): Promise<Answer[]> {
    await this.entries.verifyEntryOwnership(userId, entryId);

    if (input.answers.length === 0) return this.list(userId, entryId);

    const ids = [...new Set(input.answers.map((answer) => answer.question_id))];
    const allowed = await this.db
      .select({ id: questions.id })
      .from(questions)
      .where(
        and(
          inArray(questions.id, ids),
          or(eq(questions.isSystem, true), eq(questions.userId, userId))
        )
      );

    if (allowed.length !== ids.length) {
      throw AppException.notFound("QUESTION_NOT_FOUND", "One of the questions no longer exists.");
    }

    await this.db.transaction(async (tx) => {
      for (const answer of input.answers) {
        const isSkipped = answer.is_skipped === true;
        await tx
          .insert(answers)
          .values({
            entryId,
            questionId: answer.question_id,
            answerText: isSkipped ? "" : (answer.answer_text ?? ""),
            isSkipped
          })
          .onConflictDoUpdate({
            target: [answers.entryId, answers.questionId],
            set: {
              answerText: isSkipped ? "" : (answer.answer_text ?? ""),
              isSkipped,
              updatedAt: new Date()
            }
          });
      }
    });

    return this.list(userId, entryId);
  }
}
