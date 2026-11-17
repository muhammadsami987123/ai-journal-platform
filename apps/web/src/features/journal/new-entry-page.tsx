"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EntryEditor } from "@/features/journal/entry-editor";
import { businessDateIn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

function isValidDate(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export function NewEntryPage() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <Skeleton className="h-[60vh] w-full" />
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const requested = searchParams.get("date");
  const today = businessDateIn(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const initialDate = isValidDate(requested) ? requested : today;

  return <EntryEditor initialDate={initialDate} />;
}
