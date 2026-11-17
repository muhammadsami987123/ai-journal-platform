"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  CalendarDays,
  Download,
  Flame,
  Globe2,
  LayoutDashboard,
  PenLine,
  Settings,
  Type
} from "lucide-react";
import type { EntrySummary, InsightsOverview, Paginated } from "@journal/shared";
import { api, messageForError } from "@/lib/api/client";
import { formatDateShort, initialsOf, LANGUAGE_OPTIONS } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { useMe } from "@/hooks/use-me";

function languageLabel(value: string): string {
  if (value === "match") return "Match my writing";
  return LANGUAGE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function Stat({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: string;
  icon: typeof Flame;
}) {
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

export function ProfileView() {
  const me = useMe();
  const overview = useQuery({
    queryKey: ["insights", "overview"],
    queryFn: () => api.get<InsightsOverview>("/api/v1/insights/overview")
  });
  const recent = useQuery({
    queryKey: ["entries", "profile-recent"],
    queryFn: () => api.get<Paginated<EntrySummary>>("/api/v1/entries", { limit: 5 })
  });

  if (me.isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-[74px]" />
          ))}
        </div>
        <SkeletonText lines={4} />
      </div>
    );
  }

  if (me.isError || !me.data) {
    return <ErrorState message={messageForError(me.error)} onRetry={() => void me.refetch()} />;
  }

  const { user, profile, preferences } = me.data;
  const stats = overview.data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Profile"
        title={profile.display_name}
        description={profile.bio ?? "You haven't added a bio yet. A single line is enough."}
        actions={
          <>
            <Link href="/settings" className={buttonStyles("secondary", "sm")}>
              <Settings aria-hidden="true" className="size-3.5" />
              Edit profile
            </Link>
            <Link href="/journal/new" className={buttonStyles("primary", "sm")}>
              <PenLine aria-hidden="true" className="size-3.5" />
              Write today
            </Link>
          </>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="size-16 shrink-0 rounded-full border border-border object-cover"
            />
          ) : (
            <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-accent-soft text-lg font-semibold text-accent">
              {initialsOf(profile.display_name || user.name) || "J"}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-ink">{user.name}</p>
            <p className="truncate text-sm text-ink-soft">{user.email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone="outline">
                <Globe2 aria-hidden="true" className="size-3" />
                {profile.timezone}
              </Badge>
              <Badge tone="outline">
                Writes in {languageLabel(preferences.default_language)}
              </Badge>
              <Badge tone={user.emailVerified ? "success" : "neutral"}>
                {user.emailVerified ? "Email verified" : "Email unverified"}
              </Badge>
            </div>
          </div>

          <p className="shrink-0 text-xs text-ink-muted">
            Journaling since {formatDateShort(profile.created_at.slice(0, 10))}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Entries" value={stats ? String(stats.total_entries) : "—"} icon={BookOpen} />
        <Stat
          label="Words"
          value={stats ? stats.total_words.toLocaleString("en-US") : "—"}
          icon={Type}
        />
        <Stat
          label="Days written"
          value={stats ? String(stats.days_journaled) : "—"}
          icon={CalendarDays}
        />
        <Stat
          label="Current streak"
          value={stats ? `${stats.current_streak}d` : "—"}
          icon={Flame}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="items-center">
            <CardTitle>Recent entries</CardTitle>
            <Link href="/journal" className="text-xs font-medium text-accent hover:text-accent-hover">
              Open journal
            </Link>
          </CardHeader>
          <CardContent className="pt-4">
            {recent.isLoading ? (
              <SkeletonText lines={4} />
            ) : recent.isError ? (
              <ErrorState message={messageForError(recent.error)} onRetry={() => void recent.refetch()} />
            ) : recent.data && recent.data.items.length > 0 ? (
              <ul className="divide-y divide-border">
                {recent.data.items.map((entry) => (
                  <li key={entry.id}>
                    <Link
                      href={`/journal/${entry.id}`}
                      className="flex items-start justify-between gap-3 rounded-sm px-1 py-3 hover:bg-subtle/60"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">
                          {entry.title?.trim() || "Untitled entry"}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-ink-soft">{entry.excerpt}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[11px] text-ink-muted">{formatDateShort(entry.entry_date)}</p>
                        <Badge
                          tone={entry.status === "complete" ? "success" : "warning"}
                          className="mt-1"
                        >
                          {entry.status === "complete" ? "Complete" : "Draft"}
                        </Badge>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                compact
                icon={BookOpen}
                title="No entries yet"
                description="Your first entry will appear here as soon as you start writing."
                action={
                  <Link href="/journal/new" className={buttonStyles("primary", "sm")}>
                    Write the first entry
                  </Link>
                }
              />
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>How your journal behaves</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-ink-muted">Default language</span>
                <span className="text-right text-ink">{languageLabel(preferences.default_language)}</span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-ink-muted">AI drafts</span>
                <span className="text-right text-ink">{languageLabel(preferences.ai_output_language)}</span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-ink-muted">Week starts</span>
                <span className="text-right text-ink">
                  {preferences.week_starts_on === 1 ? "Monday" : "Sunday"}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-ink-muted">Autosave</span>
                <span className="text-right text-ink">
                  {preferences.autosave_enabled ? "On" : "Manual"}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-ink-muted">Accent</span>
                <span className="text-right capitalize text-ink">{preferences.theme_accent}</span>
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-xs leading-relaxed text-ink-soft">
                  Changing any of these takes effect immediately across the app.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <p className="text-xs leading-relaxed text-ink-soft">
                Export a complete JSON copy at any time. Deleting your account removes everything,
                permanently.
              </p>
              <div className="flex flex-wrap gap-2">
                <a href="/api/v1/me/export" download className={buttonStyles("secondary", "sm")}>
                  <Download aria-hidden="true" className="size-3.5" />
                  Export data
                </a>
                <Link href="/settings#delete-account" className={buttonStyles("ghost", "sm")}>
                  Account settings
                </Link>
              </div>
            </CardContent>
          </Card>

          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-md border border-border bg-subtle/50 px-4 py-3 text-sm font-medium text-ink-soft hover:border-border-strong hover:text-ink"
          >
            <LayoutDashboard aria-hidden="true" className="size-4 text-accent" />
            Back to the dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
