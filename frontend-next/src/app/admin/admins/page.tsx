import PermissionGuard from "@/components/auth/PermissionGuard";
import AddAdminView from "@/components/admin/AddAdminView";

export default function Page() {
  return (
    <PermissionGuard permission="MANAGE_ADMINS">
      <AddAdminView />
    </PermissionGuard>
  );
}
