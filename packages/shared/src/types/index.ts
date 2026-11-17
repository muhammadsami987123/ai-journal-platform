/**
 * Framework-free domain types.
 * These mirror the JSON contract in docs/API_DOCUMENTATION.md exactly
 * (snake_case on the wire, no framework imports).
 */

export const MOOD_VALUES = [
  "happy",
  "excited",
  "peaceful",
  "motivated",
  "normal",
  "tired",
  "stressed",
  "sad",
  "frustrated",
  "anxious"
] as const;

export type Mood = (typeof MOOD_VALUES)[number];

export type EntryStatus = "draft" | "complete";

export type EntrySourceType = "text" | "transcription";

export type TranscriptionProvider = "browser" | "server";

export type ReminderChannel = "browser" | "in_app";

export interface ApiMeta {
  requestId?: string;
  cursor?: string | null;
  nextCursor?: string | null;
  total?: number;
}

export interface ApiSuccess<T> {
  data: T;
  meta?: ApiMeta;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    requestId?: string;
    details?: unknown;
  };
}

/* -------------------------------------------------------------------------- */
/* Auth / account                                                             */
/* -------------------------------------------------------------------------- */

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
}

export interface Profile {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Preferences {
  user_id: string;
  default_language: string;
  ai_output_language: string;
  week_starts_on: 0 | 1;
  theme_accent: string;
  autosave_enabled: boolean;
  reduced_motion: boolean;
  created_at: string;
  updated_at: string;
}

export interface MeResponse {
  user: SessionUser;
  profile: Profile;
  preferences: Preferences;
}

export interface ReminderSettings {
  user_id: string;
  enabled: boolean;
  time_local: string;
  timezone: string;
  channel: ReminderChannel;
  consent_at: string | null;
  last_sent_at: string | null;
}

/* -------------------------------------------------------------------------- */
/* Journal                                                                    */
/* -------------------------------------------------------------------------- */

export interface JournalEntry {
  id: string;
  user_id: string;
  entry_date: string;
  title: string | null;
  original_text: string;
  final_text: string;
  language: string | null;
  status: EntryStatus;
  ai_generation_id: string | null;
  word_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface EntrySummary {
  id: string;
  entry_date: string;
  title: string | null;
  excerpt: string;
  status: EntryStatus;
  word_count: number;
  moods: Mood[];
  has_ai: boolean;
  has_transcript: boolean;
  language: string | null;
  updated_at: string;
  deleted_at: string | null;
}

export interface Question {
  id: string;
  user_id: string | null;
  prompt: string;
  sort_order: number;
  is_active: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface Answer {
  id: string;
  entry_id: string;
  question_id: string;
  prompt?: string;
  answer_text: string;
  is_skipped: boolean;
  created_at: string;
  updated_at: string;
}

export interface MoodRecord {
  id: string;
  user_id: string;
  entry_id: string | null;
  record_date: string;
  mood: Mood;
  intensity: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transcript {
  id: string;
  user_id: string;
  entry_id: string | null;
  text: string;
  language: string | null;
  provider: TranscriptionProvider;
  duration_ms: number | null;
  created_at: string;
}

export interface AiJournalOutput {
  overview: string;
  activities: string[];
  achievements: string[];
  challenges: string[];
  lessons: string[];
  reflections: string[];
  tomorrow_goals: string[];
  language: string;
}

export interface AiGeneration {
  id: string;
  user_id: string;
  entry_id: string | null;
  source_type: EntrySourceType;
  source_ref_id: string | null;
  output_json: AiJournalOutput;
  output_markdown: string;
  language: string | null;
  is_translation: boolean;
  model: string;
  provider: string;
  prompt_version: string;
  is_approved: boolean;
  approved_at: string | null;
  tokens_in: number | null;
  tokens_out: number | null;
  created_at: string;
}

export interface EntryDetail {
  entry: JournalEntry;
  answers: Answer[];
  mood: MoodRecord | null;
  generations: AiGeneration[];
  transcript: Transcript | null;
}

export interface Paginated<T> {
  items: T[];
  next_cursor: string | null;
}

/* -------------------------------------------------------------------------- */
/* Calendar                                                                   */
/* -------------------------------------------------------------------------- */

export interface CalendarDay {
  date: string;
  entryCount: number;
  hasDraft: boolean;
  hasComplete: boolean;
  hasAi: boolean;
  moods: Mood[];
}

export interface CalendarMonth {
  year: number;
  month: number;
  days: CalendarDay[];
}

export interface CalendarDayDetail {
  date: string;
  entries: EntrySummary[];
  moods: MoodRecord[];
}

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

export interface DashboardPayload {
  today: string;
  timezone: string;
  display_name: string;
  today_entries: EntrySummary[];
  today_mood: MoodRecord | null;
  summary: {
    source: "ai" | "text" | "none";
    text: string;
    entry_id: string | null;
  };
  recent: EntrySummary[];
  stats: {
    total_entries: number;
    current_streak: number;
    entries_this_month: number;
    total_words: number;
  };
}

/* -------------------------------------------------------------------------- */
/* Insights                                                                   */
/* -------------------------------------------------------------------------- */

export interface InsightsOverview {
  total_entries: number;
  total_words: number;
  current_streak: number;
  longest_streak: number;
  days_journaled: number;
  completion_rate: number;
  entries_this_month: number;
  entries_last_7_days: number;
  first_entry_date: string | null;
}

export interface ActivityBucket {
  bucket: string;
  entries: number;
  words: number;
}

export interface ActivityResponse {
  period: "week" | "month";
  buckets: ActivityBucket[];
}

export interface MoodDistribution {
  mood: Mood;
  count: number;
  percentage: number;
}

export interface MoodInsights {
  total: number;
  distribution: MoodDistribution[];
  top_emotions: Mood[];
  note?: string;
}

export interface HeatmapDay {
  date: string;
  entries: number;
}

export interface HeatmapResponse {
  from: string;
  to: string;
  days: HeatmapDay[];
}

/* -------------------------------------------------------------------------- */
/* AI                                                                         */
/* -------------------------------------------------------------------------- */

export interface GenerateJournalResult {
  generation: AiGeneration;
}

export interface ReflectResult {
  id: string;
  period_start: string;
  period_end: string;
  insights_json: {
    themes: string[];
    achievements: string[];
    challenges: string[];
    lessons: string[];
    summary: string;
  };
  model: string;
  prompt_version: string;
  created_at: string;
}
