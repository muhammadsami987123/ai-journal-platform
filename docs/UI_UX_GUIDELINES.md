# UI/UX Guidelines

> **Status:** Design phase — the system below is the target. No tokens or components are implemented yet.
> **Design intent:** a premium light-theme personal wellness product. Calm, quiet, spacious. The journal editor must feel better than a notes app; the landing page may be expressive, the app must be calm.

---

## 1. Design Principles

1. **Writing comfort outranks decoration.** Inside the app, typography and whitespace beat ornament. Motion is present but never competes with text.
2. **Quiet premium.** Soft neutral surfaces, one accent, restrained shadows. No gradients fighting for attention, no card-in-card nesting.
3. **One obvious next action per screen.** Dashboard → write. Calendar day → new or open. Voice → speak.
4. **Honest states.** Loading, empty, error and permission-denied states are designed, not left to fallback text.
5. **Motion with purpose.** Animation explains a transition (entry opening, mood selection, recording state). Never loops for ambience inside the editor.
6. **Accessible by default.** Keyboard, contrast, focus and reduced-motion are acceptance criteria, not polish.

---

## 2. Color System

Light theme only in v1. Tokens (names fixed; values finalized during implementation).

| Token | Role |
|---|---|
| `bg-canvas` | Page background — warm off-white |
| `bg-surface` | Cards, panels |
| `bg-subtle` | Secondary fills, hover states |
| `border-muted` | Hairline separators |
| `text-primary` | Body and headings |
| `text-secondary` | Supporting copy |
| `text-muted` | Timestamps, counters |
| `accent` | Primary action, active state |
| `accent-soft` | Accent backgrounds (chips, selected day) |
| `success` / `warning` / `danger` | Semantic only |

**Rules**
- Body text contrast ≥ 4.5:1; large text ≥ 3:1.
- Accent is used for action and state — never for large fills behind body copy.
- Mood colors are a separate semantic palette (see §5) and are never reused as UI accents.
- Dark theme is explicitly out of v1 scope; tokens must not hardcode light values inside components so it stays possible.

---

## 3. Typography

| Role | Characteristics |
|---|---|
| Display | Landing hero only — large, tight tracking, high weight |
| H1–H3 | Section and page titles |
| Body | 16–18 px, line-height 1.6–1.75, max measure ~65ch |
| Editor | Larger than body with generous line-height; the most comfortable text on the site |
| Caption / meta | 13–14 px, muted |
| Numeric | Tabular figures for stats and timers |

**Multilingual requirement**
- A font stack must cover Latin, **Arabic script (Urdu)** and **Devanagari (Hindi)** before the editor ships.
- Set `dir="auto"` on all user-generated text; never assume LTR.
- Mixed-direction text must not break layout, counters or brackets.
- Guidance for script-specific line-height is to be recorded here once the stack is chosen (see Open Item O1).

---

## 4. Spacing, Radius, Elevation

- **Spacing scale:** 4 px base — 4, 8, 12, 16, 24, 32, 48, 64.
- **Radius:** small `8px` (inputs, chips), medium `16px` (cards), large `24px` (modals, hero panels).
- **Elevation:** three levels only — flat, raised (1 shadow), overlay (2 shadows + border). No decorative glows inside the app.
- **Grid:** 12-column desktop, max content width ~1200 px; single column mobile with 16 px gutters.

---

## 5. Mood System

Ten fixed moods, each with a distinct icon, color and label:

| Mood | Tone | Mood | Tone |
|---|---|---|---|
| Happy | warm sun | Tired | muted sand |
| Excited | bright coral | Stressed | dusty rose |
| Peaceful | soft teal | Sad | cool blue-grey |
| Motivated | fresh green | Frustrated | burnt amber |
| Normal | neutral grey | Anxious | pale violet |

**Presentation rules**
- Selection is a single choice with an immediate visual confirmation (no submit button).
- Icons are Lucide-based and must be distinguishable by **shape**, not color alone — color is supplementary (accessibility).
- Optional note field appears only after a mood is chosen.
- On the calendar, mood appears as a small dot; more than three entries collapse into a `+N` marker rather than shrinking dots below 6 px.

---

## 6. Layouts

### Marketing shell (`/`)
Full-bleed sections, expressive but readable: hero (3D element + animated heading), features grid, how-it-works stepper, voice section with waveform, AI before/after panel, calendar + dashboard previews, footer.

### App shell (authenticated)
- **Desktop:** persistent left sidebar (Dashboard, Calendar, Journal, Voice, Insights, Settings), content column, optional right rail on the dashboard.
- **Tablet:** collapsible sidebar (icons + labels).
- **Mobile:** top bar with page title + bottom navigation (max 5 destinations); secondary actions live in an overflow sheet.

### Editor layout
Distraction-reduced: title row, story editor, then collapsible sections for questions and mood. A sticky save-state indicator (Saving → Saved) is always visible without stealing focus.

---

## 7. Components

### Required set (design-system level)
`Button` (primary / secondary / ghost / danger, 3 sizes) · `Input` · `Textarea` · `Select` · `Checkbox` · `Radio` · `Switch` · `Card` · `Dialog` · `Sheet` · `Tabs` · `Badge` · `Chip` · `Tooltip` · `Toast` · `Skeleton` · `EmptyState` · `Avatar` · `Progress` · `Calendar` · `MoodPicker` · `QuestionCard` · `Waveform`

**Every component must define:** default, hover, focus-visible, active, disabled, loading (where applicable) and error states.

### Cards
Border-first, shadow-second. One elevation per surface. Cards never contain cards.

### Motion
- Enter transitions ≤ 250 ms; exits ≤ 180 ms.
- Easing is consistent across the product (one ease-out and one ease-in-out curve).
- Recording state gets the only continuous animation in the app (waveform).
- `prefers-reduced-motion` removes transforms and continuous motion, keeping opacity changes.
- The animation library is **Framer Motion 14.14.0** (verified in [`TECH_STACK.md`](TECH_STACK.md)). Variants must live in `apps/web/src/animations/` and be imported — never written ad hoc inside components.

---

## 8. Screen-by-Screen Requirements

| Screen | Must communicate | Must not |
|---|---|---|
| Landing | What it is, how it works, that it is private, and one clear CTA | Overwhelm with effects; block LCP on 3D |
| Auth | Plain, calm, trustworthy; custom UI only | Look like a third-party provider popup |
| Dashboard | "You wrote today / you haven't yet" in one glance | Show empty charts with fake data |
| Calendar | Where entries and moods live; today is obvious | Cram indicators below readable size |
| Editor | Writing is the primary act | Interrupt with modals or auto-save spinners |
| Voice | Recording is active and audible-by-sight | Fail silently on permission denial |
| AI review | What is original vs. generated vs. applied | Auto-apply anything |
| History | Fast scanning and filtering | Hide the delete confirmation |
| Insights | Real numbers with honest empty states | Imply trends from too little data |
| Settings | Consent is explicit and reversible | Enable notifications without action |

---

## 9. States

Every async surface implements all five:

1. **Loading** — skeletons matching final layout, not spinners in empty space.
2. **Empty** — explains the feature and offers the first action.
3. **Error** — readable message + retry; request ID available for support.
4. **Partial** — some data loaded (e.g., entries but no moods) without breaking layout.
5. **Permission-denied** — microphone or notifications: what happened and how to fix it.

---

## 10. Accessibility Checklist

- [ ] Full keyboard path: register → write → answer → select mood → save → log out.
- [ ] Visible `focus-visible` ring on every interactive element.
- [ ] All inputs have programmatic labels; errors are linked via `aria-describedby`.
- [ ] Modals trap focus and restore it on close.
- [ ] Calendar is operable with arrow keys; selection announced.
- [ ] Recording state changes announced to screen readers.
- [ ] Charts expose an accessible text/table alternative.
- [ ] Reduced-motion respected globally.
- [ ] Mood distinguishable without color.
- [ ] Body contrast ≥ 4.5:1.

---

## 11. Responsive Breakpoints

| Name | Width | Behavior |
|---|---|---|
| Mobile | 360–639 | Single column, bottom nav, full-screen sheets |
| Tablet | 640–1023 | Two-column where useful, collapsible sidebar |
| Laptop | 1024–1439 | Full sidebar, content + rail |
| Desktop | ≥ 1440 | Centered max-width, generous whitespace |

No horizontal scrolling at any width. Tap targets ≥ 44 px.

---

## 12. Content & Tone

- Second person, plain language, no gamification clichés ("crush your goals").
- Never shame the user for a missed day — streaks are informative, not punitive.
- AI is described as assistance: "draft", "suggestion", "review" — never "your entry" before approval.
- Privacy is stated plainly where it matters (landing, settings, export).

---

## 13. Open Items

| ID | Item | Blocks |
|---|---|---|
| O1 | Font stack covering Latin + Urdu + Devanagari; loading strategy | Editor (Phase 7) |
| O2 | Animation library selection (motion budget defined; library unnamed) | Landing (Phase 3) |
| O3 | Chart approach (custom SVG vs. library) for insights | Insights (Phase 11) |
| O4 | 3D technique and performance fallback for the hero | Landing (Phase 3) |
