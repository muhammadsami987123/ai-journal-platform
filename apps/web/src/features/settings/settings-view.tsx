"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BellRing,
  Check,
  Download,
  KeyRound,
  LogOut,
  Palette,
  ShieldCheck,
  Trash2,
  UserRound
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type {
  MeResponse,
  Preferences,
  Profile,
  ReminderSettings
} from "@journal/shared";
import { LIMITS } from "@journal/shared";
import { api, messageForError } from "@/lib/api/client";
import { cn, initialsOf, LANGUAGE_OPTIONS } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { ErrorState } from "@/components/ui/empty-state";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SegmentedControl, Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/page-header";
import { useMe } from "@/hooks/use-me";

const ACCENTS = [
  { value: "default", label: "Warm clay" },
  { value: "terracotta", label: "Terracotta" },
  { value: "sage", label: "Sage" },
  { value: "ink", label: "Ink" }
] as const;

const COMMON_TIMEZONES = [
  "UTC",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Riyadh",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Australia/Sydney"
];

function allTimezones(current: string): string[] {
  const scope = Intl as unknown as { supportedValuesOf?: (key: string) => string[] };
  const supported = scope.supportedValuesOf?.("timeZone") ?? COMMON_TIMEZONES;
  const merged = new Set<string>([...supported, ...COMMON_TIMEZONES, current || "UTC"]);
  return [...merged].sort((a, b) => a.localeCompare(b));
}

function TimezoneField({
  id,
  value,
  onChange,
  label = "Timezone"
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
  label?: string;
}) {
  const zones = useMemo(() => allTimezones(value), [value]);
  return (
    <>
      <Input
        id={id}
        list={`${id}-list`}
        value={value}
        placeholder="Asia/Karachi"
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
      />
      <datalist id={`${id}-list`}>
        {zones.map((zone) => (
          <option key={zone} value={zone} />
        ))}
      </datalist>
      <p className="sr-only">{label} must be an IANA timezone name.</p>
    </>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  children
}: {
  icon: typeof UserRound;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card id={title.toLowerCase().replace(/\s+/g, "-")}>
      <CardHeader className="items-start">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-sm border border-border bg-canvas text-accent">
            <Icon aria-hidden="true" className="size-4" />
          </span>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-5">{children}</CardContent>
    </Card>
  );
}

export function SettingsView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const me = useMe();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [timezone, setTimezone] = useState("UTC");

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [denied, setDenied] = useState<string | null>(null);

  const profile = me.data?.profile;

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name);
    setBio(profile.bio ?? "");
    setAvatarUrl(profile.avatar_url ?? "");
    setTimezone(profile.timezone);
  }, [profile]);

  const saveProfile = useMutation({
    mutationFn: (input: Record<string, unknown>) => api.patch<Profile>("/api/v1/me/profile", input),
    onSuccess: (updated) => {
      queryClient.setQueryData<MeResponse>(["me"], (old) =>
        old ? { ...old, profile: updated } : old
      );
      toast({ title: "Profile saved" });
      router.refresh();
    },
    onError: (error) =>
      toast({ title: "Could not save profile", description: messageForError(error), tone: "error" })
  });

  const savePreferences = useMutation({
    mutationFn: (input: Partial<Preferences>) =>
      api.patch<Preferences>("/api/v1/me/preferences", input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["me"] });
      const previous = queryClient.getQueryData<MeResponse>(["me"]);
      if (previous) {
        queryClient.setQueryData<MeResponse>(["me"], {
          ...previous,
          preferences: { ...previous.preferences, ...input }
        });
      }
      return { previous };
    },
    onSuccess: (preferences, input) => {
      queryClient.setQueryData<MeResponse>(["me"], (old) =>
        old ? { ...old, preferences } : old
      );
      if ("theme_accent" in input || "reduced_motion" in input) router.refresh();
    },
    onError: (error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(["me"], context.previous);
      toast({ title: "Could not save preference", description: messageForError(error), tone: "error" });
    }
  });

  const reminders = useQuery({
    queryKey: ["reminders"],
    queryFn: () => api.get<ReminderSettings>("/api/v1/reminders")
  });

  const remindersSettings = reminders.data;
  const updateReminders = useMutation({
    mutationFn: (input: Record<string, unknown>) => api.put<ReminderSettings>("/api/v1/reminders", input),
    onSuccess: (updated) => {
      queryClient.setQueryData(["reminders"], updated);
      setDenied(null);
    },
    onError: (error) =>
      toast({ title: "Could not update reminders", description: messageForError(error), tone: "error" })
  });

  async function toggleReminders(next: boolean) {
    if (!next) {
      updateReminders.mutate({ enabled: false });
      return;
    }

    const channel = remindersSettings?.channel ?? "browser";
    if (!remindersSettings?.consent_at) {
      if (channel === "browser") {
        if (!("Notification" in window)) {
          setDenied("This browser cannot show notifications. Choose in-app reminders instead.");
          return;
        }
        if (Notification.permission === "denied") {
          setDenied(
            "Notifications are blocked for this site. Allow them in your browser site settings, then try again."
          );
          return;
        }
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setDenied("Permission was not granted. Reminders stay off until you allow them.");
          return;
        }
      }
      try {
        await api.post<ReminderSettings>("/api/v1/reminders/consent");
      } catch (error) {
        toast({ title: "Could not record consent", description: messageForError(error), tone: "error" });
        return;
      }
    }

    updateReminders.mutate({
      enabled: true,
      timezone: remindersSettings?.timezone ?? timezone
    });
  }

  const changePassword = useMutation({
    mutationFn: async (input: { currentPassword: string; newPassword: string }) => {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, revokeOtherSessions: true })
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { code?: string; message?: string }
          | null;
        throw new Error(
          body?.code === "INVALID_PASSWORD"
            ? "Your current password is not correct."
            : body?.message ?? "The password could not be changed."
        );
      }
    },
    onSuccess: () => {
      toast({ title: "Password changed", description: "Other sessions were signed out." });
      setPasswordOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error) =>
      toast({ title: "Could not change password", description: messageForError(error), tone: "error" })
  });

  const deleteAccount = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/delete-user", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword })
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { code?: string; message?: string }
          | null;
        throw new Error(
          body?.code === "INVALID_PASSWORD"
            ? "That password is not correct."
            : body?.message ?? "The account could not be deleted."
        );
      }
    },
    onSuccess: () => {
      queryClient.clear();
      router.replace("/login");
      router.refresh();
    },
    onError: (error) =>
      toast({ title: "Could not delete account", description: messageForError(error), tone: "error" })
  });

  async function signOut() {
    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}"
      });
    } finally {
      queryClient.clear();
      router.replace("/login");
      router.refresh();
    }
  }

  if (me.isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (me.isError || !me.data) {
    return <ErrorState message={messageForError(me.error)} onRetry={() => void me.refetch()} />;
  }

  const { user, preferences } = me.data;
  const profileDirty =
    displayName !== profile?.display_name ||
    bio !== (profile?.bio ?? "") ||
    avatarUrl !== (profile?.avatar_url ?? "") ||
    timezone !== profile?.timezone;

  const passwordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canChangePassword =
    currentPassword.length > 0 && newPassword.length >= 8 && !passwordMismatch;
  const canDelete = deletePassword.length > 0 && deleteConfirmation === "DELETE";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Your account, your rules"
        description="Everything here applies immediately. Nothing is shared with anyone else."
        actions={
          <Link href="/profile" className={buttonStyles("secondary", "sm")}>
            <UserRound aria-hidden="true" className="size-3.5" />
            View profile
          </Link>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-5">
          <Section
            icon={UserRound}
            title="Profile"
            description="How you appear inside your own journal."
          >
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                saveProfile.mutate({
                  display_name: displayName.trim(),
                  bio: bio.trim() || null,
                  avatar_url: avatarUrl.trim() || null,
                  timezone: timezone.trim()
                });
              }}
            >
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="size-12 rounded-full border border-border object-cover"
                  />
                ) : (
                  <span className="flex size-12 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                    {initialsOf(displayName || user.name) || "J"}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{user.name}</p>
                  <p className="truncate text-xs text-ink-muted">{user.email}</p>
                </div>
                <Badge tone={user.emailVerified ? "success" : "outline"} className="ml-auto shrink-0">
                  {user.emailVerified ? "Verified" : "Email unverified"}
                </Badge>
              </div>

              <Field label="Display name" htmlFor="display-name">
                {({ id }) => (
                  <Input
                    id={id}
                    value={displayName}
                    maxLength={LIMITS.MAX_NAME_LENGTH}
                    onChange={(event) => setDisplayName(event.target.value)}
                  />
                )}
              </Field>

              <Field
                label="Bio"
                htmlFor="bio"
                optional
                hint={`${bio.length}/${LIMITS.MAX_BIO_LENGTH} characters`}
              >
                {({ id }) => (
                  <Textarea
                    id={id}
                    value={bio}
                    rows={2}
                    maxLength={LIMITS.MAX_BIO_LENGTH}
                    placeholder="A line about you, if you want one."
                    onChange={(event) => setBio(event.target.value)}
                  />
                )}
              </Field>

              <Field label="Avatar URL" htmlFor="avatar-url" optional hint="A direct https link to an image.">
                {({ id }) => (
                  <Input
                    id={id}
                    value={avatarUrl}
                    placeholder="https://…"
                    onChange={(event) => setAvatarUrl(event.target.value)}
                  />
                )}
              </Field>

              <Field
                label="Timezone"
                htmlFor="profile-timezone"
                hint="Used for today's date, streaks and reminders. Start typing to search."
              >
                {({ id }) => (
                  <TimezoneField id={id} value={timezone} onChange={setTimezone} />
                )}
              </Field>

              <div className="flex items-center gap-2">
                <Button type="submit" loading={saveProfile.isPending} disabled={!profileDirty}>
                  Save profile
                </Button>
                {profileDirty ? <span className="text-xs text-ink-muted">Unsaved changes</span> : null}
              </div>
            </form>
          </Section>

          <Section
            icon={Palette}
            title="Writing preferences"
            description="Defaults that follow you into every new entry."
          >
            <div className="space-y-4">
              <Field label="Default writing language" htmlFor="default-language">
                {({ id }) => (
                  <Select
                    id={id}
                    value={preferences.default_language}
                    onChange={(event) =>
                      savePreferences.mutate({ default_language: event.target.value })
                    }
                  >
                    {LANGUAGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              <Field
                label="AI draft language"
                htmlFor="ai-language"
                hint="“Match my writing” keeps the language you used in the entry."
              >
                {({ id }) => (
                  <Select
                    id={id}
                    value={preferences.ai_output_language}
                    onChange={(event) =>
                      savePreferences.mutate({ ai_output_language: event.target.value })
                    }
                  >
                    <option value="match">Match my writing</option>
                    {LANGUAGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink">Week starts on</p>
                  <p className="mt-0.5 text-xs text-ink-muted">Applies to the calendar grid.</p>
                </div>
                <SegmentedControl
                  label="Week starts on"
                  value={preferences.week_starts_on === 1 ? "monday" : "sunday"}
                  onChange={(next) =>
                    savePreferences.mutate({ week_starts_on: next === "monday" ? 1 : 0 })
                  }
                  options={[
                    { value: "sunday", label: "Sunday" },
                    { value: "monday", label: "Monday" }
                  ]}
                />
              </div>

              <div className="border-t border-border pt-4">
                <Switch
                  label="Autosave while writing"
                  description="Saves quietly after you pause. Turn this off to save manually."
                  checked={preferences.autosave_enabled}
                  disabled={savePreferences.isPending}
                  onCheckedChange={(next) =>
                    savePreferences.mutate({ autosave_enabled: next })
                  }
                />
              </div>
            </div>
          </Section>

          <Section
            icon={Palette}
            title="Appearance"
            description="One accent colour, applied across the whole app."
          >
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-ink">Accent</p>
                <div role="radiogroup" aria-label="Accent colour" className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {ACCENTS.map((accent) => {
                    const selected = preferences.theme_accent === accent.value;
                    return (
                      <button
                        key={accent.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        data-accent={accent.value}
                        onClick={() => savePreferences.mutate({ theme_accent: accent.value })}
                        className={cn(
                          "flex items-center gap-2 rounded-sm border px-3 py-2.5 text-left text-sm transition-colors",
                          selected
                            ? "border-accent bg-accent-soft text-ink"
                            : "border-border bg-surface text-ink-soft hover:border-border-strong hover:bg-subtle"
                        )}
                      >
                        <span className="size-4 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                        <span className="truncate font-medium">{accent.label}</span>
                        {selected ? <Check aria-hidden="true" className="ml-auto size-3.5 text-accent" /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <Switch
                  label="Reduce motion"
                  description="Removes transitions and movement. Useful if animation is distracting."
                  checked={preferences.reduced_motion}
                  disabled={savePreferences.isPending}
                  onCheckedChange={(next) => savePreferences.mutate({ reduced_motion: next })}
                />
              </div>
            </div>
          </Section>
        </div>

        <div className="space-y-5">
          <Section
            icon={BellRing}
            title="Reminders"
            description="A single nudge, only on days you haven't written yet."
          >
            {reminders.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : reminders.isError || !remindersSettings ? (
              <ErrorState message={messageForError(reminders.error)} onRetry={() => void reminders.refetch()} />
            ) : (
              <div className="space-y-4">
                <Switch
                  label="Daily reminder"
                  description="Delivered while a journal tab is open in this browser."
                  checked={remindersSettings.enabled}
                  disabled={updateReminders.isPending}
                  onCheckedChange={(next) => void toggleReminders(next)}
                />

                {denied ? (
                  <p role="alert" className="rounded-sm border border-warning/40 bg-warning-soft px-3 py-2 text-xs leading-relaxed text-ink">
                    {denied}
                  </p>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Time" htmlFor="reminder-time">
                    {({ id }) => (
                      <Input
                        id={id}
                        type="time"
                        value={remindersSettings.time_local}
                        onChange={(event) =>
                          updateReminders.mutate({ time_local: event.target.value })
                        }
                        className="h-10"
                      />
                    )}
                  </Field>
                  <Field label="Channel" htmlFor="reminder-channel">
                    {({ id }) => (
                      <Select
                        id={id}
                        value={remindersSettings.channel}
                        onChange={(event) =>
                          updateReminders.mutate({ channel: event.target.value })
                        }
                        className="h-10"
                      >
                        <option value="browser">Browser notification</option>
                        <option value="in_app">In-app message</option>
                      </Select>
                    )}
                  </Field>
                </div>

                <Field label="Timezone" htmlFor="reminder-timezone" hint="The time above is read in this zone.">
                  {({ id }) => (
                    <TimezoneField
                      id={id}
                      value={remindersSettings.timezone}
                      onChange={(next) => updateReminders.mutate({ timezone: next })}
                    />
                  )}
                </Field>

                <div className="rounded-sm border border-border bg-canvas px-3 py-2.5 text-[11px] leading-relaxed text-ink-soft">
                  {remindersSettings.consent_at
                    ? "Permission recorded. You can turn this off at any time and it stops immediately."
                    : "Turning this on asks for your permission first. Nothing is scheduled until you allow it."}
                  {remindersSettings.last_sent_at ? (
                    <span className="mt-1 block text-ink-muted">
                      Last delivery: {new Date(remindersSettings.last_sent_at).toLocaleString("en-US")}
                    </span>
                  ) : null}
                </div>
              </div>
            )}
          </Section>

          <Section
            icon={ShieldCheck}
            title="Data & privacy"
            description="Your journal belongs to you. Take it or remove it completely."
          >
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-ink">Export everything</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                  A single JSON file with your entries, answers, moods, transcripts, drafts and profile.
                </p>
                <a
                  href="/api/v1/me/export"
                  download
                  className={buttonStyles("secondary", "sm", "mt-2")}
                >
                  <Download aria-hidden="true" className="size-3.5" />
                  Download export
                </a>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium text-ink">Sign-in email</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                  Changing the sign-in email isn&apos;t available in this release. Export your data,
                  then open a new account with the address you want — or ask support using the address
                  currently on file.
                </p>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium text-ink">Password</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                  Changing your password signs out every other session.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-2"
                  onClick={() => setPasswordOpen(true)}
                >
                  <KeyRound aria-hidden="true" className="size-3.5" />
                  Change password
                </Button>
              </div>
            </div>
          </Section>

          <Section
            icon={LogOut}
            title="Session"
            description="Sign out of this browser. Your entries stay on your account."
          >
            <Button variant="secondary" size="sm" onClick={() => void signOut()}>
              <LogOut aria-hidden="true" className="size-3.5" />
              Sign out
            </Button>
          </Section>

          <Section
            icon={Trash2}
            title="Delete account"
            description="Permanently removes your account and everything in it."
          >
            <p className="text-xs leading-relaxed text-ink-soft">
              This deletes entries, answers, moods, transcripts, AI drafts and settings. It cannot be
              undone, and there is no recovery window.
            </p>
            <Button
              variant="danger"
              size="sm"
              className="mt-3"
              onClick={() => {
                setDeletePassword("");
                setDeleteConfirmation("");
                setDeleteOpen(true);
              }}
            >
              <Trash2 aria-hidden="true" className="size-3.5" />
              Delete my account
            </Button>
          </Section>
        </div>
      </div>

      <Dialog
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        title="Change your password"
        description="Use at least 8 characters. Other devices will be signed out."
        footer={
          <>
            <Button variant="secondary" onClick={() => setPasswordOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={changePassword.isPending}
              disabled={!canChangePassword}
              onClick={() =>
                changePassword.mutate({ currentPassword, newPassword })
              }
            >
              Change password
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Current password" htmlFor="current-password">
            {({ id }) => (
              <Input
                id={id}
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            )}
          </Field>
          <Field label="New password" htmlFor="new-password" hint="At least 8 characters.">
            {({ id }) => (
              <Input
                id={id}
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            )}
          </Field>
          <Field
            label="Confirm new password"
            htmlFor="confirm-password"
            error={passwordMismatch ? "Passwords do not match." : undefined}
          >
            {({ id, invalid }) => (
              <Input
                id={id}
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                invalid={invalid || passwordMismatch}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            )}
          </Field>
        </div>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete your account?"
        description="This removes every entry, answer, mood, transcript, AI draft and setting. There is no undo."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              Keep my account
            </Button>
            <Button
              variant="danger"
              loading={deleteAccount.isPending}
              disabled={!canDelete}
              onClick={() => deleteAccount.mutate()}
            >
              Delete permanently
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Confirm your password" htmlFor="delete-password">
            {({ id }) => (
              <Input
                id={id}
                type="password"
                autoComplete="current-password"
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
              />
            )}
          </Field>
          <Field label="Type DELETE to confirm" htmlFor="delete-confirmation">
            {({ id }) => (
              <Input
                id={id}
                value={deleteConfirmation}
                placeholder="DELETE"
                onChange={(event) => setDeleteConfirmation(event.target.value)}
              />
            )}
          </Field>
        </div>
      </Dialog>
    </div>
  );
}
