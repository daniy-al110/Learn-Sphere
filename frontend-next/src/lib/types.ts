export type Role = "admin" | "teacher" | "student";

/** Shape of the data the old pages kept in localStorage. */
export interface Session {
  userName: string;
  userId: string | null;
  userEmail: string;
  role: Role | "";
  permissions?: string[];
}

/** Loosely typed: the backend response shape varies by role (see parseLoginResponse). */
export type LoginBody = Record<string, unknown>;

export interface ApiResult<T = Record<string, unknown>> {
  ok: boolean;
  status: number;
  statusText: string;
  body: T;
}
