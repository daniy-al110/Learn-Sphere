"use client";

import LogoutButton from "./LogoutButton";
import { useSession } from "@/hooks/useSession";

/** Temporary landing view so the post-login redirect can be verified end to end. */
export default function DashboardPlaceholder({ title }: { title: string }) {
  const { session } = useSession();
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-sidebar text-white p-6">
      <h1 className="text-2xl font-bold text-primary">{title}</h1>
      <p>
        Signed in as <strong>{session.userName}</strong> ({session.role}, id {session.userId})
      </p>
      <p className="text-white/60 text-sm">Dashboard conversion comes in the next step.</p>
      <LogoutButton className="px-5 py-2 rounded-lg bg-primary text-white font-semibold cursor-pointer" />
    </main>
  );
}
