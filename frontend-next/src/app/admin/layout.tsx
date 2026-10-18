import RoleGuard from "@/components/auth/RoleGuard";
import SidebarProvider from "@/components/layout/SidebarProvider";
import Sidebar, { type NavItem } from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import AdminDataProvider from "@/components/admin/AdminDataProvider";

// Same order and icons as the sidebar in admin-dashboard.html.
const NAV: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "layout-dashboard" },
  { href: "/admin/students", label: "Students", icon: "users", permission: "MANAGE_USERS" },
  { href: "/admin/teachers", label: "Teachers", icon: "user-check", permission: "MANAGE_USERS" },
  { href: "/admin/courses", label: "Courses", icon: "book-open", permission: "MANAGE_COURSES" },
  { href: "/admin/sections", label: "Sections", icon: "layers", permission: "MANAGE_COURSES" },
  { href: "/admin/scheduling", label: "Scheduling", icon: "calendar", permission: "MANAGE_COURSES" },
  { href: "/admin/enrollment-requests", label: "Enrollment Requests", icon: "inbox", permission: "MANAGE_USERS" },
  { href: "/admin/fee-challans", label: "Fee Challans", icon: "receipt", permission: "MANAGE_FINANCE" },
  { href: "/admin/registration-windows", label: "Reg Windows", icon: "calendar" },
  { href: "/admin/admins", label: "Admins", icon: "user-plus", permission: "MANAGE_ADMINS" },
  { href: "/admin/roles", label: "Roles & Permissions", icon: "shield", permission: "MANAGE_ROLES" },
  { href: "/admin/messages", label: "Messages", icon: "message-square" },
];

// Server Component shell. The admin page never stored/required a user id, so the guard checks the role only.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="admin" requireId={false}>
      <SidebarProvider>
        <AdminDataProvider>
          <div className="admin-root flex relative overflow-hidden" style={{ minHeight: '111.12vh', height: '111.12vh' }}>
            <Sidebar items={NAV} fallbackName="Admin User" fallbackInitial="A" tagline="Welcome back!" logoutMode="signout" />
            <div className="flex-1 ml-0 lg:ml-64 transition-all duration-300 bg-white h-full flex flex-col overflow-hidden">
              <Navbar
                welcomeLabel="Welcome" fallbackName="Admin User" 
                changePasswordHref="/admin/change-password" notifications={false} compactPadding
              />
              <main className="flex-1 overflow-y-auto p-4 lg:p-8" id="mainContent">
                {children}
              </main>
            </div>
          </div>
        </AdminDataProvider>
      </SidebarProvider>
    </RoleGuard>
  );
}
