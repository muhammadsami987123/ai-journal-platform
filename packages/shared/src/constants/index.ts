import type { Mood } from "../types/index.js";

export interface MoodDefinition {
  value: Mood;
  label: string;
  /** Lucide icon name — resolved in the web app, never imported here. */
  icon: string;
  /** CSS custom property, so components never hardcode a hex value. */
  colorVar: string;
  description: string;
}

/** Ten fixed moods, single-select. Shape (icon) carries the meaning, color is supplementary. */
export const MOODS: readonly MoodDefinition[] = [
  {
    value: "happy",
    label: "Happy",
    icon: "Smile",
    colorVar: "var(--color-mood-happy)",
    description: "Light, content, good day"
  },
  {
    value: "excited",
    label: "Excited",
    icon: "Sparkles",
    colorVar: "var(--color-mood-excited)",
    description: "Energised, looking forward"
  },
  {
    value: "peaceful",
    label: "Peaceful",
    icon: "Leaf",
    colorVar: "var(--color-mood-peaceful)",
    description: "Calm and settled"
  },
  {
    value: "motivated",
    label: "Motivated",
    icon: "Flame",
    colorVar: "var(--color-mood-motivated)",
    description: "Driven, making progress"
  },
  {
    value: "normal",
    label: "Normal",
    icon: "Meh",
    colorVar: "var(--color-mood-normal)",
    description: "An ordinary day"
  },
  {
    value: "tired",
    label: "Tired",
    icon: "Moon",
    colorVar: "var(--color-mood-tired)",
    description: "Low energy, drained"
  },
  {
    value: "stressed",
    label: "Stressed",
    icon: "CloudLightning",
    colorVar: "var(--color-mood-stressed)",
    description: "Under pressure"
  },
  {
    value: "sad",
    label: "Sad",
    icon: "CloudRain",
    colorVar: "var(--color-mood-sad)",
    description: "Heavy, low"
  },
  {
    value: "frustrated",
    label: "Frustrated",
    icon: "Frown",
    colorVar: "var(--color-mood-frustrated)",
    description: "Blocked, irritated"
  },
  {
    value: "anxious",
    label: "Anxious",
    icon: "Waves",
    colorVar: "var(--color-mood-anxious)",
    description: "Restless, worried"
  }
] as const;

export const MOOD_BY_VALUE: Record<Mood, MoodDefinition> = MOODS.reduce(
  (acc, mood) => ({ ...acc, [mood.value]: mood }),
  {} as Record<Mood, MoodDefinition>
);

/**
 * The 12 system questions, in fixed order.
 * Seeded by packages/database/seeds with stable ids so re-running is a no-op.
 */
export const DEFAULT_QUESTIONS: readonly string[] = [
  "How was your day?",
  "What was the best thing that happened today?",
  "What new thing did you learn?",
  "Did you accomplish your goals?",
  "Did you face any challenges?",
  "What made you happy today?",
  "Did anything disappoint you?",
  "Did you work on something important?",
  "Did you spend time with someone special?",
  "What are you grateful for today?",
  "What could you have done better?",
  "What are your plans for tomorrow?"
] as const;

export const LIMITS = {
  MAX_ENTRY_LENGTH: 100_000,
  MAX_TITLE_LENGTH: 200,
  MAX_QUESTION_LENGTH: 500,
  MAX_ANSWER_LENGTH: 10_000,
  MAX_MOOD_NOTE_LENGTH: 500,
  MAX_BIO_LENGTH: 500,
  MAX_NAME_LENGTH: 80,
  MAX_SEARCH_LENGTH: 200,
  MAX_TRANSCRIPT_LENGTH: 200_000,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  AUTOSAVE_DEBOUNCE_MS: 1500,
  AUTOSAVE_MAX_WAIT_MS: 6000,
  MAX_AI_INPUT_CHARS: 60_000,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128
} as const;

export interface LanguageDefinition {
  code: string;
  label: string;
  nativeLabel: string;
  dir: "ltr" | "rtl";
}

export const LANGUAGES: readonly LanguageDefinition[] = [
  { code: "en", label: "English", nativeLabel: "English", dir: "ltr" },
  { code: "ur", label: "Urdu", nativeLabel: "اردو", dir: "rtl" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", dir: "ltr" },
  { code: "ar", label: "Arabic", nativeLabel: "العربية", dir: "rtl" },
  { code: "es", label: "Spanish", nativeLabel: "Español", dir: "ltr" },
  { code: "fr", label: "French", nativeLabel: "Français", dir: "ltr" }
] as const;

/** Locales offered by the voice recorder (BCP-47). */
export const VOICE_LANGUAGES: readonly { code: string; label: string }[] = [
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "ur-PK", label: "Urdu (Pakistan)" },
  { code: "hi-IN", label: "Hindi (India)" },
  { code: "ar-SA", label: "Arabic (Saudi Arabia)" }
] as const;

export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  dashboard: "/dashboard",
  journal: "/journal",
  journalNew: "/journal/new",
  calendar: "/calendar",
  voice: "/voice-journal",
  insights: "/insights",
  settings: "/settings",
  profile: "/profile",
  timeline: "/timeline",
  reflections: "/reflections",
  ask: "/ask"
} as const;

/** Routes that require a session. Used by middleware and the API guard tests. */
export const PROTECTED_PREFIXES: readonly string[] = [
  "/dashboard",
  "/journal",
  "/calendar",
  "/voice-journal",
  "/insights",
  "/settings",
  "/profile",
  "/timeline",
  "/reflections",
  "/ask"
] as const;

export const APP_NAME = "AI Journal";
export const APP_TAGLINE = "Your days, remembered clearly.";
export const SESSION_COOKIE_PREFIX = "better-auth";
