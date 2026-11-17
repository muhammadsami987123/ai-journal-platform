import { redirect } from "next/navigation";
import { AppShell } from "@/layouts/app-shell";
import { getMe } from "@/lib/api/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  if (!me) redirect("/login");

  return (
    <AppShell
      user={me.user}
      accent={me.preferences.theme_accent}
      timezone={me.profile.timezone}
      reducedMotion={me.preferences.reduced_motion}
    >
      {children}
    </AppShell>
  );
}
