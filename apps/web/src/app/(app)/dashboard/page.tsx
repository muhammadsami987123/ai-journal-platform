"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Flame,
  Mic,
  PenLine,
  Sparkles,
  Type
} from "lucide-react";
import type { CalendarMonth, DashboardPayload, EntrySummary } from "@journal/shared";
import { api } from "@/lib/api/client";
import { formatDate, formatDateShort, businessDateIn, monthOf } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { MoodChip } from "@/components/mood";
import { MonthGrid } from "@/components/calendar/month-grid";
import { messageForError } from "@/lib/api/client";
import { useMe } from "@/hooks/use-me";

function greeting(timezone: string): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: timezone }).format(
      new Date()
    )
  );
  if (hour < 5) return "Still awake";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Flame }) {
  return (
    <div className="rounded-md border border-border bg-surface px-4 py-3.5">
      <div className="flex items-center gap-1.5 text-ink-muted">
        <Icon aria-hidden="true" className="size-3.5" />
        <p className="text-[11px] font-medium uppercase tracking-[0.1em]">{label}</p>
      </div>
      <p className="mt-1.5 font-serif text-2xl leading-none text-ink">{value}</p>
    </div>
  );
}

function EntryRow({ entry }: { entry: EntrySummary }) {
  return (
    <Link
      href={`/journal/${entry.id}`}
      className="group flex items-start gap-3 rounded-sm border border-transparent px-2 py-3 transition-colors hover:border-border hover:bg-subtle/60"
    >
      <div className="mt-0.5 flex w-12 shrink-0 flex-col items-center rounded-sm bg-subtle py-1.5 text-center">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
          {formatDate(entry.entry_date, { month: "short" })}
        </span>
        <span className="font-serif text-lg leading-tight text-ink">
          {formatDate(entry.entry_date, { day: "numeric" })}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium text-ink">
            {entry.title?.trim() || "Untitled entry"}
          </p>
          <Badge tone={entry.status === "complete" ? "success" : "warning"}>
            {entry.status === "complete" ? "Complete" : "Draft"}
          </Badge>
          {entry.moods.map((mood) => (
            <MoodChip key={mood} mood={mood} className="py-0" />
          ))}
        </div>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-soft">{entry.excerpt}</p>
        <p className="mt-1 text-[11px] text-ink-muted">
          {entry.word_count} words · updated {formatDateShort(entry.entry_date)}
        </p>
      </div>
      <ArrowRight
        aria-hidden="true"
        className="mt-1 size-4 shrink-0 text-ink-muted opacity-0 transition-opacity group-hover:opacity-100"
      />
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonText lines={2} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} className="h-[74px]" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <SkeletonText lines={4} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const me = useMe();
  const weekStartsOn = (me.data?.preferences.week_starts_on ?? 0) as 0 | 1;
  const dashboard = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<DashboardPayload>("/api/v1/dashboard")
  });

  const data = dashboard.data;
  const today = data?.today ?? businessDateIn("UTC");
  const period = monthOf(today);

  const calendar = useQuery({
    queryKey: ["calendar", period.year, period.month],
    queryFn: () => api.get<CalendarMonth>(`/api/v1/calendar/${period.year}/${period.month}`),
    enabled: Boolean(data)
  });

  if (dashboard.isLoading) return <DashboardSkeleton />;

  if (dashboard.isError || !data) {
    return (
      <ErrorState
        message={messageForError(dashboard.error)}
        onRetry={() => void dashboard.refetch()}
      />
    );
  }

  const hasToday = data.today_entries.length > 0;

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
            {formatDate(data.today, { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="mt-1.5 font-serif text-2xl leading-tight text-ink sm:text-3xl">
            {greeting(data.timezone)}, {data.display_name.split(" ")[0]}.
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {data.today_mood ? (
              <MoodChip mood={data.today_mood.mood} note={data.today_mood.note} />
            ) : (
              <Badge tone="outline">No mood yet today</Badge>
            )}
            <Badge tone={hasToday ? "success" : "neutral"}>
              {hasToday ? "You wrote today" : "Nothing written yet"}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/journal/new?date=${data.today}`}
            className={buttonStyles("primary", "md", "hidden sm:inline-flex")}
          >
            <PenLine aria-hidden="true" className="size-4" />
            Write today
          </Link>
        </div>
      </header>

      {data.summary.source !== "none" && data.summary.text ? (
        <div className="rounded-md border border-border bg-surface px-5 py-4 shadow-raised">
          <div className="flex items-center gap-2">
            <Sparkles aria-hidden="true" className="size-3.5 text-accent" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
              {data.summary.source === "ai" ? "Approved summary" : "Today in your own words"}
            </p>
          </div>
          <p className="mt-1.5 font-serif text-[17px] leading-relaxed text-ink">{data.summary.text}</p>
          {data.summary.entry_id ? (
            <Link
              href={`/journal/${data.summary.entry_id}`}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover"
            >
              Open entry <ArrowRight aria-hidden="true" className="size-3" />
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Entries" value={String(data.stats.total_entries)} icon={BookOpen} />
        <Stat label="Current streak" value={`${data.stats.current_streak}d`} icon={Flame} />
        <Stat label="This month" value={String(data.stats.entries_this_month)} icon={CalendarDays} />
        <Stat label="Words" value={data.stats.total_words.toLocaleString("en-US")} icon={Type} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="items-center">
              <CardTitle>Today</CardTitle>
              <Link
                href={`/journal?date=${data.today}`}
                className="text-xs font-medium text-accent hover:text-accent-hover"
              >
                All entries
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
              {hasToday ? (
                <div className="space-y-1">
                  {data.today_entries.map((entry) => (
                    <EntryRow key={entry.id} entry={entry} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  compact
                  icon={PenLine}
                  title="The page is still blank"
                  description="A few honest lines are enough. You can add questions, a mood, or a voice note afterwards."
                  action={
                    <Link
                      href={`/journal/new?date=${data.today}`}
                      className={buttonStyles("primary", "md")}
                    >
                      Start today&apos;s entry
                    </Link>
                  }
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="items-center">
              <CardTitle>Recent entries</CardTitle>
              <Link
                href="/journal"
                className="text-xs font-medium text-accent hover:text-accent-hover"
              >
                View all
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
              {data.recent.length > 0 ? (
                <div className="divide-y divide-border">
                  {data.recent.map((entry) => (
                    <EntryRow key={entry.id} entry={entry} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  compact
                  icon={BookOpen}
                  title="No past entries yet"
                  description="Once you write, your last five days will live here for quick revisits."
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="items-center">
              <CardTitle>This month</CardTitle>
              <Link
                href="/calendar"
                className="text-xs font-medium text-accent hover:text-accent-hover"
              >
                Open calendar
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
              {calendar.isLoading ? (
                <Skeleton className="h-44 w-full" />
              ) : calendar.data ? (
                <MonthGrid
                  compact
                  year={period.year}
                  month={period.month}
                  days={calendar.data.days}
                  today={data.today}
                  weekStartsOn={weekStartsOn}
                  onSelect={(date) => {
                    window.location.href = `/calendar?date=${date}`;
                  }}
                  selected={data.today}
                />
              ) : (
                <p className="text-sm text-ink-muted">The calendar will appear once a month loads.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 pt-4">
              <Link
                href={`/journal/new?date=${data.today}`}
                className="flex items-center gap-3 rounded-sm border border-border px-3 py-2.5 text-sm font-medium text-ink hover:border-border-strong hover:bg-subtle"
              >
                <PenLine aria-hidden="true" className="size-4 text-accent" />
                Quick journal for today
              </Link>
              <Link
                href="/voice-journal"
                className="flex items-center gap-3 rounded-sm border border-border px-3 py-2.5 text-sm font-medium text-ink hover:border-border-strong hover:bg-subtle"
              >
                <Mic aria-hidden="true" className="size-4 text-accent" />
                Speak instead of typing
              </Link>
              <Link
                href="/journal?focus=search"
                className="flex items-center gap-3 rounded-sm border border-border px-3 py-2.5 text-sm font-medium text-ink hover:border-border-strong hover:bg-subtle"
              >
                <BookOpen aria-hidden="true" className="size-4 text-accent" />
                Search your journal
              </Link>
              <Link
                href="/insights"
                className="flex items-center gap-3 rounded-sm border border-border px-3 py-2.5 text-sm font-medium text-ink hover:border-border-strong hover:bg-subtle"
              >
                <Sparkles aria-hidden="true" className="size-4 text-accent" />
                See your patterns
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
