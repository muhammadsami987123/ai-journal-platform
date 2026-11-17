import { Inject, Injectable } from "@nestjs/common";
import {
  aiGenerations,
  answers,
  entries,
  moods,
  preferences,
  profiles,
  questions,
  reminders,
  transcriptions} from "@journal/database/schema";
import type { Database } from "@journal/database";
import type {
  Preferences,
  PreferencesUpdateInput,
  Profile,
  ProfileUpdateInput
} from "@journal/shared";
import { and, asc, eq, isNull } from "drizzle-orm";
import { DATABASE } from "../../database/database.module.js";
import { AppException } from "../../common/errors/app.exception.js";
import { mapPreferences, mapProfile } from "../../common/mappers.js";

@Injectable()
export class UsersRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async getProfile(userId: string): Promise<Profile> {
    const [row] = await this.db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);
    if (!row) throw AppException.notFound("NOT_FOUND", "Profile not found.");
    return mapProfile(row);
  }

  async updateProfile(userId: string, input: ProfileUpdateInput): Promise<Profile> {
    const [row] = await this.db
      .update(profiles)
      .set({
        ...(input.display_name !== undefined ? { displayName: input.display_name } : {}),
        ...(input.bio !== undefined ? { bio: input.bio } : {}),
        ...(input.avatar_url !== undefined ? { avatarUrl: input.avatar_url } : {}),
        ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
        updatedAt: new Date()
      })
      .where(eq(profiles.userId, userId))
      .returning();

    if (!row) throw AppException.notFound("NOT_FOUND", "Profile not found.");
    return mapProfile(row);
  }

  async getPreferences(userId: string): Promise<Preferences> {
    const [row] = await this.db
      .select()
      .from(preferences)
      .where(eq(preferences.userId, userId))
      .limit(1);
    if (!row) throw AppException.notFound("NOT_FOUND", "Preferences not found.");
    return mapPreferences(row);
  }

  async updatePreferences(
    userId: string,
    input: PreferencesUpdateInput
  ): Promise<Preferences> {
    const [row] = await this.db
      .update(preferences)
      .set({
        ...(input.default_language !== undefined ? { defaultLanguage: input.default_language } : {}),
        ...(input.ai_output_language !== undefined
          ? { aiOutputLanguage: input.ai_output_language }
          : {}),
        ...(input.week_starts_on !== undefined ? { weekStartsOn: input.week_starts_on } : {}),
        ...(input.theme_accent !== undefined ? { themeAccent: input.theme_accent } : {}),
        ...(input.autosave_enabled !== undefined ? { autosaveEnabled: input.autosave_enabled } : {}),
        ...(input.reduced_motion !== undefined ? { reducedMotion: input.reduced_motion } : {}),
        updatedAt: new Date()
      })
      .where(eq(preferences.userId, userId))
      .returning();

    if (!row) throw AppException.notFound("NOT_FOUND", "Preferences not found.");
    return mapPreferences(row);
  }

  /**
   * Full personal export (T12.3). Includes soft-deleted entries so nothing the
   * user ever wrote is silently omitted.
   */
  async exportAll(userId: string): Promise<Record<string, unknown>> {
    const [
      profile,
      preferenceRow,
      reminderRow,
      entryRows,
      answerRows,
      moodRows,
      transcriptRows,
      generationRows,
      questionRows
    ] = await Promise.all([
      this.getProfile(userId),
      this.db.select().from(preferences).where(eq(preferences.userId, userId)).limit(1),
      this.db.select().from(reminders).where(eq(reminders.userId, userId)).limit(1),
      this.db
        .select()
        .from(entries)
        .where(eq(entries.userId, userId))
        .orderBy(asc(entries.entryDate)),
      this.db
        .select({ answer: answers, entryId: entries.id })
        .from(answers)
        .innerJoin(entries, eq(answers.entryId, entries.id))
        .where(eq(entries.userId, userId)),
      this.db.select().from(moods).where(eq(moods.userId, userId)),
      this.db.select().from(transcriptions).where(eq(transcriptions.userId, userId)),
      this.db.select().from(aiGenerations).where(eq(aiGenerations.userId, userId)),
      this.db
        .select()
        .from(questions)
        .where(and(eq(questions.userId, userId), isNull(questions.isSystem)))
    ]);

    return {
      exported_at: new Date().toISOString(),
      user_id: userId,
      profile,
      preferences: preferenceRow[0] ? mapPreferences(preferenceRow[0]) : null,
      reminders: reminderRow[0] ?? null,
      entries: entryRows.map((row) => ({
        id: row.id,
        entry_date: row.entryDate,
        title: row.title,
        original_text: row.originalText,
        final_text: row.finalText,
        language: row.language,
        status: row.status,
        word_count: row.wordCount,
        created_at: row.createdAt,
        updated_at: row.updatedAt,
        deleted_at: row.deletedAt
      })),
      answers: answerRows.map(({ answer }) => ({
        entry_id: answer.entryId,
        question_id: answer.questionId,
        answer_text: answer.answerText,
        is_skipped: answer.isSkipped
      })),
      moods: moodRows.map((row) => ({
        entry_id: row.entryId,
        record_date: row.recordDate,
        mood: row.mood,
        intensity: row.intensity,
        note: row.note
      })),
      transcriptions: transcriptRows.map((row) => ({
        id: row.id,
        entry_id: row.entryId,
        text: row.text,
        language: row.language,
        provider: row.provider,
        duration_ms: row.durationMs,
        created_at: row.createdAt
      })),
      ai_generations: generationRows.map((row) => ({
        id: row.id,
        entry_id: row.entryId,
        source_type: row.sourceType,
        output_json: row.outputJson,
        output_markdown: row.outputMarkdown,
        language: row.language,
        is_translation: row.isTranslation,
        model: row.model,
        provider: row.provider,
        prompt_version: row.promptVersion,
        is_approved: row.isApproved,
        approved_at: row.approvedAt,
        created_at: row.createdAt
      })),
      custom_questions: questionRows.map((row) => ({
        id: row.id,
        prompt: row.prompt,
        sort_order: row.sortOrder,
        is_active: row.isActive
      }))
    };
  }
}
