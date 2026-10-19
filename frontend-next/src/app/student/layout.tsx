import RoleGuard from "@/components/auth/RoleGuard";
import SidebarProvider from "@/components/layout/SidebarProvider";
import Sidebar, { type NavItem } from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";

// Same order and icons as the sidebar in student-landing.html.
const NAV: NavItem[] = [
  { href: "/student/landing", label: "Dashboard", icon: "layout-dashboard" },
  { href: "/student/courses", label: "Courses", icon: "book-open" },
  { href: "/student/attendance", label: "Attendance", icon: "calendar" },
  { href: "/student/quizzes", label: "Quizzes", icon: "edit-3" },
  { href: "/student/assignments", label: "Assignments", icon: "file-text" },
  { href: "/student/lectures", label: "Lectures", icon: "play-circle" },
  { href: "/student/reviews", label: "Reviews", icon: "message-square" },
  { href: "/student/transcript", label: "Transcript", icon: "check-square" },
  { href: "/student/schedule", label: "Schedule", icon: "calendar" },
  { href: "/student/meetings", label: "My Meetings", icon: "video" },
  { href: "/student/messages", label: "Messages", icon: "message-square" },
  { href: "/student/fee-challans", label: "Fee Challans", icon: "receipt" },
  { href: "/student/change-password", label: "Change Password", icon: "key" },
];

// Server Component: static shell. Auth guard, sidebar and navbar are client components inside it.
export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="student">
      <SidebarProvider>
        <div className="flex min-h-screen h-screen relative overflow-hidden bg-slate-50 dark:bg-[#0c0f1d] text-slate-900 dark:text-white transition-colors duration-200">
          <Sidebar items={NAV} fallbackName="Student" fallbackInitial="S" tagline="Ready to learn?" />
          <div className="flex-1 ml-0 lg:ml-64 transition-all duration-300 bg-slate-50 dark:bg-[#0c0f1d] h-full flex flex-col overflow-hidden">
            <Navbar welcomeLabel="Welcome Student" fallbackName="Student User" changePasswordHref="/student/change-password" />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8" id="mainContent">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </RoleGuard>
  );
}
