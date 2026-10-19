"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon, type IconName } from "./icons";
import { useSidebar } from "./SidebarProvider";
import { initialsOf } from "@/lib/student/helpers";
import { useSession } from "@/hooks/useSession";
import { useLogout } from "./LogoutButton";
import { GraduationCap, LogOut, Sparkles } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  permission?: string;
}

interface SidebarProps {
  items: NavItem[];
  fallbackName: string;
  tagline?: string;
  logoutMode?: "navigate" | "signout";
  logoutHref?: string;
  fallbackInitial?: string;
  fixedName?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

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
  const initial = fixedName
    ? fallbackInitial
    : session.userName
      ? initialsOf(session.userName)[0]
      : fallbackInitial;

  const isSuperAdmin =
    session.role === "admin" &&
    Array.isArray(session.permissions) &&
    session.permissions.includes("MANAGE_ADMINS") &&
    session.permissions.includes("MANAGE_ROLES");

  const filteredItems = items.filter((item) => {
    if (!item.permission) return true;
    if (session.role !== "admin") return true;
    return isSuperAdmin || (session.permissions && session.permissions.includes(item.permission));
  });

  useEffect(() => {
    if (open && window.innerWidth < 1024)
      asideRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
  }, [open]);

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

  const roleLabel =
    session.role === "admin"
      ? isSuperAdmin
        ? "SUPER ADMIN"
        : "ADMINISTRATOR"
      : session.role === "teacher"
        ? "FACULTY INSTRUCTOR"
        : "STUDENT SCHOLAR";

  return (
    <>
      <aside
        ref={asideRef}
        id="sidebar"
        onKeyDown={onKeyDown}
        className={`fixed left-0 top-0 h-screen w-64 bg-[#0d111f] border-r border-white/10 text-white flex flex-col transition-all duration-300 ease-in-out z-50 transform shadow-2xl lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-600 p-0.5 shadow-md shadow-pink-500/25 group-hover:scale-105 transition-transform flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-pink-400 group-hover:text-pink-300 transition-colors" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold text-white tracking-tight">
                  LearnSphere
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-400 border border-pink-500/30">
                  LMS
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-wider uppercase font-mono font-medium">
                Campus Portal
              </p>
            </div>
          </Link>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
              <span>{initial}</span>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0d111f]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-white truncate">
                {fixedName ? fixedName : name}
              </p>
            </div>
            <span className="text-[9px] font-bold text-pink-400 tracking-wider uppercase block truncate">
              {roleLabel}
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-2 flex flex-col gap-1 overflow-y-auto scrollbar-thin">
          {filteredItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                aria-current={active ? "page" : undefined}
                className={`nav-item group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${active
                    ? "bg-gradient-to-r from-pink-500/20 via-pink-500/10 to-transparent text-white border-l-4 border-pink-500 shadow-sm shadow-pink-500/10 font-bold"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
              >
                <div
                  className={`p-1 rounded-lg transition-colors ${active
                      ? "text-pink-400"
                      : "text-slate-400 group-hover:text-pink-300"
                    }`}
                >
                  <Icon name={item.icon} className="w-4 h-4 shrink-0" />
                </div>
                <span className="truncate">{item.label}</span>
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-pink-400 shadow-[0_0_8px_rgba(233,69,96,0.8)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout Footer */}
        <div className="p-3 border-t border-white/10 shrink-0">
          <button
            type="button"
            className="logout-btn w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-pink-500/90 to-rose-600/90 hover:from-pink-600 hover:to-rose-600 shadow-md shadow-pink-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            onClick={() => {
              closeSidebar();
              if (logoutMode === "signout") void signOut();
              else router.push(logoutHref);
            }}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Backdrop Overlay */}
      <div
        id="sidebarOverlay"
        aria-hidden="true"
        onClick={closeSidebar}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ease-in-out ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
      />
    </>
  );
}
