import PermissionGuard from "@/components/auth/PermissionGuard";
import { Suspense } from "react";
import type { Metadata } from "next";
import TeachersView from "@/components/admin/TeachersView";

export const metadata: Metadata = { title: "Teachers - Learning Sphere" };

// useSearchParams() (?new=1 opens the "add" form) needs a Suspense boundary.
export default function Page() {
  return (
    <PermissionGuard permission="MANAGE_USERS">
      <Suspense fallback={null}>
        <TeachersView />
      </Suspense>
    </PermissionGuard>
  );
}
