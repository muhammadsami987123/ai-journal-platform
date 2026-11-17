import Link from "next/link";
import { Feather } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({
  href = "/",
  compact = false,
  className
}: {
  href?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2.5 rounded-sm", className)}
      aria-label="AI Journal home"
    >
      <span className="flex size-9 items-center justify-center rounded-sm border border-accent-border bg-accent-soft text-accent">
        <Feather aria-hidden="true" className="size-4.5" />
      </span>
      {!compact ? (
        <span className="text-[15px] font-semibold tracking-tight text-ink">
          AI <span className="font-serif font-normal italic">Journal</span>
        </span>
      ) : null}
    </Link>
  );
}
