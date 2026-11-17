import { cookies } from "next/headers";
import type { MeResponse } from "@journal/shared";

/**
 * Server-side API access. The browser's cookie header is forwarded verbatim to
 * the API (T2.4); nothing is cached, because every response is user-scoped.
 */

const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? "http://localhost:3001";

export async function fetchServer<T>(path: string): Promise<T | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.toString();

  try {
    const response = await fetch(`${API_INTERNAL_URL}${path}`, {
      headers: cookie ? { cookie } : undefined,
      cache: "no-store"
    });

    if (!response.ok) return null;
    const payload = (await response.json()) as { data: T };
    return payload.data;
  } catch {
    return null;
  }
}

export async function getMe(): Promise<MeResponse | null> {
  return fetchServer<MeResponse>("/api/v1/me");
}

export function hasSessionCookie(cookieValue: string | undefined): boolean {
  return Boolean(cookieValue);
}
