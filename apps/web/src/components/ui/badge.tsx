import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger" | "outline";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-subtle text-ink-soft border-transparent",
  accent: "bg-accent-soft text-accent border-accent-border",
  success: "bg-success-soft text-success border-transparent",
  warning: "bg-warning-soft text-warning border-transparent",
  danger: "bg-danger-soft text-danger border-transparent",
  outline: "bg-transparent text-ink-soft border-border"
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
