"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import type { Role } from "@/lib/types";

/**
 * Port of the guard at the top of utils.js:
 *   if (!currentUserId || currentRole !== 'student') location.href = 'login.html'
 * Renders nothing until the session is known, then either shows the page or redirects.
 */
export default function RoleGuard({
  role,
  requireId = true,
  children,
}: {
  role: Role;
  /** The admin pages never required a stored user id (change-password falls back to "1"). */
  requireId?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const { session, ready } = useSession();
  const allowed = (!requireId || !!session.userId) && session.role === role;

  useEffect(() => {
    if (ready && !allowed) router.replace("/login");
  }, [ready, allowed, router]);

  if (!ready || !allowed) return null;
  return <>{children}</>;
}
