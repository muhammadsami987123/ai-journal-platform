import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-sm font-medium transition-colors duration-150 " +
  "disabled:opacity-55 disabled:pointer-events-none select-none";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-ink-inverse hover:bg-accent-hover active:bg-accent-hover border border-transparent",
  secondary:
    "bg-surface text-ink border border-border hover:border-border-strong hover:bg-subtle active:bg-sunken",
  ghost: "bg-transparent text-ink-soft hover:bg-subtle hover:text-ink border border-transparent",
  danger:
    "bg-danger text-ink-inverse hover:opacity-90 active:opacity-95 border border-transparent"
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-6 text-base"
};

/**
 * Class factory shared by <Button>, links styled as buttons, and server-rendered
 * marketing pages. Kept in a directive-free module so the RSC boundary can call
 * it during render.
 */
export function buttonStyles(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string
): string {
  return cn(base, variants[variant], sizes[size], className);
}
