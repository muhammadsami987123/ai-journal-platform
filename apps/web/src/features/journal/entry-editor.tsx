"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Expand,
  Globe2,
  Minimize2,
  Save,
  Sparkles,
  Trash2
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { countWords, LIMITS, type EntryDetail, type JournalEntry, type Question } from "@journal/shared";
import { api, messageForError } from "@/lib/api/client";
import {
  cn,
  directionFor,
  formatDateShort,
  scriptClass
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { ErrorState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { MoodPicker } from "@/components/mood";
import { useMe } from "@/hooks/use-me";
import { AiReview } from "./ai-review";
import { QuestionsPanel } from "./questions-panel";

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

interface Snapshot {
  title: string;
  text: string;
  language: string;
  entryDate: string;
}

function sameSnapshot(a: Snapshot, b: Snapshot): boolean {
  return (
    a.title === b.title &&
    a.text === b.text &&
    a.language === b.language &&
    a.entryDate === b.entryDate
  );
}

function SaveIndicator({ state, error, onRetry }: { state: SaveState; error: string | null; onRetry: () => void }) {
  return (
    <div aria-live="polite" className="flex items-center gap-2 text-xs">
      {state === "saving" ? <span className="text-ink-muted">Saving…</span> : null}
      {state === "saved" ? (
        <span className="flex items-center gap-1 text-success">
          <CheckCircle2 aria-hidden="true" className="size-3.5" />
          Saved
        </span>
      ) : null}
      {state === "dirty" ? <span className="text-warning">Unsaved changes</span> : null}
      {state === "error" ? (
        <button
          type="button"
          onClick={onRetry}
          className="font-medium text-danger underline decoration-danger/40 underline-offset-4"
          title={error ?? undefined}
        >
          Couldn&apos;t save — retry
        </button>
      ) : null}
    </div>
  );
}

export function EntryEditor({ entryId, initialDate }: { entryId?: string; initialDate: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const me = useMe();
  const autosaveEnabled = me.data?.preferences.autosave_enabled ?? true;

  const [id, setId] = useState<string | null>(entryId ?? null);
  const idRef = useRef<string | null>(entryId ?? null);
  const [entryDate, setEntryDate] = useState(initialDate);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [language, setLanguage] = useState<string>(
    me.data?.preferences.default_language ?? "en"
  );
  const [moodNote, setMoodNote] = useState("");
  const [moodSaving, setMoodSaving] = useState(false);
  const [answerSavingId, setAnswerSavingId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const hydratedRef = useRef(false);
  const syncedRef = useRef<string | null>(null);
  const savedRef = useRef<Snapshot>({
    title: "",
    text: "",
    language: me.data?.preferences.default_language ?? "en",
    entryDate: initialDate
  });
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);

  const detail = useQuery({
    queryKey: ["entry", id],
    queryFn: () => api.get<EntryDetail>(`/api/v1/entries/${id}`),
    enabled: Boolean(id)
  });

  const questions = useQuery({
    queryKey: ["questions"],
    queryFn: () => api.get<Question[]>("/api/v1/questions"),
    staleTime: 5 * 60_000
  });

  const entry = detail.data?.entry ?? null;

  useEffect(() => {
    const data = detail.data;
    if (!data) return;
    if (syncedRef.current === data.entry.id) return;
    syncedRef.current = data.entry.id;

    const snapshot: Snapshot = {
      title: data.entry.title ?? "",
      text: data.entry.final_text || data.entry.original_text,
      language: data.entry.language ?? me.data?.preferences.default_language ?? "en",
      entryDate: data.entry.entry_date
    };
    savedRef.current = snapshot;
    dirtyRef.current = false;
    setTitle(snapshot.title);
    setText(snapshot.text);
    setLanguage(snapshot.language);
    setEntryDate(snapshot.entryDate);
    setMoodNote(data.mood?.note ?? "");
    hydratedRef.current = true;
    setSaveState("saved");
    setSaveError(null);
  }, [detail.data, me.data?.preferences.default_language]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(Math.max(node.scrollHeight, 260), 900)}px`;
  }, [text]);

  const saveNow = useCallback(async () => {
    if (!hydratedRef.current) return;
    if (savingRef.current) return;

    const snapshot: Snapshot = { title, text, language, entryDate };
    if (idRef.current && sameSnapshot(snapshot, savedRef.current)) {
      dirtyRef.current = false;
      return;
    }
    if (!idRef.current && !text.trim() && !title.trim()) return;

    savingRef.current = true;
    dirtyRef.current = false;
    setSaveState("saving");

    try {
      if (!idRef.current) {
        const created = await api.post<JournalEntry>("/api/v1/entries", {
          entry_date: snapshot.entryDate,
          title: snapshot.title.trim() || null,
          original_text: snapshot.text,
          language: snapshot.language
        });
        idRef.current = created.id;
        setId(created.id);
        window.history.replaceState(null, "", `/journal/${created.id}`);
      } else {
        await api.patch<JournalEntry>(`/api/v1/entries/${idRef.current}`, {
          entry_date: snapshot.entryDate,
          title: snapshot.title.trim() || null,
          final_text: snapshot.text,
          language: snapshot.language
        });
      }
      savedRef.current = snapshot;
      setSaveState("saved");
      setSaveError(null);
      void queryClient.invalidateQueries({ queryKey: ["entries"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["calendar"] });
    } catch (error) {
      dirtyRef.current = true;
      setSaveState("error");
      setSaveError(messageForError(error));
    } finally {
      savingRef.current = false;
      if (dirtyRef.current && idRef.current) {
        window.setTimeout(() => void saveNowRef.current(), 10);
      }
    }
  }, [entryDate, language, queryClient, text, title]);

  const saveNowRef = useRef(saveNow);
  useEffect(() => {
    saveNowRef.current = saveNow;
  }, [saveNow]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    const snapshot: Snapshot = { title, text, language, entryDate };
    if (sameSnapshot(snapshot, savedRef.current)) return;
    dirtyRef.current = true;
    setSaveState("dirty");
    if (!autosaveEnabled) return;
    const timer = window.setTimeout(() => void saveNowRef.current(), LIMITS.AUTOSAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [title, text, language, entryDate, autosaveEnabled]);

  useEffect(() => {
    if (id) hydratedRef.current = true;
  }, [id]);

  // A brand-new entry has no server record yet, so nothing hydrates it. Mark it
  // ready once preferences (default language) have settled, otherwise autosave
  // would never leave its guard and the first draft would never be created.
  useEffect(() => {
    if (entryId || me.isLoading) return;
    hydratedRef.current = true;
  }, [entryId, me.isLoading]);

  async function ensureEntry(): Promise<string | null> {
    if (idRef.current) return idRef.current;
    await saveNow();
    return idRef.current;
  }

  function invalidateEntry() {
    void queryClient.invalidateQueries({ queryKey: ["entry", idRef.current] });
    void queryClient.invalidateQueries({ queryKey: ["entries"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    void queryClient.invalidateQueries({ queryKey: ["calendar"] });
    void queryClient.invalidateQueries({ queryKey: ["insights"] });
  }

  async function setMood(mood: string) {
    const currentId = await ensureEntry();
    if (!currentId) {
      toast({ title: "Write a line first", description: "A mood is attached to an entry.", tone: "error" });
      return;
    }
    setMoodSaving(true);
    try {
      await api.put(`/api/v1/entries/${currentId}/mood`, {
        mood,
        note: moodNote.trim() || undefined
      });
      invalidateEntry();
    } catch (error) {
      toast({ title: "Could not save mood", description: messageForError(error), tone: "error" });
    } finally {
      setMoodSaving(false);
    }
  }

  async function saveMoodNote(note: string) {
    const currentId = await ensureEntry();
    if (!currentId || !detail.data?.mood) return;
    setMoodSaving(true);
    try {
      await api.put(`/api/v1/entries/${currentId}/mood`, {
        mood: detail.data.mood.mood,
        note: note.trim() || undefined
      });
      invalidateEntry();
    } catch (error) {
      toast({ title: "Could not save the note", description: messageForError(error), tone: "error" });
    } finally {
      setMoodSaving(false);
    }
  }

  async function clearMood() {
    if (!idRef.current) return;
    setMoodSaving(true);
    try {
      await api.del(`/api/v1/entries/${idRef.current}/mood`);
      invalidateEntry();
    } catch (error) {
      toast({ title: "Could not remove mood", description: messageForError(error), tone: "error" });
    } finally {
      setMoodSaving(false);
    }
  }

  async function saveAnswer(
    questionId: string,
    patch: { answer_text?: string; is_skipped?: boolean }
  ) {
    const currentId = await ensureEntry();
    if (!currentId) return;
    setAnswerSavingId(questionId);
    try {
      const answers = await api.put<EntryDetail["answers"]>(
        `/api/v1/entries/${currentId}/answers`,
        { answers: [{ question_id: questionId, ...patch }] }
      );
      queryClient.setQueryData<EntryDetail>(["entry", currentId], (old) =>
        old ? { ...old, answers } : old
      );
      queryClient.invalidateQueries({ queryKey: ["entries"] });
    } catch (error) {
      toast({ title: "Could not save that answer", description: messageForError(error), tone: "error" });
    } finally {
      setAnswerSavingId(null);
    }
  }

  async function addQuestion(prompt: string): Promise<boolean> {
    try {
      await api.post("/api/v1/questions", { prompt });
      await queryClient.invalidateQueries({ queryKey: ["questions"] });
      toast({ title: "Question added" });
      return true;
    } catch (error) {
      toast({ title: "Could not add question", description: messageForError(error), tone: "error" });
      return false;
    }
  }

  const complete = useMutation({
    mutationFn: async () => {
      const currentId = await ensureEntry();
      if (!currentId) throw new Error("Write something first.");
      return api.post<JournalEntry>(`/api/v1/entries/${currentId}/complete`, { final_text: text });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<EntryDetail>(["entry", updated.id], (old) =>
        old ? { ...old, entry: updated } : old
      );
      invalidateEntry();
      toast({
        title: "Entry marked complete",
        description: `${updated.word_count} words kept exactly as you wrote them.`
      });
    },
    onError: (error) =>
      toast({ title: "Could not complete entry", description: messageForError(error), tone: "error" })
  });

  const reopen = useMutation({
    mutationFn: () => api.post<JournalEntry>(`/api/v1/entries/${idRef.current}/reopen`),
    onSuccess: (updated) => {
      queryClient.setQueryData<EntryDetail>(["entry", updated.id], (old) =>
        old ? { ...old, entry: updated } : old
      );
      invalidateEntry();
      toast({ title: "Back to draft" });
    },
    onError: (error) =>
      toast({ title: "Could not reopen entry", description: messageForError(error), tone: "error" })
  });

  const remove = useMutation({
    mutationFn: () => api.del(`/api/v1/entries/${idRef.current}`),
    onSuccess: () => {
      invalidateEntry();
      toast({ title: "Entry moved to deleted", description: "Restore it from Journal → Show deleted." });
      router.push("/journal");
    },
    onError: (error) =>
      toast({ title: "Could not delete entry", description: messageForError(error), tone: "error" })
  });

  if (entryId && detail.isError) {
    return (
      <div className="space-y-4">
        <Link href="/journal" className={buttonStyles("ghost", "sm", "w-fit")}>
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to journal
        </Link>
        <ErrorState message={messageForError(detail.error)} onRetry={() => void detail.refetch()} />
      </div>
    );
  }

  const loadingEntry = Boolean(entryId) && detail.isLoading;
  const words = countWords(text);
  const status = entry?.status ?? "draft";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/journal" className={buttonStyles("ghost", "sm", "px-2")}>
          <ArrowLeft aria-hidden="true" className="size-4" />
          Journal
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <SaveIndicator
            state={saveState}
            error={saveError}
            onRetry={() => void saveNowRef.current()}
          />
          <span className="hidden h-4 w-px bg-border sm:block" />
          <Button variant="ghost" size="sm" onClick={() => setFocusMode((value) => !value)}>
            {focusMode ? (
              <>
                <Minimize2 aria-hidden="true" className="size-3.5" />
                Exit focus
              </>
            ) : (
              <>
                <Expand aria-hidden="true" className="size-3.5" />
                Focus
              </>
            )}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            loading={saveState === "saving"}
            onClick={() => void saveNowRef.current()}
          >
            <Save aria-hidden="true" className="size-3.5" />
            Save draft
          </Button>
          {status === "complete" ? (
            <Button variant="secondary" size="sm" loading={reopen.isPending} onClick={() => reopen.mutate()}>
              Reopen draft
            </Button>
          ) : (
            <Button size="sm" loading={complete.isPending} onClick={() => complete.mutate()}>
              <CheckCircle2 aria-hidden="true" className="size-3.5" />
              Mark complete
            </Button>
          )}
        </div>
      </div>

      {loadingEntry ? (
        <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
          <Card>
            <CardContent className="space-y-4">
              <Skeleton className="h-6 w-24" />
              <SkeletonText lines={8} />
            </CardContent>
          </Card>
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      ) : (
        <div className={cn("grid gap-5", focusMode ? "grid-cols-1" : "xl:grid-cols-[1.7fr_1fr]")}>
          <div className="min-w-0 space-y-4">
            <Card className="overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={status === "complete" ? "success" : "warning"}>
                    {status === "complete" ? "Complete" : "Draft"}
                  </Badge>
                  <Badge tone="outline">{words} words</Badge>
                  {entry?.ai_generation_id ? (
                    <Badge tone="accent">
                      <Sparkles aria-hidden="true" className="size-3" />
                      AI applied
                    </Badge>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="entry-date" className="sr-only">
                    Entry date
                  </label>
                  <Input
                    id="entry-date"
                    type="date"
                    value={entryDate}
                    onChange={(event) => setEntryDate(event.target.value)}
                    className="h-9 w-[150px] text-xs"
                  />
                  <div className="flex items-center gap-1.5 rounded-sm border border-border px-2">
                    <Globe2 aria-hidden="true" className="size-3.5 text-ink-muted" />
                    <label htmlFor="entry-language" className="sr-only">
                      Writing language
                    </label>
                    <Select
                      id="entry-language"
                      value={language}
                      onChange={(event) => setLanguage(event.target.value)}
                      className="h-9 border-0 bg-transparent pl-0 text-xs"
                    >
                      <option value="en">English</option>
                      <option value="ur">اردو</option>
                      <option value="hi">हिन्दी</option>
                      <option value="roman-ur">Roman Urdu</option>
                    </Select>
                  </div>
                </div>
              </div>

              <div className={cn("px-5 pb-5 pt-6 sm:px-8", focusMode && "mx-auto w-full max-w-3xl")}>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={LIMITS.MAX_TITLE_LENGTH}
                  placeholder="A title, if you want one"
                  aria-label="Entry title"
                  className="w-full border-0 bg-transparent font-serif text-2xl font-medium tracking-tight text-ink placeholder:text-ink-muted/70 focus:outline-none sm:text-3xl"
                />

                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  maxLength={LIMITS.MAX_ENTRY_LENGTH}
                  dir={directionFor(language)}
                  placeholder="What happened today? Write it the way you would say it."
                  aria-label="Entry text"
                  className={cn(
                    "prose-journal mt-4 w-full resize-none border-0 bg-transparent focus:outline-none",
                    "placeholder:font-sans placeholder:text-sm placeholder:leading-relaxed placeholder:text-ink-muted/80",
                    scriptClass(language),
                    focusMode ? "min-h-[55vh]" : "min-h-[42vh]"
                  )}
                />

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-[11px] text-ink-muted">
                  <span>
                    {words} words · {text.length.toLocaleString("en-US")} characters
                  </span>
                  <span>Your original words are never rewritten.</span>
                </div>
              </div>
            </Card>
          </div>

          {!focusMode ? (
            <aside className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Mood</CardTitle>
                  {detail.data?.mood ? (
                    <span className="text-[11px] text-ink-muted">
                      {moodSaving ? "Saving…" : "Saved"}
                    </span>
                  ) : null}
                </CardHeader>
                <CardContent className="pt-4">
                  <MoodPicker
                    value={detail.data?.mood?.mood ?? null}
                    note={moodNote}
                    saving={moodSaving}
                    onSelect={(mood) => void setMood(mood)}
                    onNoteChange={setMoodNote}
                    onClear={detail.data?.mood ? () => void clearMood() : undefined}
                  />
                  {detail.data?.mood ? (
                    <button
                      type="button"
                      onClick={() => void saveMoodNote(moodNote)}
                      className="mt-3 text-[11px] font-medium text-accent hover:text-accent-hover"
                    >
                      Save mood note
                    </button>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Guided questions</CardTitle>
                  <ChevronDown aria-hidden="true" className="size-4 text-ink-muted" />
                </CardHeader>
                <CardContent className="pt-4">
                  <QuestionsPanel
                    questions={questions.data ?? []}
                    answers={detail.data?.answers ?? []}
                    loading={questions.isLoading}
                    savingId={answerSavingId}
                    onSaveAnswer={(questionId, patch) => void saveAnswer(questionId, patch)}
                    onAddQuestion={addQuestion}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Writing assistant</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {id ? (
                    <AiReview
                      entryId={id}
                      originalText={entry?.original_text ?? ""}
                      finalText={text}
                      generations={detail.data?.generations ?? []}
                      onApplied={() => void detail.refetch()}
                    />
                  ) : (
                    <p className="text-sm leading-relaxed text-ink-soft">
                      Write a little first. Once this entry exists, the assistant can propose a
                      structured draft for you to review.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Entry details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4 text-xs text-ink-soft">
                  {entry ? (
                    <>
                      <div className="flex justify-between gap-3">
                        <span className="text-ink-muted">Created</span>
                        <span>{new Date(entry.created_at).toLocaleString("en-US")}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-ink-muted">Updated</span>
                        <span>{new Date(entry.updated_at).toLocaleString("en-US")}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-ink-muted">Date</span>
                        <span>{formatDateShort(entry.entry_date)}</span>
                      </div>
                    </>
                  ) : (
                    <p>This entry will be created when you start writing.</p>
                  )}

                  {entry?.original_text && entry.original_text !== text ? (
                    <details className="rounded-sm border border-border bg-canvas">
                      <summary className="cursor-pointer px-2.5 py-2 text-[11px] font-medium text-ink-soft">
                        Your original words
                      </summary>
                      <p className="whitespace-pre-wrap border-t border-border px-2.5 py-2 text-[11px] leading-relaxed text-ink-soft">
                        {entry.original_text}
                      </p>
                    </details>
                  ) : null}

                  {detail.data?.transcript ? (
                    <details className="rounded-sm border border-border bg-canvas">
                      <summary className="cursor-pointer px-2.5 py-2 text-[11px] font-medium text-ink-soft">
                        Voice transcript
                      </summary>
                      <div className="border-t border-border px-2.5 py-2">
                        <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-ink-soft">
                          {detail.data.transcript.text}
                        </p>
                        <p className="mt-1.5 text-[10px] text-ink-muted">
                          {detail.data.transcript.provider} ·{" "}
                          {detail.data.transcript.duration_ms
                            ? `${Math.round(detail.data.transcript.duration_ms / 1000)}s`
                            : "duration unknown"}
                        </p>
                      </div>
                    </details>
                  ) : null}

                  {id ? (
                    <button
                      type="button"
                      onClick={() => setDeleteOpen(true)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium text-danger hover:underline"
                    >
                      <Trash2 aria-hidden="true" className="size-3.5" />
                      Move entry to deleted
                    </button>
                  ) : null}
                </CardContent>
              </Card>

              <div className="rounded-md border border-border bg-subtle/50 p-4">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                  <BookOpen aria-hidden="true" className="size-3.5" />
                  A note on privacy
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
                  Only you can read this entry. The assistant receives the text you submit for a draft
                  and returns a suggestion; nothing is applied automatically.
                </p>
              </div>
            </aside>
          ) : null}
        </div>
      )}

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Move this entry to deleted?"
        description="It disappears from your journal, calendar and stats. You can restore it later from Journal → Filters → Show deleted."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              Keep entry
            </Button>
            <Button variant="danger" loading={remove.isPending} onClick={() => remove.mutate()}>
              Delete entry
            </Button>
          </>
        }
      />
    </div>
  );
}
