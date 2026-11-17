import { Inject, Injectable } from "@nestjs/common";
import { entries, transcriptions} from "@journal/database/schema";
import type { Database } from "@journal/database";
import type { TranscriptionCreateInput, Transcript } from "@journal/shared";
import { and, desc, eq } from "drizzle-orm";
import { DATABASE } from "../../database/database.module.js";
import { AppException } from "../../common/errors/app.exception.js";
import { mapTranscription } from "../../common/mappers.js";
import { EntriesRepository } from "../journals/entries.repository.js";

@Injectable()
export class TranscriptionsRepository {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly entries: EntriesRepository
  ) {}

  async create(userId: string, input: TranscriptionCreateInput): Promise<Transcript> {
    if (input.entry_id) {
      await this.entries.verifyEntryOwnership(userId, input.entry_id);
    }

    const [row] = await this.db
      .insert(transcriptions)
      .values({
        userId,
        entryId: input.entry_id ?? null,
        text: input.text,
        language: input.language ?? null,
        provider: input.provider,
        durationMs: input.duration_ms ?? null
      })
      .returning();

    if (!row) {
      throw new AppException("INTERNAL_ERROR", "The transcript could not be saved.", 500);
    }
    return mapTranscription(row);
  }

  async findById(userId: string, id: string): Promise<Transcript> {
    const [row] = await this.db
      .select()
      .from(transcriptions)
      .where(and(eq(transcriptions.userId, userId), eq(transcriptions.id, id)))
      .limit(1);

    if (!row) {
      throw AppException.notFound("NOT_FOUND", "Transcript not found.");
    }
    return mapTranscription(row);
  }

  async latestForEntry(userId: string, entryId: string): Promise<Transcript | null> {
    const [row] = await this.db
      .select()
      .from(transcriptions)
      .where(and(eq(transcriptions.userId, userId), eq(transcriptions.entryId, entryId)))
      .orderBy(desc(transcriptions.createdAt))
      .limit(1);
    return row ? mapTranscription(row) : null;
  }

  /** Links an already-persisted transcript to an entry (never rewrites text). */
  async linkToEntry(userId: string, transcriptId: string, entryId: string): Promise<void> {
    await this.entries.verifyEntryOwnership(userId, entryId);
    await this.db
      .update(transcriptions)
      .set({ entryId })
      .where(and(eq(transcriptions.id, transcriptId), eq(transcriptions.userId, userId)));
  }

  async entryIdExists(userId: string, entryId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: entries.id })
      .from(entries)
      .where(and(eq(entries.id, entryId), eq(entries.userId, userId)))
      .limit(1);
    return Boolean(row);
  }
}
