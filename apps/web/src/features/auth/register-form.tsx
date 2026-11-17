"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Eye, EyeOff } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { safeNextPath } from "@/lib/utils";

interface AuthErrorBody {
  message?: string;
  code?: string;
}

const MESSAGES: Record<string, string> = {
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    "An account already exists for this email. Sign in instead.",
  USER_ALREADY_EXISTS: "An account already exists for this email. Sign in instead.",
  PASSWORD_TOO_SHORT: "Use at least 8 characters for your password.",
  PASSWORD_TOO_LONG: "That password is too long. Use 128 characters or fewer.",
  INVALID_EMAIL: "Enter a valid email address."
};

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return Math.min(score, 4);
  }, [password]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const nextErrors: Record<string, string | undefined> = {};
    if (!name.trim()) nextErrors.name = "Enter a name we can greet you by.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextErrors.email = "Enter a valid email address.";
    if (password.length < 8) nextErrors.password = "Use at least 8 characters.";
    if (password !== confirm) nextErrors.confirm = "Passwords do not match.";
    setFieldErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setLoading(true);
    try {
      const response = await fetch("/api/auth/sign-up/email", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password })
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as AuthErrorBody | null;
        setError(MESSAGES[body?.code ?? ""] ?? body?.message ?? "We couldn't create your account.");
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
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">Create your journal</p>
      <h1 className="mt-2 font-serif text-3xl leading-tight tracking-tight text-ink">
        A few lines a day is enough.
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        One account, one private journal. No feed, no followers, nothing to perform for.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
        {error ? (
          <div role="alert" className="rounded-sm border border-danger/30 bg-danger-soft px-3.5 py-3 text-sm text-ink">
            {error}
          </div>
        ) : null}

        <Field label="Name" htmlFor="name" error={fieldErrors.name}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              name="name"
              autoComplete="name"
              placeholder="What should we call you?"
              value={name}
              invalid={invalid || Boolean(fieldErrors.name)}
              aria-describedby={describedBy}
              onChange={(event) => setName(event.target.value)}
            />
          )}
        </Field>

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

        <Field
          label="Password"
          htmlFor="password"
          error={fieldErrors.password}
          hint="At least 8 characters. A short phrase works well."
        >
          {({ id, describedBy, invalid }) => (
            <div className="relative">
              <Input
                id={id}
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Create a password"
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

        {password ? (
          <div aria-hidden="true" className="flex items-center gap-2">
            {[0, 1, 2, 3].map((index) => (
              <span
                key={index}
                className={`h-1 flex-1 rounded-full ${
                  index < strength ? "bg-accent" : "bg-subtle"
                }`}
              />
            ))}
            <span className="w-16 text-right text-[11px] text-ink-muted">
              {["Weak", "Fair", "Good", "Strong"][Math.max(strength - 1, 0)]}
            </span>
          </div>
        ) : null}

        <Field label="Confirm password" htmlFor="confirm" error={fieldErrors.confirm}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              name="confirm"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={confirm}
              invalid={invalid || Boolean(fieldErrors.confirm)}
              aria-describedby={describedBy}
              onChange={(event) => setConfirm(event.target.value)}
            />
          )}
        </Field>

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          {loading ? "Creating your account…" : "Create account"}
        </Button>

        <ul className="space-y-1.5 text-xs text-ink-muted">
          {[
            "Your original words are never rewritten",
            "AI drafts require your explicit approval",
            "Export or delete everything at any time"
          ].map((item) => (
            <li key={item} className="flex items-center gap-1.5">
              <Check aria-hidden="true" className="size-3.5 text-success" />
              {item}
            </li>
          ))}
        </ul>
      </form>

      <p className="mt-6 text-sm text-ink-soft">
        Already journaling?{" "}
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="font-medium text-accent underline decoration-accent-border underline-offset-4 hover:text-accent-hover"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
