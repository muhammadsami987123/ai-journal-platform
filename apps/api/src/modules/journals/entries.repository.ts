import { Inject, Injectable } from "@nestjs/common";
import {
  aiGenerations,
  answers,
  entries,
  moods,
  questions,
  transcriptions,
  type EntryRow
} from "@journal/database/schema";
import type { Database } from "@journal/database";
import {
  countWords,
  type AiGeneration,
  type Answer,
  type CalendarDayDetail,
  type EntryCreateInput,
  type EntryDetail,
  type EntryListQuery,
  type EntrySummary,
  type EntryUpdateInput,
  type JournalEntry,
  type Paginated
} from "@journal/shared";
import { and, asc, desc, eq, gt, gte, inArray, isNotNull, isNull, lt, lte, sql, type SQL } from "drizzle-orm";
import { DATABASE } from "../../database/database.module.js";
import { AppException } from "../../common/errors/app.exception.js";
import {
  buildExcerpt,
  mapAnswer,
  mapEntry,
  mapGeneration,
  mapMood,
  mapTranscription
} from "../../common/mappers.js";

const RETENTION_DAYS = 30;

interface Cursor {
  d: string;
  id: string;
}

function encodeCursor(entryDate: string, id: string): string {
  return Buffer.from(JSON.stringify({ d: entryDate, id }), "utf8").toString("base64url");
}

function decodeCursor(cursor: string): Cursor | null {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as Partial<Cursor>;
    if (typeof parsed.d === "string" && typeof parsed.id === "string") {
      return { d: parsed.d, id: parsed.id };
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Every method takes userId first and includes it in the predicate.
 * There is no API surface that can read an entry by id alone.
 */
@Injectable()
export class EntriesRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /* ------------------------------------------------------------------ read */

  private async requireRow(userId: string, entryId: string, includeDeleted = false): Promise<EntryRow> {
    const conditions: SQL[] = [eq(entries.userId, userId), eq(entries.id, entryId)];
    if (!includeDeleted) conditions.push(isNull(entries.deletedAt));

    const [row] = await this.db
      .select()
      .from(entries)
      .where(and(...conditions))
      .limit(1);

    if (!row) {
      throw AppException.notFound("ENTRY_NOT_FOUND", "Journal entry not found.");
    }
    return row;
  }

  async findById(userId: string, entryId: string): Promise<JournalEntry> {
    return mapEntry(await this.requireRow(userId, entryId));
  }

  async detail(userId: string, entryId: string): Promise<EntryDetail> {
    const row = await this.requireRow(userId, entryId);
    const entryId_ = row.id;

    const [answerRows, moodRows, generationRows, transcriptRows] = await Promise.all([
      this.db
        .select({ answer: answers, prompt: questions.prompt })
        .from(answers)
        .innerJoin(questions, eq(answers.questionId, questions.id))
        .where(eq(answers.entryId, entryId_))
        .orderBy(asc(questions.sortOrder)),
      this.db.select().from(moods).where(eq(moods.entryId, entryId_)).limit(1),
      this.db
        .select()
        .from(aiGenerations)
        .where(eq(aiGenerations.entryId, entryId_))
        .orderBy(desc(aiGenerations.createdAt)),
      this.db
        .select()
        .from(transcriptions)
        .where(eq(transcriptions.entryId, entryId_))
        .orderBy(desc(transcriptions.createdAt))
        .limit(1)
    ]);

    const answersMapped: Answer[] = answerRows.map(({ answer, prompt }) => mapAnswer(answer, prompt));

    return {
      entry: mapEntry(row),
      answers: answersMapped,
      mood: moodRows[0] ? mapMood(moodRows[0]) : null,
      generations: generationRows.map(mapGeneration) as AiGeneration[],
      transcript: transcriptRows[0] ? mapTranscription(transcriptRows[0]) : null
    };
  }

  async list(userId: string, query: EntryListQuery): Promise<Paginated<EntrySummary>> {
    const conditions: SQL[] = [eq(entries.userId, userId)];

    if (!query.include_deleted) conditions.push(isNull(entries.deletedAt));
    if (query.status) conditions.push(eq(entries.status, query.status));
    if (query.from) conditions.push(gte(entries.entryDate, query.from));
    if (query.to) conditions.push(lte(entries.entryDate, query.to));

    if (query.q) {
      const term = `%${query.q.replace(/[%_]/g, (m) => `\\${m}`)}%`;
      conditions.push(
        sql`(
          to_tsvector('simple', coalesce(${entries.title}, '') || ' ' || ${entries.finalText})
            @@ plainto_tsquery('simple', ${query.q})
          or ${entries.finalText} ilike ${term}
          or coalesce(${entries.title}, '') ilike ${term}
        )`
      );
    }

    if (query.mood) {
      const wanted = Array.isArray(query.mood) ? query.mood : [query.mood];
      if (wanted.length > 0) {
        const values = sql.join(
          wanted.map((mood) => sql`${mood}`),
          sql`, `
        );
        conditions.push(
          sql`exists (select 1 from moods m where m.entry_id = ${entries.id} and m.mood in (${values}))`
        );
      }
    }

    if (query.hasAi === true) {
      conditions.push(
        sql`exists (select 1 from ai_generations g where g.entry_id = ${entries.id} and g.is_approved = true)`
      );
    } else if (query.hasAi === false) {
      conditions.push(
        sql`not exists (select 1 from ai_generations g where g.entry_id = ${entries.id} and g.is_approved = true)`
      );
    }

    const cursor = query.cursor ? decodeCursor(query.cursor) : null;
    const newestFirst = query.sort !== "oldest";

    if (cursor) {
      conditions.push(
        newestFirst
          ? sql`(${entries.entryDate} < ${cursor.d} or (${entries.entryDate} = ${cursor.d} and ${entries.id} < ${cursor.id}))`
          : sql`(${entries.entryDate} > ${cursor.d} or (${entries.entryDate} = ${cursor.d} and ${entries.id} > ${cursor.id}))`
      );
    }

    const rows = await this.db
      .select()
      .from(entries)
      .where(and(...conditions))
      .orderBy(
        newestFirst ? desc(entries.entryDate) : asc(entries.entryDate),
        newestFirst ? desc(entries.id) : asc(entries.id)
      )
      .limit(query.limit + 1);

    const page = rows.slice(0, query.limit);
    const last = page[page.length - 1];
    const nextCursor =
      rows.length > query.limit && last ? encodeCursor(last.entryDate, last.id) : null;

    const items = await this.decorateSummaries(userId, page);
    return { items, next_cursor: nextCursor };
  }

  private async decorateSummaries(
    userId: string,
    rows: EntryRow[]
  ): Promise<EntrySummary[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((row) => row.id);

    const [moodRows, aiRows, transcriptRows] = await Promise.all([
      this.db
        .select({ entryId: moods.entryId, mood: moods.mood })
        .from(moods)
        .where(and(eq(moods.userId, userId), inArray(moods.entryId, ids))),
      this.db
        .select({ entryId: aiGenerations.entryId })
        .from(aiGenerations)
        .where(
          and(
            eq(aiGenerations.userId, userId),
            eq(aiGenerations.isApproved, true),
            inArray(aiGenerations.entryId, ids)
          )
        ),
      this.db
        .select({ entryId: transcriptions.entryId })
        .from(transcriptions)
        .where(
          and(
            eq(transcriptions.userId, userId),
            isNotNull(transcriptions.entryId),
            inArray(transcriptions.entryId, ids)
          )
        )
    ]);

    const moodsByEntry = new Map<string, EntrySummary["moods"]>();
    for (const row of moodRows) {
      if (!row.entryId) continue;
      const list = moodsByEntry.get(row.entryId) ?? [];
      list.push(row.mood as EntrySummary["moods"][number]);
      moodsByEntry.set(row.entryId, list);
    }

    const aiEntries = new Set(aiRows.map((row) => row.entryId).filter(Boolean));
    const transcriptEntries = new Set(transcriptRows.map((row) => row.entryId).filter(Boolean));

    return rows.map((row) => ({
      id: row.id,
      entry_date: row.entryDate,
      title: row.title,
      excerpt: buildExcerpt(row.finalText || row.originalText),
      status: row.status === "complete" ? "complete" : "draft",
      word_count: row.wordCount,
      moods: moodsByEntry.get(row.id) ?? [],
      has_ai: aiEntries.has(row.id),
      has_transcript: transcriptEntries.has(row.id),
      language: row.language,
      updated_at: row.updatedAt.toISOString(),
      deleted_at: row.deletedAt ? row.deletedAt.toISOString() : null
    }));
  }

  async dayDetail(userId: string, date: string): Promise<CalendarDayDetail> {
    const rows = await this.db
      .select()
      .from(entries)
      .where(
        and(eq(entries.userId, userId), eq(entries.entryDate, date), isNull(entries.deletedAt))
      )
      .orderBy(asc(entries.createdAt));

    const moodRows = await this.db
      .select()
      .from(moods)
      .where(and(eq(moods.userId, userId), eq(moods.recordDate, date)));

    return {
      date,
      entries: await this.decorateSummaries(userId, rows),
      moods: moodRows.map(mapMood)
    };
  }

  /* ----------------------------------------------------------------- write */

  async create(userId: string, input: EntryCreateInput): Promise<JournalEntry> {
    const finalText = input.final_text ?? input.original_text ?? "";
    const originalText =
      input.original_text && input.original_text.trim().length > 0 ? input.original_text : finalText;

    const [row] = await this.db
      .insert(entries)
      .values({
        userId,
        entryDate: input.entry_date,
        title: input.title ?? null,
        originalText,
        finalText,
        language: input.language ?? null,
        wordCount: countWords(finalText)
      })
      .returning();

    if (!row) throw new AppException("INTERNAL_ERROR", "The entry could not be created.", 500);
    return mapEntry(row);
  }

  async update(userId: string, entryId: string, input: EntryUpdateInput): Promise<JournalEntry> {
    const existing = await this.requireRow(userId, entryId);
    const nextFinal = input.final_text ?? existing.finalText;

    if (nextFinal.length > 100_000) {
      throw new AppException("ENTRY_TOO_LONG", "This entry is too long.", 422);
    }

    // The first non-empty text becomes the immutable original (T7.7).
    const originalText =
      existing.originalText.length === 0 && nextFinal.trim().length > 0
        ? nextFinal
        : existing.originalText;

    const [row] = await this.db
      .update(entries)
      .set({
        entryDate: input.entry_date ?? existing.entryDate,
        title: input.title === undefined ? existing.title : input.title,
        finalText: nextFinal,
        originalText,
        language: input.language === undefined ? existing.language : input.language,
        wordCount: countWords(nextFinal),
        updatedAt: new Date()
      })
      .where(and(eq(entries.id, entryId), eq(entries.userId, userId)))
      .returning();

    if (!row) throw AppException.notFound("ENTRY_NOT_FOUND", "Journal entry not found.");
    return mapEntry(row);
  }

  async complete(userId: string, entryId: string, finalText?: string): Promise<JournalEntry> {
    const existing = await this.requireRow(userId, entryId);
    const nextFinal = finalText ?? existing.finalText;

    if (nextFinal.trim().length === 0) {
      throw new AppException(
        "ENTRY_EMPTY",
        "Write something before marking the entry complete.",
        422
      );
    }

    const originalText = existing.originalText.length === 0 ? nextFinal : existing.originalText;

    const [row] = await this.db
      .update(entries)
      .set({
        finalText: nextFinal,
        originalText,
        status: "complete",
        wordCount: countWords(nextFinal),
        updatedAt: new Date()
      })
      .where(and(eq(entries.id, entryId), eq(entries.userId, userId)))
      .returning();

    if (!row) throw AppException.notFound("ENTRY_NOT_FOUND", "Journal entry not found.");
    return mapEntry(row);
  }

  async reopen(userId: string, entryId: string): Promise<JournalEntry> {
    await this.requireRow(userId, entryId);
    const [row] = await this.db
      .update(entries)
      .set({ status: "draft", updatedAt: new Date() })
      .where(and(eq(entries.id, entryId), eq(entries.userId, userId)))
      .returning();
    if (!row) throw AppException.notFound("ENTRY_NOT_FOUND", "Journal entry not found.");
    return mapEntry(row);
  }

  async softDelete(userId: string, entryId: string): Promise<void> {
    await this.requireRow(userId, entryId);
    await this.db
      .update(entries)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(entries.id, entryId), eq(entries.userId, userId)));
  }

  async restore(userId: string, entryId: string): Promise<JournalEntry> {
    const row = await this.requireRow(userId, entryId, true);
    if (!row.deletedAt) return mapEntry(row);

    const ageMs = Date.now() - row.deletedAt.getTime();
    if (ageMs > RETENTION_DAYS * 24 * 60 * 60 * 1000) {
      throw new AppException(
        "VALIDATION_FAILED",
        `Entries can only be restored within ${RETENTION_DAYS} days of deletion.`,
        422
      );
    }

    const [restored] = await this.db
      .update(entries)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(and(eq(entries.id, entryId), eq(entries.userId, userId)))
      .returning();

    if (!restored) throw AppException.notFound("ENTRY_NOT_FOUND", "Journal entry not found.");
    return mapEntry(restored);
  }

  /* ------------------------------------------------------- answers (owned) */

  async verifyEntryOwnership(userId: string, entryId: string): Promise<void> {
    await this.requireRow(userId, entryId);
  }

  async setMoodRecordedDate(entryId: string, date: string): Promise<void> {
    await this.db.update(moods).set({ recordDate: date }).where(eq(moods.entryId, entryId));
  }

  /** Used by the dashboard: the most recent entries across every date. */
  async recent(userId: string, limit = 5): Promise<EntrySummary[]> {
    const rows = await this.db
      .select()
      .from(entries)
      .where(and(eq(entries.userId, userId), isNull(entries.deletedAt)))
      .orderBy(desc(entries.entryDate), desc(entries.updatedAt))
      .limit(limit);
    return this.decorateSummaries(userId, rows);
  }

  /** Used by the dashboard header: entries for one business date. */
  async forDate(userId: string, date: string): Promise<EntrySummary[]> {
    const rows = await this.db
      .select()
      .from(entries)
      .where(
        and(eq(entries.userId, userId), eq(entries.entryDate, date), isNull(entries.deletedAt))
      )
      .orderBy(desc(entries.createdAt));
    return this.decorateSummaries(userId, rows);
  }

  /** Existence check used by cursor-independent range scans. */
  async countUpTo(userId: string, to: string): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(entries)
      .where(
        and(eq(entries.userId, userId), lte(entries.entryDate, to), isNull(entries.deletedAt))
      );
    return row?.count ?? 0;
  }
}
