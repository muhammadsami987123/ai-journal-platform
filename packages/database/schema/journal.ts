import type { AiJournalOutput } from "@journal/shared";
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";
import { user } from "./auth.js";

/**
 * Core journal schema — implements docs/DATABASE_SCHEMA.md §3.2–§3.10.
 *
 * Rules encoded here:
 *  - every user-owned row carries user_id with ON DELETE CASCADE
 *  - multiple entries per day (no unique constraint on user+date)
 *  - original_text and transcripts are write-once (enforced by trigger in sql/constraints.sql)
 *  - AI generations are append-only; approval is a flag
 */

export const profiles = pgTable(
  "profiles",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    timezone: text("timezone").notNull().default("UTC"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull()
  },
  (table) => [check("profiles_bio_length_chk", sql`${table.bio} is null or length(${table.bio}) <= 500`)]
);

export const questions = pgTable(
  "questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    prompt: text("prompt").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    isSystem: boolean("is_system").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull()
  },
  (table) => [
    index("idx_questions_owner").on(table.userId, table.sortOrder),
    check("questions_prompt_length_chk", sql`length(${table.prompt}) <= 500`),
    check(
      "questions_system_owner_chk",
      sql`(${table.isSystem} = true and ${table.userId} is null) or (${table.isSystem} = false and ${table.userId} is not null)`
    )
  ]
);

export const entries = pgTable(
  "entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    entryDate: date("entry_date").notNull(),
    title: text("title"),
    originalText: text("original_text").notNull().default(""),
    finalText: text("final_text").notNull().default(""),
    language: text("language"),
    status: text("status").notNull().default("draft"),
    // FK to ai_generations is added in sql/constraints.sql to keep the two
    // table definitions acyclic at the TypeScript level.
    aiGenerationId: uuid("ai_generation_id"),
    wordCount: integer("word_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true })
  },
  (table) => [
    index("idx_entries_user_date").on(table.userId, table.entryDate.desc()),
    index("idx_entries_user_active").on(table.userId, table.deletedAt),
    index("idx_entries_ai_gen").on(table.aiGenerationId),
    index("idx_entries_search").using(
      "gin",
      sql`to_tsvector('simple', coalesce(${table.title}, '') || ' ' || ${table.finalText})`
    ),
    check("entries_status_chk", sql`${table.status} in ('draft', 'complete')`),
    check(
      "entries_empty_complete_chk",
      sql`${table.status} <> 'complete' or length(btrim(${table.finalText})) > 0`
    ),
    check("entries_length_chk", sql`length(${table.finalText}) <= 100000`),
    check("entries_word_count_chk", sql`${table.wordCount} >= 0`),
    check("entries_title_length_chk", sql`${table.title} is null or length(${table.title}) <= 200`)
  ]
);

export const answers = pgTable(
  "answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entryId: uuid("entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    answerText: text("answer_text").notNull().default(""),
    isSkipped: boolean("is_skipped").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull()
  },
  (table) => [
    uniqueIndex("answers_entry_question_unique").on(table.entryId, table.questionId),
    index("idx_answers_entry").on(table.entryId),
    check("answers_skip_exclusive_chk", sql`${table.isSkipped} = false or ${table.answerText} = ''`)
  ]
);

export const moods = pgTable(
  "moods",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    entryId: uuid("entry_id").references(() => entries.id, { onDelete: "cascade" }),
    recordDate: date("record_date").notNull(),
    mood: text("mood").notNull(),
    intensity: smallint("intensity"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull()
  },
  (table) => [
    uniqueIndex("moods_entry_unique").on(table.entryId),
    index("idx_moods_user_date").on(table.userId, table.recordDate),
    index("idx_moods_value").on(table.userId, table.mood),
    check(
      "moods_value_chk",
      sql`${table.mood} in ('happy','excited','peaceful','motivated','normal','tired','stressed','sad','frustrated','anxious')`
    ),
    check("moods_intensity_chk", sql`${table.intensity} is null or (${table.intensity} >= 1 and ${table.intensity} <= 5)`),
    check("moods_note_length_chk", sql`${table.note} is null or length(${table.note}) <= 500`)
  ]
);

export const transcriptions = pgTable(
  "transcriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    entryId: uuid("entry_id").references(() => entries.id, { onDelete: "set null" }),
    text: text("text").notNull(),
    language: text("language"),
    provider: text("provider").notNull().default("browser"),
    durationMs: integer("duration_ms"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index("idx_transcriptions_user").on(table.userId, table.createdAt.desc()),
    check("transcriptions_provider_chk", sql`${table.provider} in ('browser', 'server')`)
  ]
);

export const aiGenerations = pgTable(
  "ai_generations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    entryId: uuid("entry_id").references(() => entries.id, { onDelete: "cascade" }),
    sourceType: text("source_type").notNull(),
    sourceRefId: uuid("source_ref_id"),
    outputJson: jsonb("output_json").$type<AiJournalOutput>().notNull(),
    outputMarkdown: text("output_markdown").notNull(),
    language: text("language"),
    isTranslation: boolean("is_translation").notNull().default(false),
    model: text("model").notNull(),
    provider: text("provider").notNull(),
    promptVersion: text("prompt_version").notNull(),
    isApproved: boolean("is_approved").notNull().default(false),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    tokensIn: integer("tokens_in"),
    tokensOut: integer("tokens_out"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index("idx_ai_gen_user_entry").on(
      table.userId,
      table.entryId,
      table.createdAt.desc()
    ),
    check("ai_generations_source_chk", sql`${table.sourceType} in ('text', 'transcription')`)
  ]
);

export const preferences = pgTable(
  "preferences",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    defaultLanguage: text("default_language").notNull().default("en"),
    aiOutputLanguage: text("ai_output_language").notNull().default("match"),
    weekStartsOn: smallint("week_starts_on").notNull().default(1),
    themeAccent: text("theme_accent").notNull().default("default"),
    autosaveEnabled: boolean("autosave_enabled").notNull().default(true),
    reducedMotion: boolean("reduced_motion").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull()
  },
  (table) => [check("preferences_week_start_chk", sql`${table.weekStartsOn} in (0, 1)`)]
);

export const reminders = pgTable(
  "reminders",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    enabled: boolean("enabled").notNull().default(false),
    timeLocal: time("time_local").notNull().default("21:00"),
    timezone: text("timezone").notNull().default("UTC"),
    channel: text("channel").notNull().default("browser"),
    consentAt: timestamp("consent_at", { withTimezone: true }),
    lastSentAt: timestamp("last_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull()
  },
  (table) => [
    check("reminders_channel_chk", sql`${table.channel} in ('browser', 'in_app')`),
    check(
      "reminders_consent_chk",
      sql`${table.enabled} = false or ${table.consentAt} is not null`
    )
  ]
);

export type ProfileRow = typeof profiles.$inferSelect;
export type EntryRow = typeof entries.$inferSelect;
export type NewEntryRow = typeof entries.$inferInsert;
export type QuestionRow = typeof questions.$inferSelect;
export type AnswerRow = typeof answers.$inferSelect;
export type MoodRow = typeof moods.$inferSelect;
export type TranscriptionRow = typeof transcriptions.$inferSelect;
export type AiGenerationRow = typeof aiGenerations.$inferSelect;
export type PreferencesRow = typeof preferences.$inferSelect;
export type ReminderRow = typeof reminders.$inferSelect;
