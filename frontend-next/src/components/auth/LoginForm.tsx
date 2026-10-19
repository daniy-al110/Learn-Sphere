"use client";

import Link from "next/link";
import { GraduationCap, ArrowLeft } from "lucide-react";
import UltraAuthCard from "./UltraAuthCard";

export default function LoginForm() {
  return (
    <div className="min-h-screen bg-[#0b0e17] text-white flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden">
      {/* Radiant ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Bar with Back to Landing Page */}
      <header className="max-w-7xl w-full mx-auto flex items-center justify-between pt-2">
        <Link
          href="/"
          className="flex items-center gap-2 group text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Landing Page</span>
        </Link>
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-md">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="text-base font-extrabold text-white">LearnSphere</span>
        </Link>
      </header>

      {/* Centered Ultra Auth Card */}
      <main className="flex-1 flex items-center justify-center py-10">
        <UltraAuthCard embedded={false} />
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 pb-2">
        LearnSphere LMS Cloud • Secure Institutional Single Sign-On
      </footer>
    </div>
  );
}
