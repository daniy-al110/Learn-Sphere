import PermissionGuard from "@/components/auth/PermissionGuard";
import ConfigAdminView from "@/components/admin/ConfigAdminView";

export default function Page() {
  return (
    <PermissionGuard permission="MANAGE_ROLES">
      <ConfigAdminView />
    </PermissionGuard>
  );
}
