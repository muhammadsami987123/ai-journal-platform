import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { RegisterForm } from "@/features/auth/register-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-4/5" />
          <SkeletonText lines={2} />
          <div className="space-y-4 pt-4">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-11 w-full" />
            ))}
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
