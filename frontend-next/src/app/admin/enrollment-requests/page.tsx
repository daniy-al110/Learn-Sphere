import PermissionGuard from "@/components/auth/PermissionGuard";
import type { Metadata } from "next";
import EnrollmentRequestsView from "@/components/admin/EnrollmentRequestsView";

export const metadata: Metadata = { title: "Enrollment Requests - Learning Sphere" };

export default function Page() {
  return (
    <PermissionGuard permission="MANAGE_USERS">
      <EnrollmentRequestsView />
    </PermissionGuard>
  );
}
