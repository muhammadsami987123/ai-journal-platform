"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-sm border bg-surface px-3.5 text-sm text-ink placeholder:text-ink-muted " +
  "transition-colors duration-150 disabled:bg-subtle disabled:text-ink-muted " +
  "aria-[invalid=true]:border-danger";

const tone = {
  default: "border-border hover:border-border-strong focus:border-accent",
  error: "border-danger"
} as const;

export interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  className?: string;
  children: (ids: { id: string; describedBy: string | undefined; invalid: boolean }) => React.ReactNode;
}

/** Label + description + error wiring that every input in the app reuses. */
export function Field({ label, htmlFor, hint, error, optional, className, children }: FieldProps) {
  const generated = useId();
  const id = htmlFor ?? generated;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        {optional ? <span className="text-xs text-ink-muted">Optional</span> : null}
      </div>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error ? (
        <p id={hintId} className="text-xs leading-relaxed text-ink-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ className, invalid, ...props }: InputProps) {
  return (
    <input
      className={cn(fieldBase, "h-11", invalid ? tone.error : tone.default, className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function Textarea({ className, invalid, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(fieldBase, "min-h-24 py-2.5 leading-relaxed", invalid ? tone.error : tone.default, className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export function Select({ className, invalid, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(fieldBase, "h-11 cursor-pointer pr-8", invalid ? tone.error : tone.default, className)}
      aria-invalid={invalid || undefined}
      {...props}
    >
      {children}
    </select>
  );
}
