"use client";

import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  label,
  description,
  className
}: {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-6", className)}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{label}</p>
        {description ? (
          <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{description}</p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative mt-0.5 h-6 w-10 shrink-0 rounded-full border transition-colors duration-150",
          checked ? "border-accent bg-accent" : "border-border-strong bg-sunken",
          disabled && "opacity-50"
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-0.5 size-4.5 rounded-full bg-surface shadow-raised transition-[left] duration-150",
            checked ? "left-[18px]" : "left-0.5"
          )}
        />
      </button>
    </div>
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  label,
  className
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (next: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("inline-flex rounded-sm border border-border bg-subtle p-0.5", className)}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-xs px-3 py-1.5 text-xs font-medium transition-colors",
            value === option.value
              ? "bg-surface text-ink shadow-raised"
              : "text-ink-muted hover:text-ink"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
