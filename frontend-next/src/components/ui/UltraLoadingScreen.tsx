"use client";

import { GraduationCap, Sparkles } from "lucide-react";

interface UltraLoadingScreenProps {
  label?: string;
  sublabel?: string;
  fullScreen?: boolean;
}

export default function UltraLoadingScreen({
  label = "Accessing Academic Workspace...",
  sublabel = "Syncing PostgreSQL cloud ledger • 256-bit TLS Encrypted",
  fullScreen = true,
}: UltraLoadingScreenProps) {
  return (
    <div
      className={`${
        fullScreen
          ? "fixed inset-0 z-50 bg-[#0b0e17] flex items-center justify-center p-6"
          : "w-full min-h-[360px] flex items-center justify-center p-6"
      } text-white font-sans overflow-hidden`}
    >
      {/* Ambient glowing radial orbs in background */}
      <div className="absolute w-80 h-80 bg-pink-600/15 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute w-80 h-80 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none animate-pulse delay-700" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm space-y-5 animate-in fade-in zoom-in-95 duration-300">
        {/* Pulsing Emblem with Orbit Ring */}
        <div className="relative">
          {/* Outer glowing orbital ripple */}
          <div className="absolute -inset-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 opacity-20 blur-md animate-ping duration-1000" />

          {/* Central Logo Box */}
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-indigo-600 p-0.5 shadow-[0_0_35px_rgba(233,69,96,0.4)]">
            <div className="w-full h-full bg-[#0d111f] rounded-[14px] flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-pink-400 animate-bounce duration-1000" />
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[11px] font-bold tracking-wider uppercase mb-1">
            <Sparkles className="w-3 h-3 animate-spin" />
            <span>LearnSphere LMS</span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
            {label}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            {sublabel}
          </p>
        </div>

        {/* High-Tech Shimmer Progress Bar */}
        <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden relative shadow-inner">
          <div className="absolute top-0 bottom-0 left-0 right-0 bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-500 animate-[progress_1.4s_ease-in-out_infinite] rounded-full shadow-[0_0_10px_rgba(233,69,96,0.8)]" />
        </div>
      </div>
    </div>
  );
}
