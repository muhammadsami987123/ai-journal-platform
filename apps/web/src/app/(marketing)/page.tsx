import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Download,
  Feather,
  Languages,
  Lock,
  Mic,
  PenLine,
  ShieldCheck,
  Sparkles,
  Trash2
} from "lucide-react";
import { buttonStyles } from "@/components/ui/button-styles";
import { Reveal } from "@/features/marketing/reveal";

export const metadata: Metadata = {
  title: "AI Journal — write a little, understand a lot",
  description:
    "A private daily journal with guided questions, mood tracking, voice capture and an assistant that drafts — never rewrites — your day.",
  alternates: { canonical: "/" }
};

const MOODS = [
  { label: "Peaceful", color: "var(--color-mood-peaceful)" },
  { label: "Motivated", color: "var(--color-mood-motivated)" },
  { label: "Tired", color: "var(--color-mood-tired)" }
];

const WAVE_HEIGHTS = [22, 40, 64, 38, 78, 52, 30, 58, 86, 46, 34, 70, 54, 28, 62, 90, 44, 32, 66, 48, 36, 74, 56, 26, 60, 82, 42, 30, 68, 50, 34, 72];

export default function LandingPage() {
  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="surface-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-accent-border bg-accent-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
              <Feather aria-hidden="true" className="size-3" />
              A quieter way to keep a journal
            </p>

            <h1 className="mt-5 font-serif text-[38px] leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[56px]">
              Write a little.
              <br />
              Understand a lot.
            </h1>

            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink-soft sm:text-base">
              One private page a day, in the language you actually think in. Guided questions if you
              want them, a mood if you feel like naming one, and a voice note when typing is too much.
            </p>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
              The assistant can turn your day into a structured draft. It only ever proposes —
              your original words are kept exactly as written, and nothing changes until you approve
              it.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/register" className={buttonStyles("primary", "lg", "w-full sm:w-auto")}>
                Start today&apos;s entry
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <a href="#assistant" className={buttonStyles("secondary", "lg", "w-full sm:w-auto")}>
                See how the assistant works
              </a>
            </div>

            <ul className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-muted">
              {["Free to start", "No feed or followers", "Export everything, any time"].map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <Check aria-hidden="true" className="size-3.5 text-success" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* CSS-only 3D composition — no images, no layout shift, nothing to download. */}
          <div className="hero-3d relative mx-auto w-full max-w-md">
            <div className="relative mx-auto [transform:rotateX(9deg)_rotateY(-11deg)] motion-reduce:[transform:none]">
              <div
                aria-hidden="true"
                className="absolute -inset-x-4 top-6 h-full rounded-lg border border-border bg-subtle/80 [transform:translateZ(-40px)_rotate(-2deg)]"
              />
              <div
                aria-hidden="true"
                className="absolute -inset-x-2 top-3 h-full rounded-lg border border-border bg-surface/70 [transform:translateZ(-20px)_rotate(-1deg)]"
              />

              <div className="relative rounded-lg border border-border bg-surface p-6 shadow-overlay">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                      17 November · Monday
                    </p>
                    <p className="mt-1 font-serif text-lg leading-snug text-ink">
                      A long walk after work
                    </p>
                  </div>
                  <span className="rounded-full border border-border bg-canvas px-2 py-0.5 text-[10px] font-medium text-ink-soft">
                    Draft
                  </span>
                </div>

                <div className="mt-4 space-y-2 border-t border-border pt-4">
                  <span className="block h-2 w-full rounded-full bg-sunken" />
                  <span className="block h-2 w-[92%] rounded-full bg-sunken" />
                  <span className="block h-2 w-[97%] rounded-full bg-sunken" />
                  <span className="block h-2 w-[64%] rounded-full bg-sunken" />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  {MOODS.map((mood) => (
                    <span
                      key={mood.label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-canvas px-2 py-0.5 text-[10px] font-medium text-ink-soft"
                    >
                      <span
                        aria-hidden="true"
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: mood.color }}
                      />
                      {mood.label}
                    </span>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-border pt-3 text-[10px] text-ink-muted">
                  <span>142 words · autosaved</span>
                  <span className="inline-flex items-center gap-1 text-accent">
                    <Sparkles aria-hidden="true" className="size-3" />
                    Draft ready to review
                  </span>
                </div>
              </div>

              <div className="absolute -left-5 -bottom-6 hidden rounded-md border border-border bg-surface px-3 py-2 shadow-raised sm:block [transform:translateZ(30px)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                  Original words
                </p>
                <p className="mt-0.5 max-w-[150px] font-serif text-xs leading-snug text-ink">
                  “The walk cleared my head. I want to protect that hour.”
                </p>
              </div>
            </div>

            <p className="mt-10 text-center text-[11px] text-ink-muted">An illustration of the editor.</p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ promises */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-12 sm:px-6 md:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "Your words stay yours",
              body: "Every entry keeps an immutable original alongside the final text. The assistant proposes a separate draft; you decide what lands."
            },
            {
              icon: Languages,
              title: "Written in your language",
              body: "English, Urdu, Hindi and Roman Urdu. Direction and script follow what you type, including right-to-left Urdu."
            },
            {
              icon: Lock,
              title: "Private by default",
              body: "No feed, no sharing, no discovery. Every read and write is scoped to your own account, and you can export or delete all of it."
            }
          ].map((item, index) => (
            <Reveal key={item.title} delay={index * 0.05}>
              <div className="flex h-full gap-3.5">
                <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-sm border border-accent-border bg-accent-soft text-accent">
                  <item.icon aria-hidden="true" className="size-4.5" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-ink">{item.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">{item.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------- how it works */}
      <section id="how-it-works" className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
              How it works
            </p>
            <h2 className="mt-2 font-serif text-3xl leading-tight tracking-tight text-ink sm:text-4xl">
              Four small steps, once a day.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft sm:text-base">
              There is no streak to protect with guilt and no score to optimise. The app helps you
              write, then gets out of the way.
            </p>
          </div>

          <ol className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: "Write the day as it happened",
                body: "A blank page with your language and date already set. Autosave keeps a draft while you think."
              },
              {
                title: "Add a mood and a question",
                body: "Pick one of ten moods and answer as many guided questions as you like — skipping is allowed and remembered."
              },
              {
                title: "Speak instead, if you prefer",
                body: "Record in your browser, correct the transcript, then save it as an entry. The recording never leaves your device."
              },
              {
                title: "Ask for a structured draft",
                body: "The assistant proposes activities, wins, challenges and tomorrow's goals. Approve it, edit it, or ignore it."
              }
            ].map((step, index) => (
              <Reveal key={step.title} delay={index * 0.05}>
                <li className="flex h-full flex-col rounded-md border border-border bg-surface p-5 shadow-raised">
                  <span className="flex size-7 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
                    {index + 1}
                  </span>
                  <h3 className="mt-3 text-sm font-semibold leading-snug text-ink">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{step.body}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* -------------------------------------------------------------- voice */}
      <section className="border-b border-border bg-subtle/50">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
              <Mic aria-hidden="true" className="size-3.5 text-accent" />
              Voice journal
            </p>
            <h2 className="mt-2 font-serif text-3xl leading-tight tracking-tight text-ink sm:text-4xl">
              Some days are easier to say than to type.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-soft sm:text-base">
              The waveform moves with your actual voice, not a looping animation. Your browser
              produces the transcript, you fix the names and numbers, and only the corrected text is
              stored.
            </p>
            <ul className="mt-5 space-y-2.5 text-sm text-ink-soft">
              {[
                "Works in English, Urdu and Hindi",
                "Permission is requested only when you press record",
                "A denied microphone never blocks typing"
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-success" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <Reveal>
            <div className="rounded-lg border border-border bg-surface p-5 shadow-raised">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-danger/30 bg-danger-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-danger">
                  <span className="size-1.5 animate-pulse rounded-full bg-danger motion-reduce:animate-none" />
                  Recording
                </span>
                <span className="font-mono text-sm text-ink">00:42</span>
              </div>

              <div className="mt-4 flex h-24 items-center justify-center gap-1 rounded-md border border-border bg-canvas px-3">
                {WAVE_HEIGHTS.map((height, index) => (
                  <span
                    key={index}
                    aria-hidden="true"
                    className="wave-bar w-1 rounded-full bg-accent/70"
                    style={{
                      height: `${height}%`,
                      animationDelay: `${(index % 8) * 0.12}s`
                    }}
                  />
                ))}
              </div>
              <p className="sr-only">An illustration of a live recording waveform.</p>

              <div className="mt-4 rounded-sm border border-border bg-canvas p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                  Transcript · review before saving
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink">
                  Today was slow in the morning, but the walk after work helped. I want to keep that
                  hour free tomorrow.
                </p>
                <p className="urdu mt-2 text-right text-[13px] text-ink-soft" dir="rtl" lang="ur">
                  آج صبح سست تھی، مگر شام کی سیر نے دماغ ہلکا کر دیا۔
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------- assistant */}
      <section id="assistant" className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
              <Sparkles aria-hidden="true" className="size-3.5 text-accent" />
              The assistant
            </p>
            <h2 className="mt-2 font-serif text-3xl leading-tight tracking-tight text-ink sm:text-4xl">
              A draft you approve — never a rewrite you discover.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft sm:text-base">
              Approving a draft replaces only the final text. The original stays untouched, every
              earlier draft stays in history, and regenerating is always available.
            </p>
          </div>

          <div className="mt-9 grid gap-5 lg:grid-cols-2">
            <Reveal>
              <article className="flex h-full flex-col rounded-md border border-border bg-canvas p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                    Your original words
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium text-ink-soft">
                    <Lock aria-hidden="true" className="size-2.5" />
                    Never rewritten
                  </span>
                </div>
                <p className="mt-3 font-serif text-[15px] leading-relaxed text-ink">
                  Woke up late, skipped the gym, felt guilty about it most of the morning. The
                  product review went better than I expected — they liked the calendar idea. Walked
                  home instead of taking the bus and that fixed my mood.
                </p>
              </article>
            </Reveal>

            <Reveal delay={0.06}>
              <article className="flex h-full flex-col rounded-md border border-accent-border bg-surface p-5 shadow-raised">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
                    Structured draft
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full border border-accent-border bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent">
                    <Sparkles aria-hidden="true" className="size-2.5" />
                    Needs approval
                  </span>
                </div>

                <dl className="mt-3 space-y-2.5">
                  {[
                    { label: "Activities", value: "Product review · walked home" },
                    { label: "Achievements", value: "Calendar idea landed well" },
                    { label: "Challenges", value: "Late start and morning guilt" },
                    { label: "Tomorrow", value: "Protect the evening walk" }
                  ].map((row) => (
                    <div key={row.label} className="rounded-sm border border-border bg-canvas px-3 py-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                        {row.label}
                      </dt>
                      <dd className="mt-0.5 text-[13px] leading-snug text-ink">{row.value}</dd>
                    </div>
                  ))}
                </dl>

                <p className="mt-3 text-[11px] leading-relaxed text-ink-muted">
                  Nothing here is written to your entry until you press Approve.
                </p>
              </article>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ preview */}
      <section className="border-b border-border bg-subtle/50">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:py-20">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
              <CalendarDays aria-hidden="true" className="size-3.5 text-accent" />
              Calendar &amp; insights
            </p>
            <h2 className="mt-2 font-serif text-3xl leading-tight tracking-tight text-ink sm:text-4xl">
              See the month, not just the day.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-soft sm:text-base">
              Every day you wrote is marked with the mood you chose. Streaks and word counts come
              from your own entries — and when there is nothing to show, the app says so instead of
              drawing a fake chart.
            </p>
            <ul className="mt-5 space-y-2.5 text-sm text-ink-soft">
              {[
                "Mood dots and draft/complete markers on the calendar",
                "A 12-month consistency view you can read as a list",
                "Activity and mood breakdowns with a table alternative"
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-success" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <Reveal>
            <div className="rounded-lg border border-border bg-surface p-5 shadow-raised">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">November</p>
                <span className="text-[10px] uppercase tracking-wide text-ink-muted">Illustration</span>
              </div>
              <div className="mt-4 grid grid-cols-7 gap-1 text-center">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                  <span key={`${day}-${index}`} className="pb-1 text-[9px] font-semibold uppercase text-ink-muted">
                    {day}
                  </span>
                ))}
                {Array.from({ length: 35 }).map((_, index) => {
                  const day = index - 2;
                  const inMonth = day >= 1 && day <= 30;
                  const mood =
                    inMonth && [3, 5, 8, 9, 12, 15, 16, 17, 19, 22, 24].includes(day)
                      ? MOODS[day % MOODS.length]
                      : null;
                  const isToday = day === 17;
                  return (
                    <div
                      key={index}
                      className={`flex h-9 flex-col items-center justify-center rounded-sm border text-[11px] ${
                        isToday
                          ? "border-accent bg-accent-soft font-semibold text-ink"
                          : "border-transparent text-ink-soft"
                      }`}
                    >
                      {inMonth ? day : ""}
                      <span
                        aria-hidden="true"
                        className="mt-0.5 size-1 rounded-full"
                        style={{ backgroundColor: mood ? mood.color : "transparent" }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[10px] text-ink-muted">
                <span>11 days written</span>
                <span>Current streak 4 days</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------ privacy */}
      <section id="privacy" className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                <ShieldCheck aria-hidden="true" className="size-3.5 text-accent" />
                Privacy, stated plainly
              </p>
              <h2 className="mt-2 font-serif text-3xl leading-tight tracking-tight text-ink sm:text-4xl">
                A journal with one reader.
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-soft sm:text-base">
                This is not a social product. There is nothing to publish, nobody to follow and no
                recommendation engine looking at your entries.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link href="/register" className={buttonStyles("primary", "md")}>
                  Create your journal
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
                <Link href="/login" className={buttonStyles("secondary", "md")}>
                  Sign in
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  icon: Lock,
                  title: "Scoped at the server",
                  body: "Every query is filtered by your user id before it runs. Another account cannot read an entry even with its id."
                },
                {
                  icon: Sparkles,
                  title: "Only what you submit",
                  body: "A draft request sends just the text you chose to send, and the result stays a draft until you approve it."
                },
                {
                  icon: Download,
                  title: "Export whenever",
                  body: "One JSON file with entries, answers, moods, transcripts, drafts and settings. No support ticket required."
                },
                {
                  icon: Trash2,
                  title: "Delete for real",
                  body: "Deleting your account removes its entries and records. Individual entries move to a restorable deleted state first."
                }
              ].map((item) => (
                <div key={item.title} className="rounded-md border border-border bg-surface p-4">
                  <span className="flex size-8 items-center justify-center rounded-sm bg-canvas text-accent">
                    <item.icon aria-hidden="true" className="size-4" />
                  </span>
                  <h3 className="mt-2.5 text-sm font-semibold text-ink">{item.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- FAQ */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6">
          <h2 className="font-serif text-2xl leading-tight tracking-tight text-ink sm:text-3xl">
            Questions worth asking
          </h2>
          <div className="mt-6 divide-y divide-border border-y border-border">
            {[
              {
                q: "Does the assistant rewrite my entry?",
                a: "No. Your original text is stored separately and never modified. Approving a draft writes a structured version to the final text field, and the previous drafts remain in history."
              },
              {
                q: "What languages can I write in?",
                a: "English, Urdu, Hindi and Roman Urdu. Urdu and Arabic-script text render right-to-left with a Nastaliq typeface; Hindi uses Devanagari."
              },
              {
                q: "Do I need a microphone to use the voice journal?",
                a: "No. Typing is always available. If your browser supports live speech recognition, you can record and correct the transcript; if it doesn't, the app tells you and offers an audio-file fallback when the server is configured."
              },
              {
                q: "Where do reminders come from?",
                a: "A single daily nudge delivered while a journal tab is open, at a time you choose. Permission is requested only when you turn reminders on, and you can switch them off immediately."
              }
            ].map((item) => (
              <details key={item.q} className="group py-4">
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-medium text-ink">
                  {item.q}
                  <span className="text-ink-muted transition-transform duration-150 group-open:rotate-45 motion-reduce:transition-none">
                    +
                  </span>
                </summary>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- CTA */}
      <section className="bg-canvas">
        <div className="mx-auto w-full max-w-4xl px-4 py-16 text-center sm:px-6">
          <Feather aria-hidden="true" className="mx-auto size-6 text-accent" />
          <h2 className="mt-4 font-serif text-3xl leading-tight tracking-tight text-ink sm:text-4xl">
            Tomorrow&apos;s page is still blank.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink-soft sm:text-base">
            Start with three honest lines tonight. You can add a mood, a question or a draft when
            you feel like it.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register" className={buttonStyles("primary", "lg", "w-full sm:w-auto")}>
              <PenLine aria-hidden="true" className="size-4" />
              Create your journal
            </Link>
            <Link href="/login" className={buttonStyles("ghost", "lg", "w-full sm:w-auto")}>
              I already have an account
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
