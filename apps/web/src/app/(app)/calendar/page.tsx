import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarView } from "@/features/calendar/calendar-view";

export const metadata: Metadata = { title: "Calendar" };

export default function CalendarPage() {
  return (
    <Suspense
      fallback={
        <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
          <Skeleton className="h-[520px] w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      }
    >
      <CalendarView />
    </Suspense>
  );
}
