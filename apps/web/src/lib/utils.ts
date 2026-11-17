import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Parse a YYYY-MM-DD business date as local midnight (never UTC-shifted). */
export function parseBusinessDate(value: string): Date {
  const [year = 1970, month = 1, day = 1] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Business date (YYYY-MM-DD) for an instant in a specific IANA timezone. */
export function businessDateIn(timeZone: string, date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

export function formatDate(
  value: string,
  options: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric" }
): string {
  return new Intl.DateTimeFormat("en-US", options).format(parseBusinessDate(value));
}

export function formatDateShort(value: string): string {
  return formatDate(value, { month: "short", day: "numeric", year: "numeric" });
}

export function formatMonth(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1)
  );
}

export function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function monthGrid(year: number, month: number, weekStartsOn: 0 | 1 = 0): string[] {
  const first = new Date(year, month - 1, 1);
  const offset = (first.getDay() - weekStartsOn + 7) % 7;
  const start = new Date(year, month - 1, 1 - offset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;
  });
}

export function monthOf(value: string): { year: number; month: number } {
  const [year = 1970, month = 1] = value.split("-").map(Number);
  return { year, month };
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function truncate(text: string, max = 180): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean;
}

export function relativeTime(value: string): string {
  const then = new Date(value).getTime();
  const diff = Date.now() - then;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
}

/** Only allow same-origin relative paths when honouring ?next= after login. */
export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

/** Writing direction for a language code, used by editors and previews. */
export function directionFor(language: string | null | undefined): "ltr" | "rtl" {
  return language?.startsWith("ur") || language?.startsWith("ar") ? "rtl" : "ltr";
}

export function scriptClass(language: string | null | undefined): string {
  if (language?.startsWith("ur")) return "urdu";
  if (language?.startsWith("hi")) return "devanagari";
  return "";
}

export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "ur", label: "Urdu (اردو)" },
  { value: "hi", label: "Hindi (हिन्दी)" },
  { value: "roman-ur", label: "Roman Urdu" }
] as const;
