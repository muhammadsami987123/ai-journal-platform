"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  LayoutDashboard,
  LineChart,
  LogOut,
  Mic,
  Settings,
  UserRound
} from "lucide-react";
import { useState } from "react";
import { Brand } from "@/components/brand";
import { ReminderWatcher } from "@/features/reminders/reminder-watcher";
import { cn, initialsOf } from "@/lib/utils";
import type { SessionUser } from "@journal/shared";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/voice-journal", label: "Voice", icon: Mic },
  { href: "/insights", label: "Insights", icon: LineChart }
] as const;

const MOBILE_NAV = NAV;

const SECONDARY = [
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/profile", label: "Profile", icon: UserRound }
] as const;

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  user,
  accent,
  timezone,
  reducedMotion,
  children
}: {
  user: SessionUser;
  accent: string;
  timezone: string;
  reducedMotion: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}"
      });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <div
      data-accent={accent}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      className="min-h-dvh bg-canvas"
    >
      <ReminderWatcher userId={user.id} fallbackTimezone={timezone} />
      <div className="mx-auto flex w-full max-w-[1400px]">
        {/* Desktop / tablet sidebar */}
        <aside className="sticky top-0 hidden h-dvh w-[240px] shrink-0 flex-col border-r border-border bg-surface/70 px-4 py-6 lg:flex">
          <Brand href="/dashboard" className="px-2" />

          <nav aria-label="Primary" className="mt-8 flex flex-1 flex-col gap-1">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent-soft text-ink"
                      : "text-ink-soft hover:bg-subtle hover:text-ink"
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    className={cn("size-4.5", active ? "text-accent" : "text-ink-muted")}
                  />
                  {item.label}
                </Link>
              );
            })}

            <div className="mt-4 border-t border-border pt-4">
              {SECONDARY.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-accent-soft text-ink"
                        : "text-ink-soft hover:bg-subtle hover:text-ink"
                    )}
                  >
                    <Icon aria-hidden="true" className="size-4.5 text-ink-muted" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="mt-6 rounded-md border border-border bg-canvas p-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
                {initialsOf(user.name) || "J"}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{user.name}</p>
                <p className="truncate text-xs text-ink-muted">{user.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={signOut}
              disabled={signingOut}
              className="mt-3 flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs font-medium text-ink-soft hover:bg-subtle hover:text-ink disabled:opacity-60"
            >
              <LogOut aria-hidden="true" className="size-3.5" />
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile top bar */}
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-canvas/90 px-4 backdrop-blur lg:hidden">
            <Brand href="/dashboard" compact />
            <p className="text-sm font-semibold text-ink">
              {[...NAV, ...SECONDARY].find((item) => isActive(pathname, item.href))?.label ?? "Journal"}
            </p>
            <div className="flex items-center gap-1">
              <Link
                href="/settings"
                aria-label="Settings"
                className="rounded-sm p-2 text-ink-soft hover:bg-subtle hover:text-ink"
              >
                <Settings aria-hidden="true" className="size-4.5" />
              </Link>
              <button
                type="button"
                onClick={signOut}
                aria-label="Sign out"
                className="rounded-sm p-2 text-ink-soft hover:bg-subtle hover:text-ink"
              >
                <LogOut aria-hidden="true" className="size-4.5" />
              </button>
            </div>
          </header>

          <main id="main" className="flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile bottom navigation — max 5 destinations */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur lg:hidden"
      >
        <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
          {MOBILE_NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium",
                    active ? "text-accent" : "text-ink-muted"
                  )}
                >
                  <Icon aria-hidden="true" className="size-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
