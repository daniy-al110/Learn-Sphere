"use client";

import { useSession } from "@/hooks/useSession";
import type { ReactNode } from "react";
import { Lock } from "lucide-react";

export default function PermissionGuard({
  permission,
  children,
}: {
  permission: string;
  children: ReactNode;
}) {
  const { session, ready } = useSession();

  if (!ready) return null;

  // Super admins (or admins without specific restrictions yet) might bypass this if role='admin' and permissions exist?
  const isSuperAdmin = session.role === "admin" && (session.userEmail === "admin@lms.edu" || session.userEmail === "admin@learnsphere.com");
  const hasPermission = isSuperAdmin || (session.role === "admin" && session.permissions && session.permissions.includes(permission));

  if (!hasPermission) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8 bg-white rounded-lg shadow-sm">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Access Denied</h2>
        <p className="text-gray-500 max-w-md mx-auto text-lg">
          You do not have the required permissions to view this page. If you believe this is a mistake, please contact a Super Admin.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
