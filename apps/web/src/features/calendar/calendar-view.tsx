"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  PenLine,
  Sparkles
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CalendarDayDetail, CalendarMonth } from "@journal/shared";
import { api, messageForError } from "@/lib/api/client";
import {
  addMonths,
  businessDateIn,
  formatDate,
  formatMonth,
  monthOf
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { MoodChip } from "@/components/mood";
import { MonthGrid } from "@/components/calendar/month-grid";
import { useMe } from "@/hooks/use-me";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

function isValidDate(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export function CalendarView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const me = useMe();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const timezone = me.data?.profile.timezone ?? "UTC";
  const weekStartsOn = (me.data?.preferences.week_starts_on ?? 0) as 0 | 1;
  const today = businessDateIn(
    mounted ? Intl.DateTimeFormat().resolvedOptions().timeZone : timezone
  );

  const requestedDate = searchParams.get("date");
  const initialDate = isValidDate(requestedDate) ? requestedDate : null;

  const [view, setView] = useState(() =>
    initialDate ? monthOf(initialDate) : monthOf(businessDateIn("UTC"))
  );
  const [selected, setSelected] = useState<string | null>(initialDate);

  useEffect(() => {
    if (!mounted) return;
    if (initialDate) {
      setView(monthOf(initialDate));
      setSelected(initialDate);
      return;
    }
    setView(monthOf(today));
    setSelected(today);
  }, [mounted, requestedDate]);

  const monthQuery = useQuery({
    queryKey: ["calendar", view.year, view.month],
    queryFn: () => api.get<CalendarMonth>(`/api/v1/calendar/${view.year}/${view.month}`),
    staleTime: 30_000
  });

  useEffect(() => {
    if (!mounted) return;
    const previous = addMonths(view.year, view.month, -1);
    const next = addMonths(view.year, view.month, 1);
    void queryClient.prefetchQuery({
      queryKey: ["calendar", previous.year, previous.month],
      queryFn: () => api.get<CalendarMonth>(`/api/v1/calendar/${previous.year}/${previous.month}`),
      staleTime: 30_000
    });
    void queryClient.prefetchQuery({
      queryKey: ["calendar", next.year, next.month],
      queryFn: () => api.get<CalendarMonth>(`/api/v1/calendar/${next.year}/${next.month}`),
      staleTime: 30_000
    });
  }, [mounted, queryClient, view.year, view.month]);

  const dayQuery = useQuery({
    queryKey: ["calendar-day", selected],
    queryFn: () => api.get<CalendarDayDetail>(`/api/v1/calendar/${selected}`),
    enabled: Boolean(selected),
    staleTime: 20_000
  });

  function goToDate(date: string) {
    setSelected(date);
    setView(monthOf(date));
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", date);
    router.replace(`/calendar?${params.toString()}`, { scroll: false });
  }

  function goToMonth(year: number, month: number) {
    setView({ year, month });
  }

  function shiftMonth(delta: number) {
    const next = addMonths(view.year, view.month, delta);
    setView(next);
  }

  const years = useMemo(() => {
    const base = new Date().getFullYear();
    return Array.from({ length: 9 }, (_, index) => base - 4 + index);
  }, []);

  if (!mounted) {
    return (
      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-[520px] w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Calendar</p>
          <h1 className="mt-1 font-serif text-2xl leading-tight text-ink sm:text-3xl">
            {formatMonth(view.year, view.month)}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Every day you wrote is marked. Select a date to read or add to it.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => goToDate(today)}
            className={buttonStyles("secondary", "sm")}
          >
            Today
          </button>
          <Link href={`/journal/new?date=${selected ?? today}`} className={buttonStyles("primary", "sm")}>
            <PenLine aria-hidden="true" className="size-3.5" />
            New entry
          </Link>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader className="flex-wrap items-center gap-2 pb-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="rounded-sm border border-border p-2 text-ink-soft hover:border-border-strong hover:bg-subtle"
                aria-label="Previous month"
              >
                <ChevronLeft aria-hidden="true" className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="rounded-sm border border-border p-2 text-ink-soft hover:border-border-strong hover:bg-subtle"
                aria-label="Next month"
              >
                <ChevronRight aria-hidden="true" className="size-4" />
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <label htmlFor="month-select" className="sr-only">
                Month
              </label>
              <select
                id="month-select"
                value={view.month}
                onChange={(event) => goToMonth(view.year, Number(event.target.value))}
                className="h-9 rounded-sm border border-border bg-surface px-2 text-sm text-ink hover:border-border-strong focus:border-accent"
              >
                {MONTH_NAMES.map((name, index) => (
                  <option key={name} value={index + 1}>
                    {name}
                  </option>
                ))}
              </select>
              <label htmlFor="year-select" className="sr-only">
                Year
              </label>
              <select
                id="year-select"
                value={view.year}
                onChange={(event) => goToMonth(Number(event.target.value), view.month)}
                className="h-9 rounded-sm border border-border bg-surface px-2 text-sm text-ink hover:border-border-strong focus:border-accent"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="ml-auto flex items-center gap-2 text-[11px] text-ink-muted">
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-accent" /> complete
              </span>
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-warning" /> draft only
              </span>
            </div>
          </CardHeader>

          <CardContent className="pt-2">
            {monthQuery.isLoading ? (
              <Skeleton className="h-[430px] w-full" />
            ) : monthQuery.isError ? (
              <ErrorState message={messageForError(monthQuery.error)} onRetry={() => void monthQuery.refetch()} />
            ) : (
              <>
                <MonthGrid
                  year={view.year}
                  month={view.month}
                  days={monthQuery.data?.days ?? []}
                  today={today}
                  selected={selected}
                  onSelect={goToDate}
                  weekStartsOn={weekStartsOn}
                />
                <p className="mt-3 text-[11px] text-ink-muted">
                  Use the arrow keys to move between days, Home and End to jump across the grid.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader className="items-center">
            <CardTitle>{selected ? formatDate(selected, { weekday: "long", month: "long", day: "numeric" }) : "Pick a day"}</CardTitle>
            {selected === today ? <Badge tone="accent">Today</Badge> : null}
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {!selected ? (
              <p className="text-sm text-ink-soft">Select any date in the grid to see what you wrote.</p>
            ) : dayQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <SkeletonText lines={3} />
              </div>
            ) : dayQuery.isError ? (
              <ErrorState message={messageForError(dayQuery.error)} onRetry={() => void dayQuery.refetch()} />
            ) : (
              <>
                {dayQuery.data?.moods.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {dayQuery.data.moods.map((mood) => (
                      <MoodChip key={mood.id} mood={mood.mood} note={mood.note} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-ink-muted">No mood recorded for this day.</p>
                )}

                {dayQuery.data && dayQuery.data.entries.length > 0 ? (
                  <ul className="space-y-2">
                    {dayQuery.data.entries.map((entry) => (
                      <li key={entry.id}>
                        <Link
                          href={`/journal/${entry.id}`}
                          className="block rounded-sm border border-border bg-canvas p-3 transition-colors hover:border-border-strong hover:bg-subtle/60"
                        >
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="text-sm font-medium text-ink">
                              {entry.title?.trim() || "Untitled entry"}
                            </p>
                            <Badge tone={entry.status === "complete" ? "success" : "warning"}>
                              {entry.status === "complete" ? "Complete" : "Draft"}
                            </Badge>
                            {entry.has_ai ? (
                              <Badge tone="accent">
                                <Sparkles aria-hidden="true" className="size-3" />
                                AI
                              </Badge>
                            ) : null}
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-soft">
                            {entry.excerpt || "No text yet."}
                          </p>
                          <p className="mt-1.5 flex items-center gap-1 text-[10px] text-ink-muted">
                            <Clock aria-hidden="true" className="size-3" />
                            {entry.word_count} words · {entry.moods.map((mood) => mood).join(", ") || "no mood"}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    compact
                    icon={CalendarDays}
                    title="Nothing written on this day"
                    description="You can still add an entry for a past date — it will sit exactly where it belongs."
                    action={
                      <Link
                        href={`/journal/new?date=${selected}`}
                        className={buttonStyles("primary", "sm")}
                      >
                        <PenLine aria-hidden="true" className="size-3.5" />
                        Write for this day
                      </Link>
                    }
                  />
                )}

                {dayQuery.data && dayQuery.data.entries.length > 0 ? (
                  <Link
                    href={`/journal/new?date=${selected}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover"
                  >
                    <PenLine aria-hidden="true" className="size-3.5" />
                    Add another entry for this day
                  </Link>
                ) : null}

                <div className="flex items-center justify-between border-t border-border pt-3">
                  <button
                    type="button"
                    onClick={() => goToDate(dayBefore(selected))}
                    className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
                  >
                    <ArrowLeft aria-hidden="true" className="size-3" />
                    Previous day
                  </button>
                  <button
                    type="button"
                    onClick={() => goToDate(dayAfter(selected))}
                    className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
                  >
                    Next day
                    <ArrowRight aria-hidden="true" className="size-3" />
                  </button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function shiftDate(value: string, delta: number): string {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + delta);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function dayBefore(value: string): string {
  return shiftDate(value, -1);
}

function dayAfter(value: string): string {
  return shiftDate(value, 1);
}
