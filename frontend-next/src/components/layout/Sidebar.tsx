"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon, type IconName } from "./icons";
import { useSidebar } from "./SidebarProvider";
import { initialsOf } from "@/lib/student/helpers";
import { useSession } from "@/hooks/useSession";
import { useLogout } from "./LogoutButton";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  permission?: string;
}

interface SidebarProps {
  items: NavItem[];
  /** Fallback display name shown until/unless a name is stored (original used "Student"). */
  fallbackName: string;
  /** Small line under the name ("Ready to learn?" for students, "Welcome back!" for staff). */
  tagline?: string;
  /**
   * What the bottom "Logout" button does. Students' old button only navigated to login.html
   * ("navigate"); teachers/admins confirmed and cleared the session ("signout").
   */
  logoutMode?: "navigate" | "signout";
  /** Used when logoutMode is "navigate". */
  logoutHref?: string;
  /** Letter shown in the avatar when no name is stored. */
  fallbackInitial?: string;
  /** Show this fixed label instead of the stored user name (the admin page was static: "Hi, Admin"). */
  fixedName?: string;
}

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * Reusable dashboard sidebar. Replaces the <aside id="sidebar"> markup plus the drawer
 * behaviour of mobile-sidebar.js (slide in/out, overlay, Escape, focus trap, close on nav click).
 */
export default function Sidebar({
  items,
  fallbackName,
  tagline = "Ready to learn?",
  logoutMode = "navigate",
  logoutHref = "/login",
  fallbackInitial = "S",
  fixedName,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { open, closeSidebar } = useSidebar();
  const { session } = useSession();
  const signOut = useLogout();
  const asideRef = useRef<HTMLElement>(null);

  const name = session.userName || fallbackName;
  const initial = fixedName ? fallbackInitial : session.userName ? initialsOf(session.userName)[0] : fallbackInitial;

  const isSuperAdmin = session.role === "admin" && (session.userEmail === "admin@lms.edu" || session.userEmail === "admin@learnsphere.com");

  const filteredItems = items.filter(item => {
    if (!item.permission) return true;
    if (session.role !== 'admin') return true;
    if (isSuperAdmin) return true;
    return session.permissions && session.permissions.includes(item.permission);
  });

  // Move focus into the drawer when it opens (mobile-sidebar.js did the same).
  useEffect(() => {
    if (open && window.innerWidth < 1024) asideRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
  }, [open]);

  // Focus trap while the drawer is open.
  function onKeyDown(e: React.KeyboardEvent<HTMLElement>) {
    if (e.key !== "Tab" || !open) return;
    const focusable = asideRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <>
      <aside
        ref={asideRef}
        id="sidebar"
        onKeyDown={onKeyDown}
        className={`fixed left-0 top-0 h-screen w-64 text-white flex flex-col transition-all duration-300 ease-in-out z-50 transform shadow-xl lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "linear-gradient(to bottom, #1a1a2e, #0f0f1e)" }}
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg flex items-center justify-center">
              <Icon name="graduation-cap" className="w-6 h-6" />
            </div>
            <span
              className="text-lg md:text-xl font-extrabold whitespace-nowrap transition-opacity duration-300 drop-shadow-lg"
              style={{ color: "#e94560" }}
            >
              Learning Sphere
            </span>
          </div>
        </div>

        {/* User */}
        <div className="p-4 border-b border-white/20 flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-semibold text-sm shrink-0">
            <span>{initial}</span>
          </div>
          <div className="transition-opacity duration-300 min-w-0">
            <p className="text-sm font-medium mb-0.5">
              👋 Hi,{" "}
              {fixedName ? fixedName : <span style={{ color: "white", fontWeight: "bold" }}>{name}</span>}
            </p>
            <p className="text-xs opacity-70">{tagline}</p>
          </div>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
          {filteredItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                aria-current={active ? "page" : undefined}
                className={`nav-item flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                  active ? "bg-white/20 text-white font-medium" : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon name={item.icon} className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium whitespace-nowrap transition-opacity duration-300">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/20 shrink-0">
          <button
            type="button"
            className="logout-btn w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 hover:-translate-y-0.5 text-white font-medium cursor-pointer"
            style={{ background: "#e94560" }}
            onClick={() => {
              closeSidebar();
              if (logoutMode === "signout") void signOut();
              else router.push(logoutHref);
            }}
          >
            <Icon name="log-out" className="w-4 h-4" />
            <span className="text-sm font-medium transition-opacity duration-300">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay (was injected by mobile-sidebar.js) */}
      <div
        id="sidebarOverlay"
        aria-hidden="true"
        onClick={closeSidebar}
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ease-in-out ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />
    </>
  );
}
