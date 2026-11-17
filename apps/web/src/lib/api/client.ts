import type { ApiErrorBody } from "@journal/shared";

/**
 * Browser-side API access. Every call goes through the same-origin `/api`
 * rewrite, so the session cookie is first-party and no CORS preflight exists.
 */

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId?: string;
  readonly details?: unknown;

  constructor(status: number, body: ApiErrorBody | null) {
    super(body?.error?.message ?? "Something went wrong. Please try again.");
    this.name = "ApiError";
    this.status = status;
    this.code = body?.error?.code ?? "INTERNAL_ERROR";
    this.requestId = body?.error?.requestId;
    this.details = body?.error?.details;
  }
}

type QueryValue = string | number | boolean | null | undefined | (string | number)[];
type Query = Record<string, QueryValue>;

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Query;
  signal?: AbortSignal;
}

function buildPath(path: string, query?: Query): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const entry of value) params.append(key, String(entry));
    } else {
      params.set(key, String(value));
    }
  }
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(buildPath(path, options.query), {
    method: options.method ?? "GET",
    credentials: "include",
    signal: options.signal,
    headers: options.body === undefined ? undefined : { "Content-Type": "application/json" },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store"
  });

  const payload = (await response.json().catch(() => null)) as
    | { data: T }
    | ApiErrorBody
    | null;

  if (!response.ok) {
    throw new ApiError(response.status, payload as ApiErrorBody | null);
  }

  return (payload as { data: T } | null)?.data as T;
}

export const api = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) =>
    apiRequest<T>(path, { query, signal }),
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "PATCH", body }),
  del: <T>(path: string, query?: Query) => apiRequest<T>(path, { method: "DELETE", query })
};

/** Friendly copy for error codes the API is allowed to return. */
export function messageForError(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "UNAUTHENTICATED":
        return "Your session has expired. Please sign in again.";
      case "ENTRY_NOT_FOUND":
        return "That entry no longer exists.";
      case "ENTRY_EMPTY":
        return "Write something before marking the entry complete.";
      case "ENTRY_TOO_LONG":
        return "This entry is longer than the limit. Try splitting it.";
      case "IMMUTABLE_FIELD":
        return "Your original words cannot be changed. Edit the final text instead.";
      case "AI_UNAVAILABLE":
        return "The writing assistant is not configured yet. You can keep writing manually.";
      case "AI_RATE_LIMITED":
        return "The writing assistant is busy. Try again in a moment.";
      case "AI_INVALID_OUTPUT":
        return "The assistant returned an unusable draft. Nothing was saved.";
      case "STT_UNAVAILABLE":
        return "Server transcription is not configured. Use your browser's microphone or type instead.";
      case "REMINDER_NOT_CONSENTED":
        return "Allow browser notifications first, then turn the reminder on.";
      case "VALIDATION_FAILED":
        return error.message;
      case "RATE_LIMITED":
        return "Too many requests. Please wait a moment.";
      default:
        return error.message;
    }
  }
  if (error instanceof TypeError) {
    return "The server is unreachable. Check your connection and try again.";
  }
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
