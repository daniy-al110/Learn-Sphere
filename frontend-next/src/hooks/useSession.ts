"use client";

import { useMemo, useSyncExternalStore } from "react";
import { SESSION_EVENT, parseSession, readSessionRaw } from "@/lib/auth";
import type { Session } from "@/lib/types";

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(SESSION_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(SESSION_EVENT, cb);
  };
}
const noopSubscribe = () => () => {};

/** True once we're running in the browser (localStorage is only readable then). */
export function useIsClient() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

/**
 * Replaces the `localStorage.getItem("userName")` reads scattered through utils.js/app.js.
 * `ready` is false during SSR/hydration so pages don't flash the wrong state.
 */
export function useSession(): { session: Session; ready: boolean } {
  const ready = useIsClient();
  const raw = useSyncExternalStore(subscribe, readSessionRaw, () => "");
  const session = useMemo<Session>(
    () => (raw ? parseSession(raw) : { userName: "", userId: null, userEmail: "", role: "" }),
    [raw],
  );
  return { session, ready };
}
