import Link from "next/link";
import { Compass, PenLine } from "lucide-react";
import { Brand } from "@/components/brand";
import { buttonStyles } from "@/components/ui/button-styles";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <div className="px-5 py-6 sm:px-10">
        <Brand />
      </div>

      <div className="flex flex-1 items-center justify-center px-5 pb-16">
        <div className="w-full max-w-lg">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">404</p>
          <h1 className="mt-2 font-serif text-3xl leading-tight tracking-tight text-ink">
            This page isn&apos;t in your journal.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            The link may be old, or the entry may have been deleted. Nothing was lost from the days
            you wrote.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/dashboard" className={buttonStyles("primary", "md")}>
              <Compass aria-hidden="true" className="size-4" />
              Go to dashboard
            </Link>
            <Link href="/journal/new" className={buttonStyles("secondary", "md")}>
              <PenLine aria-hidden="true" className="size-4" />
              Write today
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
