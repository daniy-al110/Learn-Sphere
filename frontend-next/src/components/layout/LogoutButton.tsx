"use client";

import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/auth";
import { confirmDialog, toast } from "@/lib/toast-store";

/** Port of logout() from utils.js: confirm -> clear storage -> toast -> go to login. */
export function useLogout() {
  const router = useRouter();
  return async () => {
    const confirmed = await confirmDialog.confirm({
      title: "Logout",
      message: "Are you sure you want to sign out?",
      confirmText: "Sign Out",
      type: "info",
    });
    if (!confirmed) return;
    clearSession();
    toast.info("Logged out successfully!");
    setTimeout(() => router.push("/login"), 500);
  };
}

export default function LogoutButton({ className }: { className?: string }) {
  const logout = useLogout();
  return (
    <button type="button" onClick={logout} className={className}>
      Sign Out
    </button>
  );
}
