"use client";

import { useMemo, useRef } from "react";
import type { CalendarDay } from "@journal/shared";
import { MOOD_BY_VALUE } from "@journal/shared";
import { monthGrid, monthOf, cn, formatDate, parseBusinessDate } from "@/lib/utils";
import { MoodDot } from "@/components/mood";

const WEEKDAYS_SUN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_MON = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function MonthGrid({
  year,
  month,
  days,
  today,
  selected,
  onSelect,
  weekStartsOn = 0,
  compact = false,
  showMoodDots = true
}: {
  year: number;
  month: number;
  days: CalendarDay[];
  today: string;
  selected?: string | null;
  onSelect: (date: string) => void;
  weekStartsOn?: 0 | 1;
  compact?: boolean;
  showMoodDots?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const grid = useMemo(() => monthGrid(year, month, weekStartsOn), [year, month, weekStartsOn]);
  const byDate = useMemo(() => new Map(days.map((day) => [day.date, day])), [days]);
  const weekdays = weekStartsOn === 1 ? WEEKDAYS_MON : WEEKDAYS_SUN;

  function focusDate(date: string) {
    const node = containerRef.current?.querySelector<HTMLButtonElement>(`[data-date="${date}"]`);
    node?.focus();
  }

  function moveFrom(date: string, deltaDays: number) {
    const index = grid.indexOf(date);
    if (index === -1) return;
    const next = grid[Math.min(Math.max(index + deltaDays, 0), grid.length - 1)];
    if (next) focusDate(next);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-date]");
    if (!target) return;
    const date = target.dataset.date ?? "";
    const offsets: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7
    };
    if (event.key in offsets) {
      event.preventDefault();
      const delta = offsets[event.key];
      if (delta !== undefined) moveFrom(date, delta);
    } else if (event.key === "Home") {
      event.preventDefault();
      moveFrom(date, -grid.indexOf(date));
    } else if (event.key === "End") {
      event.preventDefault();
      moveFrom(date, grid.length - 1 - grid.indexOf(date));
    }
  }

  return (
    <div
      ref={containerRef}
      role="grid"
      aria-label={`Calendar for ${new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric"
      }).format(new Date(year, month - 1, 1))}`}
      onKeyDown={handleKeyDown}
      className="w-full"
    >
      <div role="row" className="grid grid-cols-7 gap-1">
        {weekdays.map((label) => (
          <div
            key={label}
            role="columnheader"
            className={cn(
              "pb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-ink-muted",
              compact && "pb-0.5 text-[9px]"
            )}
          >
            {compact ? label.slice(0, 1) : label}
          </div>
        ))}
      </div>

      <div role="rowgroup" className="grid grid-cols-7 gap-1">
        {grid.map((date) => {
          const day = byDate.get(date);
          const inMonth = monthOf(date).month === month;
          const isToday = date === today;
          const isSelected = selected === date;
          const moods = day?.moods ?? [];
          const extraMoods = moods.length > 3 ? moods.length - 3 : 0;

          return (
            <button
              key={date}
              type="button"
              role="gridcell"
              data-date={date}
              aria-selected={isSelected}
              aria-current={isToday ? "date" : undefined}
              aria-label={`${formatDate(date, { weekday: "long", month: "long", day: "numeric" })}${
                day?.entryCount ? `, ${day.entryCount} entr${day.entryCount === 1 ? "y" : "ies"}` : ", no entries"
              }${moods.length ? `, mood ${moods.map((m) => MOOD_BY_VALUE[m]?.label ?? m).join(", ")}` : ""}`}
              tabIndex={isToday || (!selected && date === grid[0]) ? 0 : -1}
              onClick={() => onSelect(date)}
              className={cn(
                "group relative flex flex-col items-center justify-center rounded-sm border text-center transition-colors",
                compact ? "min-h-8 py-1" : "min-h-11 py-1.5 sm:min-h-16",
                inMonth ? "border-transparent" : "border-transparent text-ink-muted/45",
                isSelected
                  ? "border-accent bg-accent-soft text-ink"
                  : "hover:border-border hover:bg-subtle",
                isToday && !isSelected && "border-border-strong bg-surface"
              )}
            >
              <span
                className={cn(
                  "leading-none",
                  compact ? "text-xs" : "text-xs sm:text-sm",
                  isToday && "font-semibold text-accent"
                )}
              >
                {parseBusinessDate(date).getDate()}
              </span>

              {!compact ? (
                <span className="mt-1 flex h-2 items-center justify-center gap-0.5">
                  {day?.entryCount ? (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-1.5 rounded-full",
                        day.hasDraft && !day.hasComplete ? "bg-warning" : "bg-accent"
                      )}
                    />
                  ) : null}
                  {showMoodDots
                    ? moods.slice(0, 3).map((mood) => <MoodDot key={mood} mood={mood} />)
                    : null}
                  {extraMoods > 0 ? (
                    <span className="text-[9px] leading-none text-ink-muted">+{extraMoods}</span>
                  ) : null}
                </span>
              ) : day?.entryCount ? (
                <span
                  aria-hidden="true"
                  className="mt-0.5 size-1 rounded-full bg-accent"
                />
              ) : (
                <span className="mt-0.5 size-1 rounded-full bg-transparent" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
