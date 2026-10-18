import PermissionGuard from "@/components/auth/PermissionGuard";
import SectionsView from "@/components/admin/SectionsView";

export default function Page() {
  return (
    <PermissionGuard permission="MANAGE_COURSES">
      <SectionsView />
    </PermissionGuard>
  );
}
