"use client";

import { useEffect } from "react";
import type { DashboardPayload, ReminderSettings } from "@journal/shared";
import { api } from "@/lib/api/client";
import { businessDateIn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

/**
 * Client-side reminder delivery (T12.5). There is no server cron: while an app
 * tab is open, this watcher checks the user's own reminder settings once a
 * minute. Delivery is idempotent per local day — the day key is written before
 * the notification is shown, so a reload can never double-send.
 */
export function ReminderWatcher({ userId, fallbackTimezone }: { userId: string; fallbackTimezone: string }) {
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const settings = await api.get<ReminderSettings>("/api/v1/reminders");
        if (cancelled || !settings.enabled || !settings.consent_at) return;

        const zone = settings.timezone || fallbackTimezone || "UTC";
        const now = new Date();
        const localTime = new Intl.DateTimeFormat("en-GB", {
          timeZone: zone,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        }).format(now);

        if (localTime < settings.time_local) return;

        const day = businessDateIn(zone, now);
        const key = `journal.reminder.${userId}.${day}`;
        if (window.localStorage.getItem(key)) return;

        const dashboard = await api.get<DashboardPayload>("/api/v1/dashboard");
        window.localStorage.setItem(key, new Date().toISOString());
        if (dashboard.today_entries.length > 0) return;

        const title = "Today's page is still blank";
        const body = "A few lines is enough. Open the journal and write what happened.";

        if (
          settings.channel === "browser" &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          const notification = new Notification(title, {
            body,
            icon: "/favicon.ico",
            tag: key
          });
          notification.onclick = () => {
            window.focus();
            window.location.href = "/journal/new";
            notification.close();
          };
        } else {
          toast({ title, description: body });
        }
      } catch {
        /* Reminders are best-effort; a failed check must never surface an error. */
      }
    }

    void check();
    const interval = window.setInterval(check, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [userId, fallbackTimezone, toast]);

  return null;
}
