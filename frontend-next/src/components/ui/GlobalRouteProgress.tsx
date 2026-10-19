"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function GlobalRouteProgress() {
  const pathname = usePathname();
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    // When pathname changes, briefly trigger and finish the progress animation
    setNavigating(true);
    const timer = setTimeout(() => {
      setNavigating(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [pathname]);

  if (!navigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
      <div className="h-[3px] w-full bg-slate-900/40 overflow-hidden relative">
        <div className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-500 animate-[progress_0.6s_ease-out_forwards] shadow-[0_0_12px_rgba(233,69,96,0.9)]" />
      </div>
    </div>
  );
}
