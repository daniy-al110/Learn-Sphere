import RoleGuard from "@/components/auth/RoleGuard";
import SidebarProvider from "@/components/layout/SidebarProvider";
import Sidebar, { type NavItem } from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import TeacherCoursesProvider from "@/components/teacher/TeacherCoursesProvider";

// Same order and icons as the sidebar in teacher-dashboard.html.
const NAV: NavItem[] = [
  { href: "/teacher/dashboard", label: "Dashboard", icon: "layout-dashboard" },
  { href: "/teacher/courses", label: "My Courses", icon: "book-open" },
  { href: "/teacher/attendance", label: "Attendance", icon: "calendar" },
  { href: "/teacher/quizzes", label: "Quizzes", icon: "edit-3" },
  { href: "/teacher/assignments", label: "Assignments", icon: "file-text" },
  { href: "/teacher/marks", label: "Marks", icon: "check-square" },
  { href: "/teacher/reviews", label: "Student Reviews", icon: "star" },
  { href: "/teacher/schedule", label: "Schedule", icon: "calendar" },
  { href: "/teacher/meetings", label: "Meetings", icon: "video" },
  { href: "/teacher/lectures", label: "Lectures", icon: "play-circle" },
  { href: "/teacher/messages", label: "Messages", icon: "message-square" },
  { href: "/teacher/change-password", label: "Change Password", icon: "key" },
];

// Server Component shell. Auth guard, sidebar, navbar and the shared course list are client components.
export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="teacher">
      <SidebarProvider>
        <TeacherCoursesProvider>
          <div className="flex min-h-screen h-screen relative overflow-hidden bg-slate-50 dark:bg-[#0c0f1d] text-slate-900 dark:text-white transition-colors duration-200">
            <Sidebar items={NAV} fallbackName="Teacher" fallbackInitial="T" tagline="Welcome back!" logoutMode="signout" />
            <div className="flex-1 ml-0 lg:ml-64 transition-all duration-300 bg-slate-50 dark:bg-[#0c0f1d] h-full flex flex-col overflow-hidden">
              <Navbar welcomeLabel="Welcome Teacher" fallbackName="Teacher User" changePasswordHref="/teacher/change-password" notifications={false} />
              <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8" id="mainContent">
                {children}
              </main>
            </div>
          </div>
        </TeacherCoursesProvider>
      </SidebarProvider>
    </RoleGuard>
  );
}
