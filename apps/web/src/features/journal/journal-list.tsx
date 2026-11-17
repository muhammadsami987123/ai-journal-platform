"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownUp,
  CalendarDays,
  FileText,
  Mic,
  PenLine,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MOODS, type EntrySummary, type Mood, type Paginated } from "@journal/shared";
import { api, messageForError } from "@/lib/api/client";
import { cn, formatDateShort } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Field, Input, Select } from "@/components/ui/input";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { MoodChip, MoodIcon } from "@/components/mood";
import { PageHeader } from "@/components/page-header";

function Highlight({ text, query }: { text: string; query: string }) {
  const term = query.trim();
  if (!term) return <>{text}</>;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === term.toLowerCase() ? (
          <mark key={index} className="rounded-xs bg-accent-soft px-0.5 text-ink">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  );
}

function EntryCard({
  entry,
  query,
  onDelete,
  onRestore,
  restoring
}: {
  entry: EntrySummary;
  query: string;
  onDelete: (entry: EntrySummary) => void;
  onRestore: (entry: EntrySummary) => void;
  restoring: boolean;
}) {
  return (
    <article
      className={cn(
        "group rounded-md border border-border bg-surface p-4 shadow-raised transition-colors hover:border-border-strong sm:p-5",
        entry.deleted_at && "border-dashed opacity-80"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
            {formatDateShort(entry.entry_date)}
          </p>
          <Badge tone={entry.deleted_at ? "danger" : entry.status === "complete" ? "success" : "warning"}>
            {entry.deleted_at ? "Deleted" : entry.status === "complete" ? "Complete" : "Draft"}
          </Badge>
          {entry.has_ai ? (
            <Badge tone="accent">
              <Sparkles aria-hidden="true" className="size-3" />
              AI approved
            </Badge>
          ) : null}
          {entry.has_transcript ? (
            <Badge tone="outline">
              <Mic aria-hidden="true" className="size-3" />
              Voice
            </Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          {entry.deleted_at ? (
            <Button variant="secondary" size="sm" loading={restoring} onClick={() => onRestore(entry)}>
              <RotateCcw aria-hidden="true" className="size-3.5" />
              Restore
            </Button>
          ) : (
            <>
              <Link
                href={`/journal/${entry.id}`}
                className={buttonStyles("ghost", "sm", "opacity-80 group-hover:opacity-100")}
              >
                Open
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(entry)}
                aria-label={`Move entry from ${formatDateShort(entry.entry_date)} to deleted`}
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <Link href={entry.deleted_at ? `/journal?include_deleted=true` : `/journal/${entry.id}`} className="mt-2 block">
        <h3 className="text-[17px] font-semibold leading-snug text-ink">
          <Highlight text={entry.title?.trim() || "Untitled entry"} query={query} />
        </h3>
        <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-ink-soft">
          <Highlight text={entry.excerpt || "No text yet."} query={query} />
        </p>
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {entry.moods.map((mood) => (
          <MoodChip key={mood} mood={mood} />
        ))}
        <span className="text-[11px] text-ink-muted">{entry.word_count} words</span>
        {entry.language ? (
          <span className="text-[11px] uppercase tracking-wide text-ink-muted">{entry.language}</span>
        ) : null}
      </div>
    </article>
  );
}

function FiltersSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((index) => (
        <div key={index} className="rounded-md border border-border bg-surface p-5">
          <Skeleton className="h-3 w-24" />
          <div className="mt-3">
            <SkeletonText lines={2} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function JournalList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const q = searchParams.get("q") ?? "";
  const date = searchParams.get("date") ?? "";
  const status = searchParams.get("status") ?? "";
  const sort = searchParams.get("sort") === "oldest" ? "oldest" : "newest";
  const includeDeleted = searchParams.get("include_deleted") === "true";
  const hasAi = searchParams.get("hasAi") === "true";
  const moods = searchParams.getAll("mood") as Mood[];

  const [search, setSearch] = useState(q);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<EntrySummary | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    setSearch(q);
  }, [q]);

  function updateParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    const query = params.toString();
    router.replace(query ? `/journal?${query}` : "/journal");
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const current = searchParams.get("q") ?? "";
      if (search.trim() === current) return;
      updateParams((params) => {
        if (search.trim()) params.set("q", search.trim());
        else params.delete("q");
      });
    }, 420);
    return () => window.clearTimeout(timer);
  }, [search]);

  const filters = useMemo(
    () => ({
      q: q || undefined,
      from: date || undefined,
      to: date || undefined,
      status: status === "draft" || status === "complete" ? status : undefined,
      hasAi: hasAi || undefined,
      sort,
      mood: moods.length > 0 ? moods : undefined,
      include_deleted: includeDeleted || undefined
    }),
    [q, date, status, hasAi, sort, moods, includeDeleted]
  );

  const entries = useInfiniteQuery({
    queryKey: ["entries", filters],
    queryFn: ({ pageParam }) =>
      api.get<Paginated<EntrySummary>>("/api/v1/entries", {
        ...filters,
        cursor: (pageParam as string | null) ?? undefined,
        limit: 20
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.next_cursor
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.del<{ id: string }>(`/api/v1/entries/${id}`),
    onSuccess: () => {
      toast({
        title: "Entry moved to deleted",
        description: "Open Filters → Show deleted to restore it."
      });
      setPendingDelete(null);
      void queryClient.invalidateQueries({ queryKey: ["entries"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["calendar"] });
      void queryClient.invalidateQueries({ queryKey: ["insights"] });
    },
    onError: (error) =>
      toast({ title: "Could not delete entry", description: messageForError(error), tone: "error" })
  });

  async function restore(entry: EntrySummary) {
    setRestoringId(entry.id);
    try {
      await api.post(`/api/v1/entries/${entry.id}/restore`);
      toast({ title: "Entry restored" });
      void queryClient.invalidateQueries({ queryKey: ["entries"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["calendar"] });
    } catch (error) {
      toast({ title: "Could not restore entry", description: messageForError(error), tone: "error" });
    } finally {
      setRestoringId(null);
    }
  }

  const activeFilterCount =
    (date ? 1 : 0) + (status ? 1 : 0) + (hasAi ? 1 : 0) + moods.length + (includeDeleted ? 1 : 0);

  const items = entries.data?.pages.flatMap((page) => page.items) ?? [];
  const filteredEmpty = Boolean(q) || activeFilterCount > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="History"
        title="Your journal"
        description="Search your own words, filter by mood or status, and reopen any day."
        actions={
          <Link href="/journal/new" className={buttonStyles("primary", "md")}>
            <PenLine aria-hidden="true" className="size-4" />
            New entry
          </Link>
        }
      />

      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
            />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search titles, original text and final text…"
              maxLength={200}
              aria-label="Search entries"
              className="pl-9"
              autoFocus={searchParams.get("focus") === "search"}
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1.5 text-ink-muted hover:bg-subtle hover:text-ink"
                aria-label="Clear search"
              >
                <X aria-hidden="true" className="size-3.5" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1 rounded-sm border border-border bg-surface px-1">
              <ArrowDownUp aria-hidden="true" className="ml-2 size-3.5 text-ink-muted" />
              <Select
                aria-label="Sort entries"
                value={sort}
                onChange={(event) =>
                  updateParams((params) => {
                    params.set("sort", event.target.value);
                  })
                }
                className="h-9 border-0 bg-transparent pl-1 pr-7 text-xs"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </Select>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setFiltersOpen((value) => !value)}>
              <SlidersHorizontal aria-hidden="true" className="size-3.5" />
              Filters
              {activeFilterCount > 0 ? (
                <span className="ml-0.5 rounded-full bg-accent px-1.5 text-[10px] font-semibold text-ink-inverse">
                  {activeFilterCount}
                </span>
              ) : null}
            </Button>
          </div>
        </div>

        {date ? (
          <div className="flex items-center gap-2">
            <Badge tone="accent">
              <CalendarDays aria-hidden="true" className="size-3" />
              {formatDateShort(date)}
            </Badge>
            <button
              type="button"
              onClick={() =>
                updateParams((params) => {
                  params.delete("date");
                })
              }
              className="text-xs text-ink-muted underline decoration-border underline-offset-4 hover:text-ink"
            >
              Clear date
            </button>
          </div>
        ) : null}

        {filtersOpen ? (
          <div className="space-y-4 rounded-md border border-border bg-surface p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Status" htmlFor="filter-status">
                {({ id }) => (
                  <Select
                    id={id}
                    value={status}
                    onChange={(event) =>
                      updateParams((params) => {
                        if (event.target.value) params.set("status", event.target.value);
                        else params.delete("status");
                      })
                    }
                  >
                    <option value="">All statuses</option>
                    <option value="draft">Drafts</option>
                    <option value="complete">Complete</option>
                  </Select>
                )}
              </Field>
              <Field label="Exact date" htmlFor="filter-date">
                {({ id }) => (
                  <Input
                    id={id}
                    type="date"
                    value={date}
                    onChange={(event) =>
                      updateParams((params) => {
                        if (event.target.value) params.set("date", event.target.value);
                        else params.delete("date");
                      })
                    }
                  />
                )}
              </Field>
            </div>

            <div>
              <p className="text-sm font-medium text-ink">Moods</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {MOODS.map((mood) => {
                  const selected = moods.includes(mood.value);
                  return (
                    <button
                      key={mood.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        updateParams((params) => {
                          const current = params.getAll("mood");
                          params.delete("mood");
                          const next = selected
                            ? current.filter((value) => value !== mood.value)
                            : [...current, mood.value];
                          for (const value of next) params.append("mood", value);
                        })
                      }
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                        selected
                          ? "border-accent bg-accent-soft text-ink"
                          : "border-border bg-surface text-ink-soft hover:border-border-strong"
                      )}
                    >
                      <MoodIcon mood={mood.value} className="size-3.5" />
                      {mood.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 border-t border-border pt-3">
              <label className="flex items-center gap-2 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={hasAi}
                  onChange={(event) =>
                    updateParams((params) => {
                      if (event.target.checked) params.set("hasAi", "true");
                      else params.delete("hasAi");
                    })
                  }
                  className="size-4 rounded-xs accent-[var(--color-accent)]"
                />
                Has approved AI summary
              </label>
              <label className="flex items-center gap-2 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={includeDeleted}
                  onChange={(event) =>
                    updateParams((params) => {
                      if (event.target.checked) params.set("include_deleted", "true");
                      else params.delete("include_deleted");
                    })
                  }
                  className="size-4 rounded-xs accent-[var(--color-accent)]"
                />
                Show deleted
              </label>
              <button
                type="button"
                onClick={() => router.replace("/journal")}
                className="ml-auto text-xs font-medium text-ink-muted hover:text-ink"
              >
                Reset filters
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {entries.isLoading ? (
        <FiltersSkeleton />
      ) : entries.isError ? (
        <ErrorState message={messageForError(entries.error)} onRetry={() => void entries.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={
            q
              ? "No entries match that search"
              : includeDeleted && activeFilterCount === 1
                ? "Nothing in deleted"
                : filteredEmpty
                  ? "No entries match those filters"
                  : "Your journal is empty"
          }
          description={
            filteredEmpty
              ? "Clear the filters to see everything, or write something new."
              : "Start with today. A few lines now will be worth reading in a month."
          }
          action={
            filteredEmpty ? (
              <Button variant="secondary" onClick={() => router.replace("/journal")}>
                Clear filters
              </Button>
            ) : (
              <Link href="/journal/new" className={buttonStyles("primary", "md")}>
                Write the first entry
              </Link>
            )
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {items.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                query={q}
                onDelete={setPendingDelete}
                onRestore={(value) => void restore(value)}
                restoring={restoringId === entry.id}
              />
            ))}
          </div>

          <div className="flex flex-col items-center gap-2 pt-1">
            {entries.hasNextPage ? (
              <Button
                variant="secondary"
                loading={entries.isFetchingNextPage}
                onClick={() => void entries.fetchNextPage()}
              >
                {entries.isFetchingNextPage ? "Loading…" : "Load older entries"}
              </Button>
            ) : (
              <p className="text-xs text-ink-muted">
                {items.length} {items.length === 1 ? "entry" : "entries"} shown
              </p>
            )}
          </div>
        </>
      )}

      <Dialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Move this entry to deleted?"
        description="It disappears from your journal, calendar and stats. You can restore it later from Filters → Show deleted."
        footer={
          <>
            <Button variant="secondary" onClick={() => setPendingDelete(null)}>
              Keep entry
            </Button>
            <Button
              variant="danger"
              loading={remove.isPending}
              onClick={() => pendingDelete && remove.mutate(pendingDelete.id)}
            >
              Delete entry
            </Button>
          </>
        }
      />
    </div>
  );
}
