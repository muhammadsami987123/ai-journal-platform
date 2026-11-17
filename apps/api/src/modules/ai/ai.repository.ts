import { Inject, Injectable } from "@nestjs/common";
import { aiGenerations, entries} from "@journal/database/schema";
import type { Database } from "@journal/database";
import { countWords, type AiGeneration } from "@journal/shared";
import { and, desc, eq, ne } from "drizzle-orm";
import { DATABASE } from "../../database/database.module.js";
import { AppException } from "../../common/errors/app.exception.js";
import { mapGeneration } from "../../common/mappers.js";
import type { AiGenerationRow } from "@journal/database/schema";

export interface NewGenerationRecord {
  userId: string;
  entryId: string;
  sourceType: "text" | "transcription";
  sourceRefId: string | null;
  outputJson: AiGenerationRow["outputJson"];
  outputMarkdown: string;
  language: string | null;
  isTranslation: boolean;
  model: string;
  provider: string;
  promptVersion: string;
  tokensIn: number | null;
  tokensOut: number | null;
}

@Injectable()
export class AiRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async insert(record: NewGenerationRecord): Promise<AiGeneration> {
    const [row] = await this.db
      .insert(aiGenerations)
      .values({
        userId: record.userId,
        entryId: record.entryId,
        sourceType: record.sourceType,
        sourceRefId: record.sourceRefId,
        outputJson: record.outputJson,
        outputMarkdown: record.outputMarkdown,
        language: record.language,
        isTranslation: record.isTranslation,
        model: record.model,
        provider: record.provider,
        promptVersion: record.promptVersion,
        tokensIn: record.tokensIn,
        tokensOut: record.tokensOut
      })
      .returning();

    if (!row) throw new AppException("INTERNAL_ERROR", "The draft could not be saved.", 500);
    return mapGeneration(row);
  }

  async requireOwned(userId: string, generationId: string): Promise<AiGenerationRow> {
    const [row] = await this.db
      .select()
      .from(aiGenerations)
      .where(and(eq(aiGenerations.userId, userId), eq(aiGenerations.id, generationId)))
      .limit(1);
    if (!row) {
      throw AppException.notFound("NOT_FOUND", "Draft not found.");
    }
    return row;
  }

  async listByEntry(userId: string, entryId: string): Promise<AiGeneration[]> {
    const rows = await this.db
      .select()
      .from(aiGenerations)
      .where(and(eq(aiGenerations.userId, userId), eq(aiGenerations.entryId, entryId)))
      .orderBy(desc(aiGenerations.createdAt));
    return rows.map(mapGeneration);
  }

  async latestApprovedForEntry(userId: string, entryId: string): Promise<AiGeneration | null> {
    const [row] = await this.db
      .select()
      .from(aiGenerations)
      .where(
        and(
          eq(aiGenerations.userId, userId),
          eq(aiGenerations.entryId, entryId),
          eq(aiGenerations.isApproved, true)
        )
      )
      .orderBy(desc(aiGenerations.approvedAt))
      .limit(1);
    return row ? mapGeneration(row) : null;
  }

  /**
   * Explicit approval — the only path that writes entries.final_text from AI
   * output. Previous approvals for the same entry are cleared so exactly one
   * generation is marked as applied.
   */
  async approve(
    userId: string,
    generationId: string,
    editedMarkdown?: string
  ): Promise<AiGeneration> {
    const generation = await this.requireOwned(userId, generationId);
    if (!generation.entryId) {
      throw new AppException("VALIDATION_FAILED", "This draft is not attached to an entry.", 422);
    }

    const markdown = editedMarkdown?.trim() ? editedMarkdown : generation.outputMarkdown;

    return this.db.transaction(async (tx) => {
      await tx
        .update(aiGenerations)
        .set({ isApproved: false, approvedAt: null })
        .where(
          and(
            eq(aiGenerations.entryId, generation.entryId as string),
            eq(aiGenerations.userId, userId),
            ne(aiGenerations.id, generationId)
          )
        );

      const [approved] = await tx
        .update(aiGenerations)
        .set({ isApproved: true, approvedAt: new Date() })
        .where(and(eq(aiGenerations.id, generationId), eq(aiGenerations.userId, userId)))
        .returning();

      const [entry] = await tx
        .select()
        .from(entries)
        .where(and(eq(entries.id, generation.entryId as string), eq(entries.userId, userId)))
        .limit(1);

      if (!entry) {
        throw AppException.notFound("ENTRY_NOT_FOUND", "Journal entry not found.");
      }

      await tx
        .update(entries)
        .set({
          finalText: markdown,
          originalText: entry.originalText.length === 0 ? markdown : entry.originalText,
          aiGenerationId: generationId,
          wordCount: countWords(markdown),
          updatedAt: new Date()
        })
        .where(and(eq(entries.id, entry.id), eq(entries.userId, userId)));

      if (!approved) {
        throw new AppException("INTERNAL_ERROR", "The draft could not be approved.", 500);
      }
      return mapGeneration(approved);
    });
  }
}
