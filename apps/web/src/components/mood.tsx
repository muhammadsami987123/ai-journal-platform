"use client";

import {
  CloudLightning,
  CloudRain,
  Flame,
  Frown,
  Leaf,
  Meh,
  Moon,
  Smile,
  Sparkles,
  Waves,
  type LucideIcon
} from "lucide-react";
import { MOODS, MOOD_BY_VALUE, type Mood } from "@journal/shared";
import { cn } from "@/lib/utils";

/** The shared constants name icons; the web app is the only place resolving them. */
const ICONS: Record<string, LucideIcon> = {
  Smile,
  Sparkles,
  Leaf,
  Flame,
  Meh,
  Moon,
  CloudLightning,
  CloudRain,
  Frown,
  Waves
};

export function MoodIcon({ mood, className }: { mood: Mood; className?: string }) {
  const Icon = ICONS[MOOD_BY_VALUE[mood]?.icon ?? "Meh"] ?? Meh;
  return <Icon aria-hidden="true" className={className} />;
}

export function MoodChip({ mood, note, className }: { mood: Mood; note?: string | null; className?: string }) {
  const definition = MOOD_BY_VALUE[mood];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-ink-soft",
        className
      )}
      title={note ?? definition?.description}
    >
      <MoodIcon mood={mood} className="size-3.5" />
      {definition?.label ?? mood}
    </span>
  );
}

export function MoodDot({ mood }: { mood: Mood }) {
  const definition = MOOD_BY_VALUE[mood];
  return (
    <span
      className="mood-dot"
      style={{ ["--mood-color" as string]: definition?.colorVar }}
      title={definition?.label ?? mood}
    />
  );
}

export function MoodPicker({
  value,
  note,
  onSelect,
  onNoteChange,
  onClear,
  saving = false,
  disabled = false
}: {
  value: Mood | null;
  note: string;
  onSelect: (mood: Mood) => void;
  onNoteChange: (note: string) => void;
  onClear?: () => void;
  saving?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div
        role="radiogroup"
        aria-label="How are you feeling today?"
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
      >
        {MOODS.map((mood) => {
          const selected = value === mood.value;
          return (
            <button
              key={mood.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled || saving}
              onClick={() => onSelect(mood.value)}
              className={cn(
                "group flex min-h-11 items-center gap-2 rounded-sm border px-3 py-2.5 text-left text-sm transition-colors duration-150",
                selected
                  ? "border-accent bg-accent-soft text-ink"
                  : "border-border bg-surface text-ink-soft hover:border-border-strong hover:bg-subtle",
                (disabled || saving) && "opacity-60"
              )}
            >
              <MoodIcon
                mood={mood.value}
                className={cn("size-4 shrink-0", selected ? "text-accent" : "text-ink-muted")}
              />
              <span className="truncate font-medium">{mood.label}</span>
            </button>
          );
        })}
      </div>

      {value ? (
        <div className="space-y-2">
          <label htmlFor="mood-note" className="text-xs font-medium text-ink-soft">
            A note about today (optional)
          </label>
          <input
            id="mood-note"
            value={note}
            maxLength={500}
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder="One line you'd like to remember"
            className="h-10 w-full rounded-sm border border-border bg-surface px-3 text-sm text-ink placeholder:text-ink-muted hover:border-border-strong focus:border-accent"
          />
          {onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="text-xs font-medium text-ink-muted underline decoration-border underline-offset-4 hover:text-ink"
            >
              Remove today&apos;s mood
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
