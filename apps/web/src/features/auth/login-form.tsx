"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { safeNextPath } from "@/lib/utils";

interface AuthErrorBody {
  message?: string;
  code?: string;
}

const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "That email and password don't match. Try again.",
  INVALID_EMAIL: "Enter a valid email address.",
  USER_NOT_FOUND: "That email and password don't match. Try again.",
  TOO_MANY_REQUESTS: "Too many attempts. Please wait a moment before trying again."
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const nextErrors: typeof fieldErrors = {};
    if (!email.trim()) nextErrors.email = "Enter your email.";
    if (!password) nextErrors.password = "Enter your password.";
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      const response = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password })
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as AuthErrorBody | null;
        setError(MESSAGES[body?.code ?? ""] ?? body?.message ?? "We couldn't sign you in.");
        return;
      }

      router.replace(next);
      router.refresh();
    } catch {
      setError("The server is unreachable. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">Welcome back</p>
      <h1 className="mt-2 font-serif text-3xl leading-tight tracking-tight text-ink">
        Pick up where you left off.
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Sign in to write today&apos;s entry, review a draft, or revisit an earlier day.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
        {error ? (
          <div role="alert" className="rounded-sm border border-danger/30 bg-danger-soft px-3.5 py-3 text-sm text-ink">
            {error}
          </div>
        ) : null}

        <Field label="Email" htmlFor="email" error={fieldErrors.email}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              value={email}
              invalid={invalid || Boolean(fieldErrors.email)}
              aria-describedby={describedBy}
              onChange={(event) => setEmail(event.target.value)}
            />
          )}
        </Field>

        <Field label="Password" htmlFor="password" error={fieldErrors.password}>
          {({ id, describedBy, invalid }) => (
            <div className="relative">
              <Input
                id={id}
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Your password"
                value={password}
                invalid={invalid || Boolean(fieldErrors.password)}
                aria-describedby={describedBy}
                onChange={(event) => setPassword(event.target.value)}
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-1 top-1 flex size-9 items-center justify-center rounded-sm text-ink-muted hover:bg-subtle hover:text-ink"
              >
                {showPassword ? (
                  <EyeOff aria-hidden="true" className="size-4" />
                ) : (
                  <Eye aria-hidden="true" className="size-4" />
                )}
              </button>
            </div>
          )}
        </Field>

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-ink-soft">
        New here?{" "}
        <Link
          href={`/register?next=${encodeURIComponent(next)}`}
          className="font-medium text-accent underline decoration-accent-border underline-offset-4 hover:text-accent-hover"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
