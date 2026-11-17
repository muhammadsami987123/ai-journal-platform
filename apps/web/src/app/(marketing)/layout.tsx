import Link from "next/link";
import { Brand } from "@/components/brand";
import { buttonStyles } from "@/components/ui/button-styles";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Brand href="/" />

          <nav aria-label="Sections" className="ml-6 hidden items-center gap-6 md:flex">
            <a href="#how-it-works" className="text-sm text-ink-soft hover:text-ink">
              How it works
            </a>
            <a href="#assistant" className="text-sm text-ink-soft hover:text-ink">
              The assistant
            </a>
            <a href="#privacy" className="text-sm text-ink-soft hover:text-ink">
              Privacy
            </a>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link href="/login" className="hidden px-3 py-2 text-sm font-medium text-ink-soft hover:text-ink sm:block">
              Sign in
            </Link>
            <Link href="/register" className={buttonStyles("primary", "sm")}>
              Start writing
            </Link>
          </div>
        </div>
      </header>

      <main id="main">{children}</main>

      <footer className="border-t border-border bg-subtle/50">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Brand href="/" />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">
              A private daily journal with guided questions, mood tracking, voice capture and an
              assistant that drafts — never rewrites — your day.
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
              The app
            </p>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              <li>
                <Link href="/register" className="hover:text-ink">
                  Create an account
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-ink">
                  Sign in
                </Link>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-ink">
                  How it works
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
              Your data
            </p>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              <li>
                <a href="#privacy" className="hover:text-ink">
                  Where your words live
                </a>
              </li>
              <li>
                <a href="#assistant" className="hover:text-ink">
                  What the assistant sees
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-5 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>© {new Date().getFullYear()} AI Journal. Written for one reader — you.</p>
            <p>No feed. No followers. No advertising.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
