import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-md border border-dashed border-border bg-subtle/40 text-center",
        compact ? "gap-2 px-5 py-8" : "gap-3 px-6 py-14",
        className
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-full border border-border bg-surface text-ink-muted">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="max-w-sm text-sm leading-relaxed text-ink-soft">{description}</p>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = "That didn't load",
  message,
  requestId,
  onRetry
}: {
  title?: string;
  message: string;
  requestId?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-md border border-danger/30 bg-danger-soft px-5 py-6 text-sm text-ink"
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-1 leading-relaxed text-ink-soft">{message}</p>
      {requestId ? (
        <p className="mt-2 font-mono text-[11px] text-ink-muted">Request {requestId}</p>
      ) : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-sm border border-border bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:border-border-strong"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
