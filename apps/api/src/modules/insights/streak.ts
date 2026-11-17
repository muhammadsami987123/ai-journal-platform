/**
 * Streak logic — one implementation used by the dashboard and insights (T5.6).
 * Input dates are business dates (YYYY-MM-DD) already resolved in the user's
 * timezone; the function never touches Date.now(), so it is deterministic.
 */

export interface StreakResult {
  current: number;
  longest: number;
}

export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const base = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

export function dayDiff(later: string, earlier: string): number {
  const toUtc = (value: string): number => {
    const [y, m, d] = value.split("-").map(Number);
    return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  };
  return Math.round((toUtc(later) - toUtc(earlier)) / 86_400_000);
}

/**
 * A streak ending today, or yesterday when today has not been written yet.
 * Missing a full day breaks it; repeated entries on one day count once.
 */
export function computeStreaks(dates: readonly string[], today: string): StreakResult {
  const unique = [...new Set(dates)].sort();

  let longest = 0;
  let run = 0;
  let previous: string | null = null;

  for (const date of unique) {
    if (previous !== null && dayDiff(date, previous) === 1) {
      run += 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    previous = date;
  }

  if (unique.length === 0) return { current: 0, longest: 0 };

  const last = unique[unique.length - 1] as string;
  const gap = dayDiff(today, last);
  if (gap < 0 || gap > 1) return { current: 0, longest };

  let current = 1;
  for (let index = unique.length - 1; index > 0; index -= 1) {
    const later = unique[index] as string;
    const earlier = unique[index - 1] as string;
    if (dayDiff(later, earlier) === 1) {
      current += 1;
    } else {
      break;
    }
  }

  return { current, longest };
}
