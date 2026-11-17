import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-4/5" />
          <SkeletonText lines={2} />
          <div className="space-y-4 pt-4">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
