"use client";

import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, Check, RefreshCw, Sparkles } from "lucide-react";
import { useState } from "react";
import type { AiGeneration } from "@journal/shared";
import { api, messageForError } from "@/lib/api/client";
import { formatDateShort } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";

const SECTIONS: { key: keyof AiGeneration["output_json"]; label: string }[] = [
  { key: "activities", label: "Activities" },
  { key: "achievements", label: "Achievements" },
  { key: "challenges", label: "Challenges" },
  { key: "lessons", label: "Lessons" },
  { key: "reflections", label: "Reflections" },
  { key: "tomorrow_goals", label: "Tomorrow" }
];

/**
 * Review surface for AI drafts. Three distinct things are always visible:
 * the user's original text, the generated draft, and what is currently applied.
 * Nothing is written until Approve (T8.4).
 */
export function AiReview({
  entryId,
  originalText,
  finalText,
  generations,
  onApplied
}: {
  entryId: string;
  originalText: string;
  finalText: string;
  generations: AiGeneration[];
  onApplied: () => void;
}) {
  const { toast } = useToast();
  const [instruction, setInstruction] = useState("");
  const [editedMarkdown, setEditedMarkdown] = useState("");
  const [activeId, setActiveId] = useState<string | null>(generations[0]?.id ?? null);
  const [view, setView] = useState<"draft" | "original" | "applied">("draft");

  const latest = generations.find((generation) => generation.id === activeId) ?? generations[0] ?? null;

  const generate = useMutation({
    mutationFn: () =>
      api.post<AiGeneration>("/api/v1/ai/generate", {
        entry_id: entryId,
        source_type: "text",
        source_text: finalText.trim() || originalText,
        output_language: "match"
      }),
    onSuccess: (generation) => {
      setActiveId(generation.id);
      setEditedMarkdown(generation.output_markdown);
      setView("draft");
      onApplied();
      toast({ title: "Draft ready for review", description: "Nothing has been applied to your entry." });
    },
    onError: (error) =>
      toast({ title: "Draft unavailable", description: messageForError(error), tone: "error" })
  });

  const regenerate = useMutation({
    mutationFn: () =>
      api.post<AiGeneration>(`/api/v1/ai/generations/${latest?.id}/regenerate`, {
        instruction: instruction.trim() || undefined,
        output_language: "match"
      }),
    onSuccess: (generation) => {
      setActiveId(generation.id);
      setEditedMarkdown(generation.output_markdown);
      onApplied();
      toast({ title: "New draft ready", description: "The previous draft is still in history." });
    },
    onError: (error) =>
      toast({ title: "Could not regenerate", description: messageForError(error), tone: "error" })
  });

  const approve = useMutation({
    mutationFn: () =>
      api.post<AiGeneration>(`/api/v1/ai/generations/${latest?.id}/approve`, {
        apply_to: "final",
        edited_markdown: editedMarkdown.trim() ? editedMarkdown : undefined
      }),
    onSuccess: () => {
      onApplied();
      toast({ title: "Draft applied", description: "Your original text is unchanged." });
    },
    onError: (error) =>
      toast({ title: "Could not apply draft", description: messageForError(error), tone: "error" })
  });

  const error = generate.error ?? regenerate.error ?? approve.error;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="accent">
            <Sparkles aria-hidden="true" className="size-3" />
            Draft only
          </Badge>
          {latest ? (
            <span className="text-[11px] text-ink-muted">
              {latest.provider} · {latest.model} · {formatDateShort(latest.created_at.slice(0, 10))}
            </span>
          ) : null}
        </div>
        <SegmentedControl
          label="Review view"
          value={view}
          onChange={setView}
          options={[
            { value: "draft", label: "AI draft" },
            { value: "original", label: "Your words" },
            { value: "applied", label: "Applied" }
          ]}
        />
      </div>

      {error ? (
        <div role="alert" className="flex gap-2 rounded-sm border border-warning/40 bg-warning-soft px-3 py-2.5 text-xs leading-relaxed text-ink">
          <AlertTriangle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-warning" />
          <span>{messageForError(error)}</span>
        </div>
      ) : null}

      {view === "original" ? (
        <div className="max-h-64 overflow-auto rounded-sm border border-border bg-canvas p-3">
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink-soft">
            {originalText || "You have not written anything yet."}
          </p>
        </div>
      ) : view === "applied" ? (
        <div className="max-h-64 overflow-auto rounded-sm border border-border bg-canvas p-3">
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink-soft">
            {finalText || "Nothing has been applied to this entry yet."}
          </p>
        </div>
      ) : latest ? (
        <div className="space-y-3">
          <div className="rounded-sm border border-border bg-surface p-3">
            <p className="text-sm leading-relaxed text-ink">{latest.output_json.overview}</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {SECTIONS.map((section) => {
              const values = latest.output_json[section.key];
              if (!Array.isArray(values) || values.length === 0) return null;
              return (
                <div key={section.key} className="rounded-sm border border-border bg-canvas p-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                    {section.label}
                  </p>
                  <ul className="mt-1 space-y-1">
                    {values.map((value, index) => (
                      <li key={index} className="text-xs leading-relaxed text-ink-soft">
                        · {value}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <details className="rounded-sm border border-border bg-canvas">
            <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-ink-soft">
              Edit the draft before applying
            </summary>
            <div className="border-t border-border p-3">
              <textarea
                value={editedMarkdown || latest.output_markdown}
                onChange={(event) => setEditedMarkdown(event.target.value)}
                rows={10}
                className="w-full resize-y rounded-xs border border-border bg-surface px-2.5 py-2 font-mono text-xs leading-relaxed text-ink focus:border-accent focus:outline-none"
              />
            </div>
          </details>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
              placeholder="Optional: ask for a different angle"
              maxLength={500}
              className="h-10 flex-1 rounded-sm border border-border bg-surface px-3 text-sm text-ink placeholder:text-ink-muted focus:border-accent"
            />
            <Button
              variant="secondary"
              loading={regenerate.isPending}
              onClick={() => void regenerate.mutateAsync().catch(() => undefined)}
            >
              <RefreshCw aria-hidden="true" className="size-3.5" />
              Regenerate
            </Button>
            <Button
              loading={approve.isPending}
              onClick={() => void approve.mutateAsync().catch(() => undefined)}
            >
              <Check aria-hidden="true" className="size-4" />
              Approve &amp; apply
            </Button>
          </div>
          <p className="text-[11px] leading-relaxed text-ink-muted">
            Approving replaces the final text only. Your original words and every previous draft stay in
            the history.
          </p>
        </div>
      ) : (
        <div className="rounded-sm border border-dashed border-border bg-subtle/40 px-3 py-6 text-center">
          <p className="text-sm text-ink-soft">
            No draft yet. The assistant reads this entry and proposes a structured version — it never
            writes without your approval.
          </p>
          <Button
            className="mt-3"
            size="sm"
            loading={generate.isPending}
            disabled={!(finalText.trim() || originalText.trim())}
            onClick={() => void generate.mutateAsync().catch(() => undefined)}
          >
            <Sparkles aria-hidden="true" className="size-3.5" />
            Draft with AI
          </Button>
        </div>
      )}

      {generations.length > 1 ? (
        <details className="rounded-sm border border-border bg-canvas">
          <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-ink-soft">
            Earlier drafts ({generations.length - 1})
          </summary>
          <ul className="divide-y divide-border border-t border-border">
            {generations.slice(1).map((generation) => (
              <li key={generation.id} className="flex items-center justify-between gap-2 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-xs text-ink-soft">{generation.output_json.overview}</p>
                  <p className="text-[10px] text-ink-muted">
                    {formatDateShort(generation.created_at.slice(0, 10))} · {generation.prompt_version}
                    {generation.is_approved ? " · applied" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(generation.id);
                    setEditedMarkdown(generation.output_markdown);
                    setView("draft");
                  }}
                  className="shrink-0 text-xs font-medium text-accent hover:text-accent-hover"
                >
                  Review
                </button>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
