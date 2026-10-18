import PermissionGuard from "@/components/auth/PermissionGuard";
import type { Metadata } from "next";
import SchedulingView from "@/components/admin/SchedulingView";

export const metadata: Metadata = { title: "Scheduling - Learning Sphere" };

export default function Page() {
  return (
    <PermissionGuard permission="MANAGE_COURSES">
      <SchedulingView />
    </PermissionGuard>
  );
}
