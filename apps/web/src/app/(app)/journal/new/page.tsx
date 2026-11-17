import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { NewEntryPage } from "@/features/journal/new-entry-page";

export const metadata: Metadata = { title: "New entry" };

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
          <Skeleton className="h-[60vh] w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <NewEntryPage />
    </Suspense>
  );
}
