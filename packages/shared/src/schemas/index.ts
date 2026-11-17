import { z } from "zod";
import { LIMITS } from "../constants/index.js";
import { MOOD_VALUES } from "../types/index.js";

/* -------------------------------------------------------------------------- */
/* Primitives                                                                 */
/* -------------------------------------------------------------------------- */

export const moodSchema = z.enum(MOOD_VALUES);

export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the YYYY-MM-DD format")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, "Enter a real calendar date");

export const uuidSchema = z.string().uuid("Enter a valid id");

export const emailSchema = z
  .string()
  .trim()
  .min(3, "Enter your email address")
  .max(254, "That email address is too long")
  .regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, "Enter a valid email address");

export const passwordSchema = z
  .string()
  .min(LIMITS.MIN_PASSWORD_LENGTH, `Use at least ${LIMITS.MIN_PASSWORD_LENGTH} characters`)
  .max(LIMITS.MAX_PASSWORD_LENGTH, `Use at most ${LIMITS.MAX_PASSWORD_LENGTH} characters`);

export const languageCodeSchema = z
  .string()
  .trim()
  .regex(/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/, "Use a language code such as en, ur or hi");

export const timezoneSchema = z
  .string()
  .trim()
  .min(1, "Choose a timezone")
  .max(64)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, "Enter a valid IANA timezone, for example Asia/Karachi");

export const timeLocalSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a 24-hour time such as 21:00");

/* -------------------------------------------------------------------------- */
/* Auth                                                                       */
/* -------------------------------------------------------------------------- */

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(LIMITS.MAX_NAME_LENGTH),
  email: emailSchema,
  password: passwordSchema,
  confirm_password: z.string().optional()
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password")
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, "Enter your current password"),
  new_password: passwordSchema,
  revoke_other_sessions: z.boolean().optional()
});

/* -------------------------------------------------------------------------- */
/* Profile & preferences                                                      */
/* -------------------------------------------------------------------------- */

export const profileUpdateSchema = z
  .object({
    display_name: z.string().trim().min(1, "Enter a display name").max(LIMITS.MAX_NAME_LENGTH).optional(),
    bio: z.string().trim().max(LIMITS.MAX_BIO_LENGTH, "Keep your bio under 500 characters").nullable().optional(),
    avatar_url: z.string().trim().url("Enter a valid URL").max(500).nullable().optional(),
    timezone: timezoneSchema.optional()
  })
  .refine((value) => Object.keys(value).length > 0, "No changes supplied");

export const preferencesUpdateSchema = z
  .object({
    default_language: languageCodeSchema.optional(),
    ai_output_language: z.union([z.literal("match"), languageCodeSchema]).optional(),
    week_starts_on: z.union([z.literal(0), z.literal(1)]).optional(),
    theme_accent: z.enum(["default", "terracotta", "sage", "ink"]).optional(),
    autosave_enabled: z.boolean().optional(),
    reduced_motion: z.boolean().optional()
  })
  .refine((value) => Object.keys(value).length > 0, "No changes supplied");

/* -------------------------------------------------------------------------- */
/* Entries                                                                    */
/* -------------------------------------------------------------------------- */

export const entryCreateSchema = z.object({
  entry_date: dateStringSchema,
  title: z.string().trim().max(LIMITS.MAX_TITLE_LENGTH).nullable().optional(),
  original_text: z.string().max(LIMITS.MAX_ENTRY_LENGTH, "This entry is too long").optional(),
  final_text: z.string().max(LIMITS.MAX_ENTRY_LENGTH, "This entry is too long").optional(),
  language: languageCodeSchema.nullable().optional()
});

export const entryUpdateSchema = z
  .object({
    entry_date: dateStringSchema.optional(),
    title: z.string().trim().max(LIMITS.MAX_TITLE_LENGTH).nullable().optional(),
    final_text: z.string().max(LIMITS.MAX_ENTRY_LENGTH, "This entry is too long").optional(),
    language: languageCodeSchema.nullable().optional(),
    /**
     * Accepted by the schema only so the API can answer `409 IMMUTABLE_FIELD`
     * instead of silently dropping the key. It is never written: the original
     * text is append-only (T3.3).
     */
    original_text: z.string().max(LIMITS.MAX_ENTRY_LENGTH, "This entry is too long").optional()
  })
  .refine((value) => Object.keys(value).length > 0, "No changes supplied");

export const entryCompleteSchema = z.object({
  final_text: z.string().max(LIMITS.MAX_ENTRY_LENGTH).optional()
});

export const entryListQuerySchema = z.object({
  q: z.string().trim().max(LIMITS.MAX_SEARCH_LENGTH).optional(),
  from: dateStringSchema.optional(),
  to: dateStringSchema.optional(),
  mood: z.union([moodSchema, z.array(moodSchema)]).optional(),
  status: z.enum(["draft", "complete"]).optional(),
  hasAi: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .optional()
    .transform((value) => (typeof value === "string" ? value === "true" : value)),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  cursor: z.string().max(500).optional(),
  limit: z.coerce.number().int().min(1).max(LIMITS.MAX_PAGE_SIZE).default(LIMITS.DEFAULT_PAGE_SIZE),
  include_deleted: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .optional()
    .transform((value) => (typeof value === "string" ? value === "true" : value === true))
});

export type EntryListQuery = z.infer<typeof entryListQuerySchema>;

/* -------------------------------------------------------------------------- */
/* Questions & answers                                                        */
/* -------------------------------------------------------------------------- */

export const questionCreateSchema = z.object({
  prompt: z.string().trim().min(1, "Enter a question").max(LIMITS.MAX_QUESTION_LENGTH),
  sort_order: z.number().int().min(0).max(999).optional()
});

export const questionUpdateSchema = z
  .object({
    prompt: z.string().trim().min(1).max(LIMITS.MAX_QUESTION_LENGTH).optional(),
    sort_order: z.number().int().min(0).max(999).optional(),
    is_active: z.boolean().optional()
  })
  .refine((value) => Object.keys(value).length > 0, "No changes supplied");

export const answerInputSchema = z
  .object({
    question_id: uuidSchema,
    answer_text: z.string().max(LIMITS.MAX_ANSWER_LENGTH, "This answer is too long").optional(),
    is_skipped: z.boolean().optional()
  })
  .refine((value) => (value.is_skipped === true ? !value.answer_text : true), {
    message: "Clear the answer or remove the skip flag"
  });

export const answersUpsertSchema = z.object({
  answers: z.array(answerInputSchema).max(100, "Too many answers in one request")
});

/* -------------------------------------------------------------------------- */
/* Moods                                                                      */
/* -------------------------------------------------------------------------- */

export const moodSetSchema = z.object({
  mood: moodSchema,
  intensity: z.number().int().min(1).max(5).nullable().optional(),
  note: z.string().trim().max(LIMITS.MAX_MOOD_NOTE_LENGTH).nullable().optional()
});

export const moodRangeQuerySchema = z.object({
  from: dateStringSchema.optional(),
  to: dateStringSchema.optional()
});

/* -------------------------------------------------------------------------- */
/* Calendar                                                                   */
/* -------------------------------------------------------------------------- */

export const calendarMonthParamsSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12)
});

/* -------------------------------------------------------------------------- */
/* Voice                                                                      */
/* -------------------------------------------------------------------------- */

export const transcriptionCreateSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "There is nothing to save yet")
    .max(LIMITS.MAX_TRANSCRIPT_LENGTH, "This recording is too long"),
  language: z.string().trim().max(20).nullable().optional(),
  provider: z.enum(["browser", "server"]).default("browser"),
  duration_ms: z.number().int().min(0).max(4 * 60 * 60 * 1000).nullable().optional(),
  entry_id: uuidSchema.nullable().optional()
});

/* -------------------------------------------------------------------------- */
/* AI                                                                         */
/* -------------------------------------------------------------------------- */

export const aiJournalOutputSchema = z.strictObject({
  overview: z.string().max(4000),
  activities: z.array(z.string().max(1000)).max(30),
  achievements: z.array(z.string().max(1000)).max(30),
  challenges: z.array(z.string().max(1000)).max(30),
  lessons: z.array(z.string().max(1000)).max(30),
  reflections: z.array(z.string().max(1000)).max(30),
  tomorrow_goals: z.array(z.string().max(1000)).max(30),
  language: z.string().min(2).max(20)
});

export const aiGenerateSchema = z
  .object({
    entry_id: uuidSchema,
    source_type: z.enum(["text", "transcription"]),
    source_text: z.string().max(LIMITS.MAX_ENTRY_LENGTH).optional(),
    source_ref_id: uuidSchema.optional(),
    output_language: z.union([z.literal("match"), languageCodeSchema]).default("match")
  })
  .refine((value) => value.source_type !== "text" || (value.source_text ?? "").trim().length > 0, {
    message: "Write something before asking for a draft",
    path: ["source_text"]
  });

export const aiRegenerateSchema = z.object({
  instruction: z.string().trim().max(500).optional(),
  output_language: z.union([z.literal("match"), languageCodeSchema]).optional()
});

export const aiApproveSchema = z.object({
  apply_to: z.literal("final").default("final"),
  edited_markdown: z.string().max(LIMITS.MAX_ENTRY_LENGTH).optional()
});

export const aiReflectSchema = z
  .object({
    from: dateStringSchema,
    to: dateStringSchema
  })
  .refine((value) => value.from <= value.to, {
    message: "The start date must be before the end date",
    path: ["to"]
  });

export const aiAskSchema = z.object({
  question: z.string().trim().min(3, "Ask a question").max(500)
});

/* -------------------------------------------------------------------------- */
/* Reminders                                                                  */
/* -------------------------------------------------------------------------- */

export const reminderUpdateSchema = z.object({
  enabled: z.boolean().optional(),
  time_local: timeLocalSchema.optional(),
  timezone: timezoneSchema.optional(),
  channel: z.enum(["browser", "in_app"]).optional()
});

/* -------------------------------------------------------------------------- */
/* Account                                                                   */
/* -------------------------------------------------------------------------- */

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Confirm with your password"),
  confirmation: z.literal("DELETE", { message: 'Type DELETE to confirm' })
});

export const exportRequestSchema = z.object({
  format: z.enum(["json"]).default("json")
});

/* -------------------------------------------------------------------------- */
/* Inferred types                                                             */
/* -------------------------------------------------------------------------- */

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type PreferencesUpdateInput = z.infer<typeof preferencesUpdateSchema>;
export type EntryCreateInput = z.infer<typeof entryCreateSchema>;
export type EntryUpdateInput = z.infer<typeof entryUpdateSchema>;
export type QuestionCreateInput = z.infer<typeof questionCreateSchema>;
export type QuestionUpdateInput = z.infer<typeof questionUpdateSchema>;
export type AnswersUpsertInput = z.infer<typeof answersUpsertSchema>;
export type MoodSetInput = z.infer<typeof moodSetSchema>;
export type TranscriptionCreateInput = z.infer<typeof transcriptionCreateSchema>;
export type AiGenerateInput = z.infer<typeof aiGenerateSchema>;
export type AiApproveInput = z.infer<typeof aiApproveSchema>;
export type ReminderUpdateInput = z.infer<typeof reminderUpdateSchema>;
export type AiJournalOutputInput = z.infer<typeof aiJournalOutputSchema>;
