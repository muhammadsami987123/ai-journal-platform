# Project: AI Journal | Intelligent Personal Diary Platform

> **Revision 2 — 2026-11-16:** technology stack migrated from a plain HTML/Tailwind frontend to a **NestJS + Next.js monorepo**. All product requirements are unchanged. Verified versions and constraints: [`TECH_STACK.md`](TECH_STACK.md). Migration record: [`../reports/implementation/stack-migration-report.md`](../reports/implementation/stack-migration-report.md).

## 1. Project Overview

Build a complete, production-ready AI-powered personal journaling and diary web application.

The primary purpose of this platform is to help users maintain a consistent daily journaling habit without the inconvenience of manually writing lengthy diary entries.

Users should be able to document their daily activities, thoughts, emotions, experiences, achievements, challenges, and personal reflections through either text or voice.

The platform must provide an elegant, premium, modern user experience with beautiful animations, interactive calendars, AI-powered writing assistance, and secure personal journal storage.

This must be a fully functional application, not just a frontend prototype.

## 2. Technology Stack

The platform is a **pnpm/Turborepo monorepo** with two independently deployable applications and shared packages.

| Concern | Technology | Version |
|---|---|---|
| Primary application framework | **NestJS** — all business logic, auth, data, AI, voice | 12.5.0 |
| Language | TypeScript (shared across both apps) | 6.0.3 |
| Server-rendered frontend | **Next.js** App Router + React | 16.4.6 / 19.3.1 |
| UI styling | Tailwind CSS | 4.3.5 |
| Routing | Next.js App Router (pages) · NestJS controllers (API) | — |
| Authentication | Better Auth, mounted inside NestJS | 1.7.25 (+ `@thallesp/nestjs-better-auth` 2.8.0) |
| Database | Neon PostgreSQL via Drizzle ORM | Drizzle 0.45.4, `@neondatabase/serverless` 1.2.1 |
| AI Integration | Configurable, provider-agnostic LLM API | env-selected |
| Voice Processing | Browser Speech Recognition primary, server STT fallback | — |
| Animations | Framer Motion | 14.14.0 |
| Icons | Lucide | `lucide-react` 1.73.0 |

**Why two applications:** NestJS is a backend framework — it provides no browser rendering or client routing. Next.js supplies SSR, streaming, routing and hydration, and consumes the NestJS API over one public origin via a `/api/*` proxy.

**Runtime requirements:** Node.js ≥ 20.9.0, single public origin in production, pinned runtime versions (see [`TECH_STACK.md`](TECH_STACK.md)).

Use environment variables for all API keys, database credentials, and authentication secrets.

Do not hardcode sensitive credentials.

## 3. Landing Page

Create a beautiful, premium landing page introducing the AI Journal platform.

The landing page should include:

- Premium hero section.
- Attractive 3D animations.
- Animated typography.
- A clear explanation of the platform.
- Features overview.
- How It Works section.
- Voice Journaling introduction.
- AI-powered journal demonstration.
- Beautiful visual previews of the calendar and journal dashboard.
- Login and Get Started buttons.
- Responsive footer.

The design should feel like a premium productivity and personal wellness product.

Avoid generic templates and excessive visual clutter.

## 4. Authentication System

Implement authentication using Better Auth.

Required functionality:

- User registration.
- Login.
- Logout.
- Secure password handling.
- Session management.
- Protected dashboard routes.
- Persistent authentication.
- User profile.

The authentication experience must use our own custom-designed UI.

Do not expose default authentication-provider popups or external-looking interfaces.

Every user's journal entries must remain private and accessible only to their authenticated account.

Never implement custom plaintext password storage.

## 5. Personal Journal Dashboard

After authentication, users should access their personal journal dashboard.

The dashboard should contain:

- Welcome message.
- Current date.
- Today's mood.
- Daily journal summary.
- Interactive calendar.
- Recent journal entries.
- Journal statistics.
- Writing streak.
- Quick Journal button.
- Voice Journal button.
- Search functionality.

Create a beautiful and intuitive dashboard with a clean layout.

## 6. Interactive Calendar

This is one of the most important features.

Create a complete interactive calendar.

Requirements:

- Monthly calendar view.
- Previous and next month navigation.
- Date selection.
- Today's date highlighting.
- Journal availability indicators.
- Mood indicators on dates.
- Ability to navigate to historical dates.
- Ability to create a new journal entry for any selected date.
- Display saved journal entries when selecting a date.

Each date should have its own journal records.

Users should be able to maintain multiple entries for a single day if necessary.

## 7. Daily Journal Writing System

When users select a date, provide a complete journal editor.

Include the following sections:

### A. My Daily Story

A large, comfortable writing editor where users can write everything about their day.

Allow users to:

- Write unlimited-length journal entries, subject to reasonable application limits.
- Use English, Urdu, Hindi, or any other language.
- Edit existing entries.
- Save drafts.
- Save completed entries.
- Continue writing later.

Preserve the original language and content.

### B. Guided Daily Questions

The application should ask users multiple questions to help them reflect on their day.

Examples:

1. How was your day?
2. What was the best thing that happened today?
3. What new thing did you learn?
4. Did you accomplish your goals?
5. Did you face any challenges?
6. What made you happy today?
7. Did anything disappoint you?
8. Did you work on something important?
9. Did you spend time with someone special?
10. What are you grateful for today?
11. What could you have done better?
12. What are your plans for tomorrow?

These questions should be organized into beautiful, interactive sections.

Users should be able to skip questions.

Allow users to add their own custom questions.

Save every answer with its corresponding journal entry and date.

### C. Mood Tracker

Allow users to record their emotional state.

Include options such as:

- Happy
- Excited
- Peaceful
- Motivated
- Normal
- Tired
- Stressed
- Sad
- Frustrated
- Anxious

Use attractive mood icons and an intuitive selection interface.

Allow optional mood notes.

Store mood history so users can understand their emotional patterns over time.

## 8. AI Voice Journaling

This is another major feature.

Users should not be forced to type everything.

Provide a dedicated microphone interface.

Expected workflow:

1. User selects a date.
2. User clicks the microphone button.
3. User starts speaking naturally.
4. The application converts speech into text.
5. The AI processes the transcribed content.
6. AI organizes the content into a structured diary format.
7. User reviews the generated journal.
8. User can edit or regenerate it.
9. User saves the final entry.

The user should be able to speak naturally in Urdu, English, Hindi, or other supported languages.

AI must preserve the original meaning, personal experiences, emotions, and important details.

Do not invent events or personal experiences.

Provide controls for:

- Start recording.
- Stop recording.
- Pause recording, if supported.
- Preview transcription.
- Edit transcription.
- Generate journal.
- Save journal.

Show a beautiful animated audio waveform while recording.

Handle microphone permissions and unsupported browser capabilities gracefully.

## 9. AI Journal Writing Assistant

Integrate an AI writing assistant.

The AI should transform unstructured thoughts and voice transcripts into a readable, organized journal.

For example:

Input:
"Today I worked on my project, learned something new, faced some problems, but finally completed my task."

Expected output:

- Daily Overview
- Activities
- Achievements
- Challenges
- Lessons Learned
- Personal Reflections
- Tomorrow's Goals

Important requirements:

- Preserve the original meaning.
- Support multilingual input.
- Do not fabricate information.
- Maintain the user's writing style where possible.
- Allow users to choose between original language and translation.
- Allow regeneration and editing.
- Never overwrite the original transcription automatically.

AI-generated content must always be reviewed and approved by the user before replacing or saving the final journal version.

## 10. Journal History

Create a dedicated journal history page.

Features:

- Browse entries by date.
- Calendar-based navigation.
- Search journal entries.
- Filter by mood.
- Filter by date range.
- View complete journal details.
- Edit existing entries.
- Delete entries with confirmation.
- View daily questions and answers.
- View AI-generated summaries.

All journal data must be retrieved from the authenticated user's account.

## 11. Personal Insights and Statistics

Create a personal insights section.

Display:

- Total journal entries.
- Current writing streak.
- Longest writing streak.
- Weekly journaling activity.
- Monthly journaling activity.
- Mood distribution.
- Most frequently recorded emotions.
- Daily completion statistics.

Use beautiful charts and visualizations.

Only calculate insights from the user's actual saved data.

Do not display fabricated statistics.

## 12. Notification and Daily Reminders

Provide optional daily journaling reminders.

Users should be able to:

- Enable or disable reminders.
- Select reminder time.
- Choose notification preferences.
- Configure their timezone.

Use appropriate browser notification permissions and a reliable notification mechanism where supported.

Never send notifications without user consent.

## 13. Database Architecture

Use Neon PostgreSQL as the primary database.

Design a normalized, scalable database schema.

Suggested entities:

- Users and Better Auth tables.
- User Profiles.
- Journal Entries.
- Journal Questions.
- Journal Answers.
- Mood Records.
- Voice Transcriptions.
- AI Generated Journal Content.
- User Preferences.
- Reminder Settings.

Every user-owned record must have proper ownership relationships.

Implement database constraints, indexes, timestamps, and appropriate cascading behavior.

Enforce user-level authorization on every database operation.

A user must never be able to access another user's private journal data by manipulating IDs or API requests.

## 14. UI/UX Design Requirements

The design quality is extremely important.

Build a premium, modern, visually impressive interface.

Design direction:

- Minimal and elegant.
- Premium light theme.
- Soft neutral backgrounds.
- Beautiful typography.
- Rounded cards.
- Subtle shadows.
- Smooth transitions.
- Interactive calendar.
- Elegant mood icons.
- Beautiful journal editor.
- Animated microphone interface.
- Premium loading states.
- Responsive navigation.

Use tasteful 3D elements and animations on the landing page without sacrificing performance.

The dashboard should prioritize readability and writing comfort.

Provide responsive layouts for desktop, tablet, and mobile.

Include accessible controls, keyboard navigation, and appropriate contrast.

## 15. Application Routing

Create clean and organized routes.

Suggested routes:

- `/` - Landing Page
- `/login` - Login
- `/register` - Registration
- `/dashboard` - Personal Dashboard
- `/journal` - Journal Overview
- `/journal/new` - Create Journal
- `/journal/[id]` - View Journal
- `/calendar` - Interactive Calendar
- `/voice-journal` - Voice Journaling
- `/insights` - Personal Insights
- `/settings` - User Preferences
- `/profile` - Personal Profile

Use proper navigation and protected routes.

Page routes are implemented by the **Next.js App Router** in `apps/web`; backend endpoints are implemented by **NestJS controllers** under `/api/v1` in `apps/api`. Route protection is enforced twice: middleware in the web app (UX) and an auth guard in the API (security).

All buttons and navigation elements must work correctly.

## 16. Security and Reliability

Implement:

- Secure authentication.
- Server-side authorization.
- User-specific data isolation.
- Input validation.
- API request validation.
- Secure environment configuration.
- Safe database queries.
- Proper error handling.
- Loading and empty states.
- Database transaction handling where appropriate.
- Protection against unauthorized access.

Do not expose private journal content through public endpoints.

Treat journal entries as highly private personal information.

## 17. Development and Testing

Build the application feature by feature.

Before considering the project complete, verify:

- Registration and login.
- Better Auth session handling.
- Neon database connection.
- Journal creation and editing.
- Calendar navigation.
- Mood tracking.
- Guided questions.
- Voice transcription.
- AI journal generation.
- Journal history.
- User-specific data isolation.
- Responsive layouts.
- Error handling.
- Production build.

Do not use fake functionality or buttons that do nothing.

Use realistic sample data only in development environments.

## 18. Final Objective

The final product should feel like a complete personal digital diary with an intelligent AI assistant.

A user should be able to open the application, select today's date, write their story, answer guided questions, record their mood, or simply speak into the microphone.

The AI should help organize their thoughts into a beautiful journal, and everything should be securely saved to their personal account in Neon PostgreSQL.

The application should make daily journaling simple, enjoyable, and sustainable.

**Most Important:** Focus on functionality, database reliability, user privacy, premium UI/UX, and a genuinely useful AI journaling experience.

Do not compromise the quality of the application by building only a visually attractive frontend. Deliver a fully working, production-ready platform.

My additional recommendations
There are four features I would strongly recommend adding to the roadmap:










1. Life Timeline

A visual timeline of your entire life, organized by dates, allowing you to revisit what happened months or years ago.













2. AI Personal Reflection

AI can analyze your historical journal entries and help you recognize recurring patterns, achievements, and lessons.













3. Memories and Attachments

Attach photos, documents, and other memories to specific dates.













4. Talk to Your Journal

Ask questions like "What did I accomplish last month?" or "When did I first start working on this project?" AI answers using your own saved journal history.



One architectural recommendation: Keep the original voice transcription, AI-generated version, and user-approved final entry as separate records or versions. This will prevent accidental loss of personal memories.

My recommendation is to build the complete core journaling experience first, then introduce historical AI insights and conversational journal search.