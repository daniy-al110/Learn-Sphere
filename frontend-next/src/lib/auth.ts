import type { LoginBody, Role, Session } from "./types";

const KEYS = ["userName", "userId", "userEmail", "userRole", "teacherId", "teacherName", "userPermissions"] as const;
export const SESSION_EVENT = "lms-session-change";

/** Where each role lands after login (was admin-dashboard.html etc.). */
export function roleHome(role: string): string {
  if (role === "admin") return "/admin/dashboard";
  if (role === "teacher") return "/teacher/dashboard";
  return "/student/landing";
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === "object";

export type ParsedLogin =
  | { ok: true; role: string; user: Obj; userId: string | number | null }
  | { ok: false; error: string };

/**
 * Port of the response handling in app.js: find the user object and id in whichever
 * shape the backend returned (body[role] | body.user | body.data | first user-like prop).
 */
export function parseLoginResponse(body: LoginBody): ParsedLogin {
  if (!body.success) {
    return { ok: false, error: "Login failed: " + (typeof body.error === "string" && body.error ? body.error : "Invalid credentials") };
  }
  const role = body.role;
  if (typeof role !== "string" || !role) {
    return { ok: false, error: "Login failed: server did not return user role." };
  }

  let user: Obj | null = null;
  if (isObj(body[role])) user = body[role] as Obj;
  else if (body.user) user = body.user as Obj;
  else if (body.data) user = body.data as Obj;
  else {
    for (const k of Object.keys(body)) {
      const val = body[k];
      if (isObj(val) && (val.email || val.name || val.id || val.user_id || val[`${role}_id`])) {
        user = val;
        break;
      }
    }
  }
  if (!user) return { ok: false, error: "Login failed: server did not return user data." };

  let userId: string | number | null = null;
  for (const k of [`${role}_id`, "id", "user_id", `${role}Id`, `${role}ID`, `${role}_ID`]) {
    const v = user[k];
    if (v !== undefined && v !== null) {
      userId = v as string | number;
      break;
    }
  }
  if (userId == null) {
    for (const v of Object.values(user)) {
      if (typeof v === "number") {
        userId = v;
        break;
      }
    }
  }
  return { ok: true, role, user, userId };
}

function notify() {
  window.dispatchEvent(new Event(SESSION_EVENT));
}

/** Same localStorage keys as the vanilla app, so both frontends can coexist. */
export function saveSession(role: string, user: Obj, userId: string | number | null) {
  try {
    const name = (user.name || user.full_name || user.email || (role === "admin" ? "Admin" : "User")) as string;
    localStorage.setItem("userName", name);
    if (userId != null) localStorage.setItem("userId", String(userId));
    else localStorage.removeItem("userId");
    localStorage.setItem("userEmail", (user.email as string) || "");
    localStorage.setItem("userRole", role);
    if (user.permissions && Array.isArray(user.permissions)) {
      localStorage.setItem("userPermissions", JSON.stringify(user.permissions));
    } else {
      localStorage.removeItem("userPermissions");
    }
    if (role === "teacher" && userId != null) {
      localStorage.setItem("teacherId", String(userId));
      localStorage.setItem("teacherName", (user.name || user.full_name || user.email || "Teacher") as string);
    }
  } catch (e) {
    console.warn("Could not persist user info to localStorage", e);
  }
  notify();
}

export function clearSession() {
  KEYS.forEach((k) => localStorage.removeItem(k));
  notify();
}

/** String snapshot (stable for useSyncExternalStore). */
export function readSessionRaw(): string {
  let perms = [];
  try { perms = JSON.parse(localStorage.getItem("userPermissions") || "[]"); } catch {}
  return JSON.stringify({
    userName: localStorage.getItem("userName") || "",
    userId: localStorage.getItem("userId"),
    userEmail: localStorage.getItem("userEmail") || "",
    role: localStorage.getItem("userRole") || "",
    permissions: perms,
  });
}

export function parseSession(raw: string): Session {
  return JSON.parse(raw) as Session;
}

export type { Role };
