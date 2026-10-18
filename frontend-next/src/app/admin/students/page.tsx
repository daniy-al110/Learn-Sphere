import PermissionGuard from "@/components/auth/PermissionGuard";
import { Suspense } from "react";
import type { Metadata } from "next";
import StudentsView from "@/components/admin/StudentsView";

export const metadata: Metadata = { title: "Students - Learning Sphere" };

// useSearchParams() (?new=1 opens the "add" form) needs a Suspense boundary.
export default function Page() {
  return (
    <PermissionGuard permission="MANAGE_USERS">
      <Suspense fallback={null}>
        <StudentsView />
      </Suspense>
    </PermissionGuard>
  );
}
