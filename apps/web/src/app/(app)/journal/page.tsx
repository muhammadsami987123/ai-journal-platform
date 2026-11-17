import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { JournalList } from "@/features/journal/journal-list";

export const metadata: Metadata = { title: "Journal" };

export default function JournalPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <SkeletonText lines={2} />
          <Skeleton className="h-11 w-full" />
          <div className="space-y-3">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-32 w-full" />
            ))}
          </div>
        </div>
      }
    >
      <JournalList />
    </Suspense>
  );
}
