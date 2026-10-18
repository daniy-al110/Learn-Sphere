import PermissionGuard from "@/components/auth/PermissionGuard";
import type { Metadata } from "next";
import FeeChallansView from "@/components/admin/FeeChallansView";

export const metadata: Metadata = { title: "Fee Challans - Learning Sphere" };

export default function Page() {
  return (
    <PermissionGuard permission="MANAGE_FINANCE">
      <FeeChallansView />
    </PermissionGuard>
  );
}
