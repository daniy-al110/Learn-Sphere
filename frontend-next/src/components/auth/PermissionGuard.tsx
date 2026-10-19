"use client";

import { useSession } from "@/hooks/useSession";
import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";

export default function PermissionGuard({
  permission,
  children,
}: {
  permission: string;
  children: ReactNode;
}) {
  const { session, ready } = useSession();

  if (!ready) return null;

  // Fully database-driven: permissions loaded from Supabase role_permissions
  const hasPermission =
    session.role === "admin" &&
    Array.isArray(session.permissions) &&
    session.permissions.includes(permission);

  if (!hasPermission) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[420px] text-center p-8 bg-white dark:bg-slate-900/80 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl">
        <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20 flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
          Access Restricted
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm leading-relaxed">
          Your account does not have the designated database permission (<code className="font-mono text-pink-500">{permission}</code>) to access this administrative module.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
