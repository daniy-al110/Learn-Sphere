"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "./icons";
import { useSidebar } from "./SidebarProvider";
import { useLogout } from "./LogoutButton";
import { useSession } from "@/hooks/useSession";
import { initialsOf } from "@/lib/student/helpers";
import { toast } from "@/lib/toast-store";

interface NavbarProps {
  /** Text of the second header pill ("Welcome Student"). */
  welcomeLabel: string;
  fallbackName: string;
  changePasswordHref: string;
  /** Student header shows a red dot and a toast on click; staff headers have a plain bell. */
  notifications?: boolean;
  /** Fixed display name + initials (the admin header was static: "Admin User" / "AU"). */
  fixedName?: string;
  fixedInitials?: string;
  /** Admin header/main used tighter padding on small screens. */
  compactPadding?: boolean;
}

/** Top bar: hamburger (mobile), LMS/welcome pills, notification bell and profile dropdown. */
export default function Navbar({ welcomeLabel, fallbackName, changePasswordHref, notifications = true, fixedName, fixedInitials, compactPadding = false }: NavbarProps) {
  const { open, toggleSidebar } = useSidebar();
  const { session } = useSession();
  const logout = useLogout();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const name = fixedName ?? (session.userName || fallbackName);

  // clicking anywhere else closes the dropdown (the old page did this on document click)
  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [menuOpen]);

  return (
    <header className={`h-16 border-b border-gray-200 bg-white flex items-center justify-between ${compactPadding ? "px-4 lg:px-8" : "px-8"} shrink-0 relative`}>
      <div className="flex items-center gap-3">
        {/* Hamburger (was injected by mobile-sidebar.js) */}
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
          className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-pink-400 transition-colors duration-200 shrink-0 cursor-pointer"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ color: "#e94560", backgroundColor: "#fff0f2" }}
        >
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          LMS
        </div>
        <div
          className="px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ color: "#e94560", backgroundColor: "#fff0f2" }}
        >
          {welcomeLabel}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={notifications ? () => toast.info("You have no new notifications at this time.") : undefined}
          className="text-gray-500 hover:text-gray-700 relative p-1 rounded-full hover:bg-gray-100 transition focus:outline-hidden cursor-pointer"
          aria-label="Notifications"
        >
          <Icon name="bell" className="w-5 h-5" />
          {notifications && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-accent rounded-full border border-white" />}
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            id="profileDropdownBtn"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((m) => !m);
            }}
            className="w-10 h-10 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center font-bold text-gray-700 hover:bg-gray-300 transition duration-200 text-sm focus:outline-hidden cursor-pointer"
          >
            {fixedInitials ?? initialsOf(name)}
          </button>
          <div
            id="profileDropdown"
            className={`${menuOpen ? "" : "hidden"} absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50`}
          >
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-bold text-gray-900">{name}</p>
            </div>
            <Link
              href={changePasswordHref}
              onClick={() => setMenuOpen(false)}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
            >
              Change Password
            </Link>
            <button
              type="button"
              onClick={logout}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
