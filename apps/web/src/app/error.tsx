"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { buttonStyles } from "@/components/ui/button-styles";
import { Brand } from "@/components/brand";

export default function GlobalRouteError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <div className="px-5 py-6 sm:px-10">
        <Brand />
      </div>

      <div className="flex flex-1 items-center justify-center px-5 pb-16">
        <div className="w-full max-w-lg rounded-lg border border-border bg-surface p-6 shadow-raised sm:p-8">
          <span className="flex size-11 items-center justify-center rounded-full border border-warning/40 bg-warning-soft text-warning">
            <AlertTriangle aria-hidden="true" className="size-5" />
          </span>

          <h1 className="mt-4 font-serif text-2xl leading-tight text-ink">
            Something broke on this page.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Your entries are safe — this is a rendering error, not a data one. Try again, and if it
            keeps happening, reload the app.
          </p>

          {error.digest ? (
            <p className="mt-3 rounded-sm border border-border bg-canvas px-3 py-2 font-mono text-[11px] text-ink-muted">
              Reference {error.digest}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-2">
            <button type="button" onClick={reset} className={buttonStyles("primary", "md")}>
              <RotateCcw aria-hidden="true" className="size-4" />
              Try again
            </button>
            <Link href="/dashboard" className={buttonStyles("secondary", "md")}>
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
