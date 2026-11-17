import { Injectable } from "@nestjs/common";
import type {
  Answer,
  AnswersUpsertInput,
  CalendarDayDetail,
  EntryCreateInput,
  EntryDetail,
  EntryListQuery,
  EntrySummary,
  EntryUpdateInput,
  JournalEntry,
  MoodRecord,
  MoodSetInput,
  Paginated
} from "@journal/shared";
import { EntriesRepository } from "./entries.repository.js";
import { AnswersRepository } from "./answers.repository.js";
import { MoodsRepository } from "../moods/moods.repository.js";

/** Domain orchestration for entries, answers and the entry's mood. */
@Injectable()
export class JournalsService {
  constructor(
    private readonly entries: EntriesRepository,
    private readonly answersRepo: AnswersRepository,
    private readonly moods: MoodsRepository
  ) {}

  list(userId: string, query: EntryListQuery): Promise<Paginated<EntrySummary>> {
    return this.entries.list(userId, query);
  }

  create(userId: string, input: EntryCreateInput): Promise<JournalEntry> {
    return this.entries.create(userId, input);
  }

  detail(userId: string, entryId: string): Promise<EntryDetail> {
    return this.entries.detail(userId, entryId);
  }

  day(userId: string, date: string): Promise<CalendarDayDetail> {
    return this.entries.dayDetail(userId, date);
  }

  update(userId: string, entryId: string, input: EntryUpdateInput): Promise<JournalEntry> {
    return this.entries.update(userId, entryId, input);
  }

  complete(userId: string, entryId: string, finalText?: string): Promise<JournalEntry> {
    return this.entries.complete(userId, entryId, finalText);
  }

  reopen(userId: string, entryId: string): Promise<JournalEntry> {
    return this.entries.reopen(userId, entryId);
  }

  remove(userId: string, entryId: string): Promise<void> {
    return this.entries.softDelete(userId, entryId);
  }

  restore(userId: string, entryId: string): Promise<JournalEntry> {
    return this.entries.restore(userId, entryId);
  }

  answers(userId: string, entryId: string): Promise<Answer[]> {
    return this.answersRepo.list(userId, entryId);
  }

  upsertAnswers(userId: string, entryId: string, input: AnswersUpsertInput): Promise<Answer[]> {
    return this.answersRepo.upsert(userId, entryId, input);
  }

  setMood(userId: string, entryId: string, input: MoodSetInput): Promise<MoodRecord> {
    return this.moods.setForEntry(userId, entryId, input);
  }

  removeMood(userId: string, entryId: string): Promise<void> {
    return this.moods.removeForEntry(userId, entryId);
  }
}
