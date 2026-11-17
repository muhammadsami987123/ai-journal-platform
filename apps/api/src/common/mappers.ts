import type {
  AiGenerationRow,
  AnswerRow,
  EntryRow,
  MoodRow,
  PreferencesRow,
  ProfileRow,
  QuestionRow,
  ReminderRow,
  TranscriptionRow
} from "@journal/database/schema";
import type {
  AiGeneration,
  Answer,
  JournalEntry,
  MoodRecord,
  Preferences,
  Profile,
  Question,
  ReminderSettings,
  Transcript
} from "@journal/shared";

export function mapEntry(row: EntryRow): JournalEntry {
  return {
    id: row.id,
    user_id: row.userId,
    entry_date: row.entryDate,
    title: row.title,
    original_text: row.originalText,
    final_text: row.finalText,
    language: row.language,
    status: row.status === "complete" ? "complete" : "draft",
    ai_generation_id: row.aiGenerationId,
    word_count: row.wordCount,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
    deleted_at: row.deletedAt ? row.deletedAt.toISOString() : null
  };
}

export function mapQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    user_id: row.userId,
    prompt: row.prompt,
    sort_order: row.sortOrder,
    is_active: row.isActive,
    is_system: row.isSystem,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString()
  };
}

export function mapAnswer(row: AnswerRow, prompt?: string): Answer {
  return {
    id: row.id,
    entry_id: row.entryId,
    question_id: row.questionId,
    ...(prompt ? { prompt } : {}),
    answer_text: row.answerText,
    is_skipped: row.isSkipped,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString()
  };
}

export function mapMood(row: MoodRow): MoodRecord {
  return {
    id: row.id,
    user_id: row.userId,
    entry_id: row.entryId,
    record_date: row.recordDate,
    mood: row.mood as MoodRecord["mood"],
    intensity: row.intensity,
    note: row.note,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString()
  };
}

export function mapTranscription(row: TranscriptionRow): Transcript {
  return {
    id: row.id,
    user_id: row.userId,
    entry_id: row.entryId,
    text: row.text,
    language: row.language,
    provider: row.provider === "server" ? "server" : "browser",
    duration_ms: row.durationMs,
    created_at: row.createdAt.toISOString()
  };
}

export function mapGeneration(row: AiGenerationRow): AiGeneration {
  return {
    id: row.id,
    user_id: row.userId,
    entry_id: row.entryId,
    source_type: row.sourceType === "transcription" ? "transcription" : "text",
    source_ref_id: row.sourceRefId,
    output_json: row.outputJson,
    output_markdown: row.outputMarkdown,
    language: row.language,
    is_translation: row.isTranslation,
    model: row.model,
    provider: row.provider,
    prompt_version: row.promptVersion,
    is_approved: row.isApproved,
    approved_at: row.approvedAt ? row.approvedAt.toISOString() : null,
    tokens_in: row.tokensIn,
    tokens_out: row.tokensOut,
    created_at: row.createdAt.toISOString()
  };
}

export function mapProfile(row: ProfileRow): Profile {
  return {
    user_id: row.userId,
    display_name: row.displayName,
    avatar_url: row.avatarUrl,
    bio: row.bio,
    timezone: row.timezone,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString()
  };
}

export function mapPreferences(row: PreferencesRow): Preferences {
  return {
    user_id: row.userId,
    default_language: row.defaultLanguage,
    ai_output_language: row.aiOutputLanguage,
    week_starts_on: row.weekStartsOn === 0 ? 0 : 1,
    theme_accent: row.themeAccent,
    autosave_enabled: row.autosaveEnabled,
    reduced_motion: row.reducedMotion,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString()
  };
}

export function mapReminder(row: ReminderRow): ReminderSettings {
  return {
    user_id: row.userId,
    enabled: row.enabled,
    time_local: row.timeLocal.slice(0, 5),
    timezone: row.timezone,
    channel: row.channel === "in_app" ? "in_app" : "browser",
    consent_at: row.consentAt ? row.consentAt.toISOString() : null,
    last_sent_at: row.lastSentAt ? row.lastSentAt.toISOString() : null
  };
}

/** First N characters of the entry, on one line, for list surfaces. */
export function buildExcerpt(text: string, length = 180): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= length) return flat;
  return `${flat.slice(0, length).trimEnd()}…`;
}
