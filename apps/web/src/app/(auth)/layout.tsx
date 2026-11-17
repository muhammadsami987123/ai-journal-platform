import { redirect } from "next/navigation";
import { BookOpenCheck, Feather, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/brand";
import { getMe } from "@/lib/api/server";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  if (me) redirect("/dashboard");

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.02fr_0.98fr]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <Brand />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
        <p className="text-xs leading-relaxed text-ink-muted">
          Your entries are private to your account. Export or delete them at any time from Settings.
        </p>
      </div>

      <aside className="relative hidden overflow-hidden border-l border-border bg-subtle lg:flex lg:flex-col lg:justify-between">
        <div className="surface-grid absolute inset-0 opacity-70" aria-hidden="true" />
        <div className="relative px-12 pt-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
            A quieter way to keep a journal
          </p>
          <blockquote className="mt-5 max-w-md font-serif text-[28px] leading-snug text-ink">
            “Write the day as it happened. Keep your own words, and let structure come
            afterwards.”
          </blockquote>

          <ul className="mt-10 space-y-5">
            {[
              {
                icon: Feather,
                title: "Write in your language",
                body: "English, Urdu, Hindi or Roman Urdu — direction and script follow your text."
              },
              {
                icon: BookOpenCheck,
                title: "Original words stay untouched",
                body: "AI drafts are separate records. Nothing reaches your entry until you approve it."
              },
              {
                icon: ShieldCheck,
                title: "Private by default",
                body: "Every query is scoped to your account. Export everything whenever you want."
              }
            ].map((item) => (
              <li key={item.title} className="flex gap-3.5">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-sm border border-border bg-surface text-accent">
                  <item.icon aria-hidden="true" className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{item.title}</p>
                  <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-soft">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative m-10 rounded-md border border-border bg-surface p-5 shadow-raised">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-muted">
            Today · sample layout
          </p>
          <p className="mt-2 font-serif text-lg leading-snug text-ink">
            A long walk after work cleared my head. I want to protect that hour tomorrow.
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-ink-muted">
            <span className="size-1.5 rounded-full bg-accent" />
            142 words · peaceful · draft saved
          </div>
        </div>
      </aside>
    </div>
  );
}
