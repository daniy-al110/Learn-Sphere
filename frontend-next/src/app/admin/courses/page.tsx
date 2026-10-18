import PermissionGuard from "@/components/auth/PermissionGuard";
import { Suspense } from "react";
import type { Metadata } from "next";
import CoursesView from "@/components/admin/CoursesView";

export const metadata: Metadata = { title: "Courses - Learning Sphere" };

// useSearchParams() (?new=1 opens the "add" form) needs a Suspense boundary.
export default function Page() {
  return (
    <PermissionGuard permission="MANAGE_COURSES">
      <Suspense fallback={null}>
        <CoursesView />
      </Suspense>
    </PermissionGuard>
  );
}
