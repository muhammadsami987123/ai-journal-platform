"use client";

import { Plus, SkipForward, Undo2 } from "lucide-react";import { useEffect, useRef, useState } from "react";
import type { Answer, Question } from "@journal/shared";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Guided questions. Skipping is persisted distinctly from an empty answer
 * (T7.4), and every write is a batch upsert of exactly one question.
 */
export function QuestionsPanel({
  questions,
  answers,
  loading,
  savingId,
  onSaveAnswer,
  onAddQuestion
}: {
  questions: Question[];
  answers: Answer[];
  loading: boolean;
  savingId: string | null;
  onSaveAnswer: (questionId: string, patch: { answer_text?: string; is_skipped?: boolean }) => void;
  onAddQuestion: (prompt: string) => Promise<boolean>;
}) {
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [skips, setSkips] = useState<Record<string, boolean>>({});
  const [newPrompt, setNewPrompt] = useState("");
  const [adding, setAdding] = useState(false);
  const touchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const nextTexts: Record<string, string> = {};
    const nextSkips: Record<string, boolean> = {};
    for (const answer of answers) {
      nextTexts[answer.question_id] = answer.answer_text;
      nextSkips[answer.question_id] = answer.is_skipped;
    }
    setTexts((current) => {
      const merged = { ...nextTexts };
      for (const key of touchedRef.current) {
        if (current[key] !== undefined) merged[key] = current[key];
      }
      return merged;
    });
    setSkips((current) => ({ ...nextSkips, ...current, ...nextSkips }));
  }, [answers]);

  const answered = questions.filter(
    (question) => (texts[question.id] ?? "").trim().length > 0 && !skips[question.id]
  ).length;

  async function addQuestion() {
    const prompt = newPrompt.trim();
    if (!prompt) return;
    setAdding(true);
    const ok = await onAddQuestion(prompt);
    if (ok) setNewPrompt("");
    setAdding(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          {answered} of {questions.length} answered
        </p>
        <Badge tone={answered === questions.length && questions.length > 0 ? "success" : "neutral"}>
          {questions.length === 0 ? "Loading" : `${Math.round((answered / Math.max(questions.length, 1)) * 100)}%`}
        </Badge>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-subtle">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300"
          style={{ width: `${questions.length ? (answered / questions.length) * 100 : 0}%` }}
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {questions.map((question) => {
            const text = texts[question.id] ?? "";
            const skipped = Boolean(skips[question.id]);
            const saving = savingId === question.id;
            return (
              <li
                key={question.id}
                className={cn(
                  "rounded-sm border p-3 transition-colors",
                  skipped ? "border-dashed border-border bg-subtle/40" : "border-border bg-surface"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <label
                    htmlFor={`q-${question.id}`}
                    className="text-sm font-medium leading-snug text-ink"
                  >
                    {question.prompt}
                  </label>
                  <div className="flex shrink-0 items-center gap-1">
                    {saving ? <span className="text-[10px] text-ink-muted">Saving…</span> : null}
                    {question.is_system ? null : <Badge tone="outline">Custom</Badge>}
                  </div>
                </div>

                {skipped ? (
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-xs italic text-ink-muted">
                      <SkipForward aria-hidden="true" className="size-3.5" />
                      Skipped for this entry
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSkips((current) => ({ ...current, [question.id]: false }));
                        onSaveAnswer(question.id, { is_skipped: false });
                      }}
                    >
                      <Undo2 aria-hidden="true" className="size-3.5" />
                      Undo
                    </Button>
                  </div>
                ) : (
                  <>
                    <textarea
                      id={`q-${question.id}`}
                      value={text}
                      rows={1}
                      maxLength={10_000}
                      placeholder="A sentence is enough…"
                      onChange={(event) => {
                        touchedRef.current.add(question.id);
                        setTexts((current) => ({ ...current, [question.id]: event.target.value }));
                      }}
                      onBlur={(event) => {
                        const value = event.target.value;
                        const previous = answers.find((answer) => answer.question_id === question.id);
                        if ((previous?.answer_text ?? "") !== value) {
                          onSaveAnswer(question.id, { answer_text: value, is_skipped: false });
                        }
                      }}
                      className="mt-2 w-full resize-none rounded-xs border border-border bg-canvas px-2.5 py-2 text-sm leading-relaxed text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
                    />
                    <div className="mt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setSkips((current) => ({ ...current, [question.id]: true }));
                          onSaveAnswer(question.id, { is_skipped: true, answer_text: "" });
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-muted hover:text-ink"
                      >
                        <SkipForward aria-hidden="true" className="size-3" />
                        Skip this one
                      </button>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex items-end gap-2 border-t border-border pt-3">
        <div className="flex-1">
          <label htmlFor="new-question" className="text-xs font-medium text-ink-soft">
            Add your own question
          </label>
          <Input
            id="new-question"
            value={newPrompt}
            maxLength={500}
            placeholder="What do I want to remember from today?"
            onChange={(event) => setNewPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void addQuestion();
              }
            }}
            className="mt-1 h-9 text-sm"
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          loading={adding}
          disabled={!newPrompt.trim()}
          onClick={() => void addQuestion()}
          aria-label="Add question"
        >
          <Plus aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </div>
  );
}
