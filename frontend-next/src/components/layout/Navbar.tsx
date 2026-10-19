"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "./icons";
import { useSidebar } from "./SidebarProvider";
import { useLogout } from "./LogoutButton";
import { useSession } from "@/hooks/useSession";
import { initialsOf } from "@/lib/student/helpers";
import { toast } from "@/lib/toast-store";
import { Moon, Sun, Bell, Shield, KeyRound, LogOut, CheckCircle } from "lucide-react";

interface NavbarProps {
  welcomeLabel: string;
  fallbackName: string;
  changePasswordHref: string;
  notifications?: boolean;
  fixedName?: string;
  fixedInitials?: string;
  compactPadding?: boolean;
}

export default function Navbar({
  welcomeLabel,
  fallbackName,
  changePasswordHref,
  notifications = true,
  fixedName,
  fixedInitials,
  compactPadding = false,
}: NavbarProps) {
  const { open, toggleSidebar } = useSidebar();
  const { session } = useSession();
  const logout = useLogout();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const name = fixedName ?? (session.userName || fallbackName);

  // Initialize and track theme state
  useEffect(() => {
    const isCurrentlyDark =
      document.documentElement.classList.contains("dark") ||
      localStorage.getItem("theme") === "dark";
    setIsDark(isCurrentlyDark);
    if (isCurrentlyDark) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      toast.info("Switched to Ultra Dark theme");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      toast.info("Switched to Light theme");
    }
  };

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [menuOpen]);

  return (
    <header
      className={`h-16 border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#0c0f1d]/80 backdrop-blur-xl flex items-center justify-between ${
        compactPadding ? "px-4 lg:px-8" : "px-6 lg:px-8"
      } shrink-0 relative transition-colors duration-200 z-30`}
    >
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          id="mobileMenuToggle"
          aria-label="Open navigation menu"
          aria-expanded={open}
          aria-controls="sidebar"
          onClick={(e) => {
            e.stopPropagation();
            toggleSidebar();
          }}
          className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 focus:outline-none transition-colors duration-200 shrink-0 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* LMS System Beacon Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>LMS Cloud</span>
        </div>

        {/* Welcome Pill */}
        <div className="hidden sm:flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5">
          {welcomeLabel}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Dynamic Dark / Light Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle Theme Mode"
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer focus:outline-none"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Notification Bell */}
        <button
          type="button"
          onClick={notifications ? () => toast.info("You are up to date! No unread notifications.") : undefined}
          className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors focus:outline-none cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {notifications && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
          )}
        </button>

        {/* User Profile Dropdown Host */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            id="profileDropdownBtn"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((m) => !m);
            }}
            className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 to-indigo-600 border border-white/20 flex items-center justify-center font-bold text-white shadow-md hover:scale-105 transition-all text-xs focus:outline-none cursor-pointer"
          >
            {fixedInitials ?? initialsOf(name)}
          </button>

          {/* Elevated Floating Dropdown */}
          <div
            id="profileDropdown"
            className={`${
              menuOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
            } absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 p-2 z-50 transition-all duration-150 origin-top-right`}
          >
            <div className="p-3 border-b border-gray-100 dark:border-white/10 mb-1">
              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{name}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-pink-500 font-semibold uppercase tracking-wider">
                  {session.role || "Authenticated"}
                </span>
              </div>
            </div>

            <Link
              href={changePasswordHref}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 dark:text-slate-300 hover:text-pink-600 dark:hover:text-white hover:bg-pink-50 dark:hover:bg-white/5 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-pink-400" />
              <span>Change Password</span>
            </Link>

            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer mt-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
