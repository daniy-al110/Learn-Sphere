"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const DESKTOP_BREAKPOINT = 1024; // Tailwind `lg`

interface SidebarCtx {
  open: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
}
const Ctx = createContext<SidebarCtx | null>(null);

export function useSidebar() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSidebar must be used inside <SidebarProvider>");
  return c;
}

/**
 * React port of mobile-sidebar.js: open/close state, Escape to close, close when
 * resizing up to desktop, and body-scroll lock while the drawer is open.
 * (Focus trapping / hamburger / overlay markup live in <Sidebar/> + <MobileMenuToggle/>.)
 */
export default function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openSidebar = useCallback(() => setOpen(true), []);
  const closeSidebar = useCallback(() => setOpen(false), []);
  const toggleSidebar = useCallback(() => setOpen((o) => !o), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => window.innerWidth >= DESKTOP_BREAKPOINT && setOpen(false), 100);
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const value = useMemo(() => ({ open, openSidebar, closeSidebar, toggleSidebar }), [open, openSidebar, closeSidebar, toggleSidebar]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
