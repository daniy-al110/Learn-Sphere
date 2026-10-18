import { API_BASE_URL } from "./config";
import type { ApiResult } from "./types";

/**
 * Thin wrapper around fetch(). Mirrors the old pages: always try JSON first, and if the
 * body isn't JSON fall back to `{ error: <text> }` so callers can show a message.
 * Plain async function -> usable from event handlers, hooks, or (for non-browser
 * work) Server Actions.
 */
export async function apiFetch<T = Record<string, unknown>>(
  path: string,
  init: RequestInit = {},
): Promise<ApiResult<T>> {
  const res = await fetch(`${API_BASE_URL}${path}`, init);
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    try {
      body = { error: await res.text() };
    } catch {
      body = { error: "Unknown response" };
    }
  }
  return { ok: res.ok, status: res.status, statusText: res.statusText, body: body as T };
}

export function postJson<T = Record<string, unknown>>(path: string, data: unknown) {
  return apiFetch<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

/* ---- Auth endpoints (login.html / app.js) ---- */

export const loginRequest = (email: string, password: string) =>
  postJson("/api/user/login", { email, password });

export const passwordResetRequest = (lmsEmail: string, personalEmail: string) =>
  postJson("/api/password/reset", { lmsEmail, personalEmail });
