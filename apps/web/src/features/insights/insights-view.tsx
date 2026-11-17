"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Activity, BookOpen, CalendarDays, Flame, LineChart, PenLine, Sparkles, Type } from "lucide-react";
import { useMemo, useState } from "react";
import type {
  ActivityResponse,
  HeatmapResponse,
  InsightsOverview,
  MoodInsights
} from "@journal/shared";
import { api, messageForError } from "@/lib/api/client";
import { cn, formatDateShort, parseBusinessDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { SegmentedControl } from "@/components/ui/switch";
import { MoodIcon } from "@/components/mood";
import { PageHeader } from "@/components/page-header";

function Kpi({
  label,
  value,
  hint,
  icon: Icon
}: {
  label: string;
  value: string;
  hint?: string;
  icon: typeof Flame;
}) {
  return (
    <div className="rounded-md border border-border bg-surface px-4 py-3.5">
      <div className="flex items-center gap-1.5 text-ink-muted">
        <Icon aria-hidden="true" className="size-3.5" />
        <p className="text-[11px] font-medium uppercase tracking-[0.1em]">{label}</p>
      </div>
      <p className="mt-1.5 font-serif text-2xl leading-none text-ink">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-ink-muted">{hint}</p> : null}
    </div>
  );
}

function ActivityChart({ data }: { data: ActivityResponse }) {
  const max = Math.max(...data.buckets.map((bucket) => bucket.entries), 1);
  const total = data.buckets.reduce((sum, bucket) => sum + bucket.entries, 0);

  return (
    <div className="space-y-3">
      <div className="flex h-40 items-end gap-1.5">
        {data.buckets.map((bucket) => {
          const height = bucket.entries === 0 ? 3 : Math.max(8, (bucket.entries / max) * 100);
          return (
            <div key={bucket.bucket} className="group flex min-w-0 flex-1 flex-col items-center gap-1">
              <div className="relative flex w-full flex-1 items-end">
                <div
                  className={cn(
                    "w-full rounded-t-xs transition-colors",
                    bucket.entries > 0 ? "bg-accent/80 group-hover:bg-accent" : "bg-subtle"
                  )}
                  style={{ height: `${height}%` }}
                  title={`${formatDateShort(bucket.bucket)} — ${bucket.entries} ${
                    bucket.entries === 1 ? "entry" : "entries"
                  }, ${bucket.words} words`}
                />
              </div>
              <span className="text-[9px] text-ink-muted">
                {formatDateShort(bucket.bucket).split(" ")[1]}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-soft">
        <span>
          {total} {total === 1 ? "entry" : "entries"} in this period
        </span>
        <span className="text-ink-muted">Peak day: {max}</span>
      </div>

      <details className="text-xs">
        <summary className="cursor-pointer font-medium text-ink-soft">View as a table</summary>
        <table className="mt-2 w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border text-ink-muted">
              <th scope="col" className="py-1 pr-2 font-medium">Day</th>
              <th scope="col" className="py-1 pr-2 font-medium">Entries</th>
              <th scope="col" className="py-1 font-medium">Words</th>
            </tr>
          </thead>
          <tbody>
            {data.buckets.map((bucket) => (
              <tr key={bucket.bucket} className="border-b border-border/60 text-ink-soft">
                <td className="py-1 pr-2">{formatDateShort(bucket.bucket)}</td>
                <td className="py-1 pr-2">{bucket.entries}</td>
                <td className="py-1">{bucket.words}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

function MoodBreakdown({ data }: { data: MoodInsights }) {
  if (data.total === 0) {
    return (
      <EmptyState
        compact
        icon={Sparkles}
        title="No moods recorded yet"
        description="Pick a mood while writing and the distribution will build from your own entries."
      />
    );
  }

  return (
    <div className="space-y-2.5">
      {data.distribution.slice(0, 6).map((item) => (
        <div key={item.mood} className="flex items-center gap-2.5">
          <MoodIcon mood={item.mood} className="size-4 shrink-0 text-ink-soft" />
          <span className="w-20 shrink-0 text-xs capitalize text-ink-soft">{item.mood}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-subtle">
            <div
              className="h-full rounded-full bg-accent/75"
              style={{ width: `${Math.max(item.percentage, 2)}%` }}
            />
          </div>
          <span className="w-12 shrink-0 text-right text-[11px] text-ink-muted">
            {item.count} · {Math.round(item.percentage)}%
          </span>
        </div>
      ))}
      {data.note ? <p className="text-[11px] leading-relaxed text-ink-muted">{data.note}</p> : null}
    </div>
  );
}

function Heatmap({ data }: { data: HeatmapResponse }) {
  const counts = useMemo(() => new Map(data.days.map((day) => [day.date, day.entries])), [data.days]);
  const weeks = useMemo(() => {
    const start = parseBusinessDate(data.from);
    const end = parseBusinessDate(data.to);
    const cells: (string | null)[] = Array.from({ length: start.getDay() }, () => null);
    const cursor = new Date(start);
    while (cursor <= end) {
      cells.push(
        `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(
          cursor.getDate()
        ).padStart(2, "0")}`
      );
      cursor.setDate(cursor.getDate() + 1);
    }
    while (cells.length % 7 !== 0) cells.push(null);
    const chunked: (string | null)[][] = [];
    for (let index = 0; index < cells.length; index += 7) {
      chunked.push(cells.slice(index, index + 7));
    }
    return chunked;
  }, [data.from, data.to]);

  const activeDays = data.days.filter((day) => day.entries > 0).length;

  return (
    <div className="space-y-3">
      <div className="scroll-thin overflow-x-auto pb-1">
        <div className="flex gap-1" role="img" aria-label={`${activeDays} days with entries in the last year`}>
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((date, dayIndex) => {
                if (!date) {
                  return <div key={`empty-${dayIndex}`} className="size-2.5 rounded-xs bg-transparent" />;
                }
                const count = counts.get(date) ?? 0;
                return (
                  <div
                    key={date}
                    title={`${formatDateShort(date)} — ${count} ${count === 1 ? "entry" : "entries"}`}
                    aria-label={`${formatDateShort(date)}: ${count} entries`}
                    className={cn(
                      "size-2.5 rounded-xs",
                      count === 0 && "bg-subtle",
                      count === 1 && "bg-accent/30",
                      count === 2 && "bg-accent/55",
                      count === 3 && "bg-accent/75",
                      count >= 4 && "bg-accent"
                    )}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-muted">
        <span>
          {activeDays} {activeDays === 1 ? "day" : "days"} written in the last 12 months
        </span>
        <span className="flex items-center gap-1">
          Less
          <span className="size-2.5 rounded-xs bg-subtle" />
          <span className="size-2.5 rounded-xs bg-accent/30" />
          <span className="size-2.5 rounded-xs bg-accent/55" />
          <span className="size-2.5 rounded-xs bg-accent/75" />
          <span className="size-2.5 rounded-xs bg-accent" />
          More
        </span>
      </div>

      <details className="text-xs">
        <summary className="cursor-pointer font-medium text-ink-soft">View days with entries</summary>
        <ul className="mt-2 max-h-48 space-y-1 overflow-auto pr-2 text-ink-soft">
          {data.days
            .filter((day) => day.entries > 0)
            .map((day) => (
              <li key={day.date} className="flex justify-between gap-3">
                <span>{formatDateShort(day.date)}</span>
                <span>{day.entries}</span>
              </li>
            ))}
        </ul>
      </details>
    </div>
  );
}

export function InsightsView() {
  const [period, setPeriod] = useState<"week" | "month">("week");

  const overview = useQuery({
    queryKey: ["insights", "overview"],
    queryFn: () => api.get<InsightsOverview>("/api/v1/insights/overview")
  });
  const activity = useQuery({
    queryKey: ["insights", "activity", period],
    queryFn: () => api.get<ActivityResponse>("/api/v1/insights/activity", { period })
  });
  const moods = useQuery({
    queryKey: ["insights", "moods"],
    queryFn: () => api.get<MoodInsights>("/api/v1/insights/moods")
  });
  const heatmap = useQuery({
    queryKey: ["insights", "heatmap"],
    queryFn: () => api.get<HeatmapResponse>("/api/v1/insights/heatmap")
  });

  const data = overview.data;
  const loading = overview.isLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Insights"
        title="Patterns, not pressure"
        description="Every number below comes from your own entries. When there is nothing yet, we say so."
        actions={
          <Link href="/journal/new" className={buttonStyles("primary", "sm")}>
            <PenLine aria-hidden="true" className="size-3.5" />
            Write today
          </Link>
        }
      />

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-[76px]" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : overview.isError || !data ? (
        <ErrorState message={messageForError(overview.error)} onRetry={() => void overview.refetch()} />
      ) : (
        <>
          {data.total_entries === 0 ? (
            <EmptyState
              icon={LineChart}
              title="You need a little history first"
              description="Insights grow out of real entries. Write once today and the first streak, mood and word count will appear here."
              action={
                <Link href="/journal/new" className={buttonStyles("primary", "md")}>
                  Write the first entry
                </Link>
              }
            />
          ) : null}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <Kpi label="Entries" value={String(data.total_entries)} icon={BookOpen} />
            <Kpi label="Words" value={data.total_words.toLocaleString("en-US")} icon={Type} />
            <Kpi
              label="Current streak"
              value={`${data.current_streak}d`}
              hint={`Longest ${data.longest_streak}d`}
              icon={Flame}
            />
            <Kpi label="Days written" value={String(data.days_journaled)} icon={CalendarDays} />
            <Kpi
              label="Completion"
              value={`${data.completion_rate}%`}
              hint="of entries marked complete"
              icon={Activity}
            />
            <Kpi
              label="Last 7 days"
              value={String(data.entries_last_7_days)}
              hint={`${data.entries_this_month} this month`}
              icon={LineChart}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
            <Card>
              <CardHeader className="flex-wrap items-center gap-2">
                <CardTitle>Writing activity</CardTitle>
                <SegmentedControl
                  label="Activity period"
                  value={period}
                  onChange={setPeriod}
                  options={[
                    { value: "week", label: "7 days" },
                    { value: "month", label: "30 days" }
                  ]}
                />
              </CardHeader>
              <CardContent className="pt-4">
                {activity.isLoading ? (
                  <SkeletonText lines={5} />
                ) : activity.isError || !activity.data ? (
                  <ErrorState message={messageForError(activity.error)} onRetry={() => void activity.refetch()} />
                ) : (
                  <ActivityChart data={activity.data} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Moods</CardTitle>
                {moods.data && moods.data.total > 0 ? (
                  <Badge tone="outline">{moods.data.total} recorded</Badge>
                ) : null}
              </CardHeader>
              <CardContent className="pt-4">
                {moods.isLoading ? (
                  <SkeletonText lines={5} />
                ) : moods.isError || !moods.data ? (
                  <ErrorState message={messageForError(moods.error)} onRetry={() => void moods.refetch()} />
                ) : (
                  <>
                    <MoodBreakdown data={moods.data} />
                    {moods.data.top_emotions.length > 0 ? (
                      <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-ink-soft">
                        Most frequent:{" "}
                        <span className="capitalize text-ink">{moods.data.top_emotions.join(", ")}</span>
                      </p>
                    ) : null}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Consistency</CardTitle>
              <span className="text-[11px] text-ink-muted">
                {data.first_entry_date ? `Since ${formatDateShort(data.first_entry_date)}` : "No entries yet"}
              </span>
            </CardHeader>
            <CardContent className="pt-4">
              {heatmap.isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : heatmap.isError || !heatmap.data ? (
                <ErrorState message={messageForError(heatmap.error)} onRetry={() => void heatmap.refetch()} />
              ) : (
                <Heatmap data={heatmap.data} />
              )}
            </CardContent>
          </Card>

          <p className="text-[11px] leading-relaxed text-ink-muted">
            A streak is informational. A missed day never deletes the days you wrote — it simply isn&apos;t
            counted in the current run.
          </p>
        </>
      )}
    </div>
  );
}
