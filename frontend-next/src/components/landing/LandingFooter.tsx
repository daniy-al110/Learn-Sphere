"use client";

import Link from "next/link";
import { GraduationCap, ShieldCheck, Heart, ArrowUp } from "lucide-react";

export default function LandingFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="border-t border-white/10 bg-slate-950/80 backdrop-blur-2xl py-14 relative z-10 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-md">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">LearnSphere</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pink-500/20 text-pink-400 border border-pink-500/30">
                Enterprise LMS
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
              The next-generation academic cloud platform connecting students, faculty, and administrative leadership in real time with high-availability PostgreSQL infrastructure.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All Systems Operational • Supabase PostgreSQL Cloud Connected</span>
            </div>
          </div>

          {/* Quick Portals */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Access Portals
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/login" className="hover:text-pink-400 transition-colors">
                  Unified Sign In
                </Link>
              </li>
              <li>
                <Link href="/student/landing" className="hover:text-pink-400 transition-colors">
                  Student Learning Hub
                </Link>
              </li>
              <li>
                <Link href="/teacher/dashboard" className="hover:text-pink-400 transition-colors">
                  Faculty Grading Studio
                </Link>
              </li>
              <li>
                <Link href="/admin/dashboard" className="hover:text-pink-400 transition-colors">
                  Administrator Console
                </Link>
              </li>
            </ul>
          </div>

          {/* Institutional Security & KRAD TECH Support */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Governance & Support
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>256-Bit TLS Encryption</span>
              </li>
              <li>Automated SMTP Reset</li>
              <li>WebRTC Jitsi Telepresence</li>
              <li className="pt-1">
                <span className="text-[11px] text-slate-500 block uppercase font-bold tracking-wider">Official Inquiries & Support</span>
                <a
                  href="mailto:kradtech4@gmail.com"
                  className="text-pink-400 hover:text-pink-300 font-semibold transition-colors flex items-center gap-1.5 mt-0.5"
                >
                  <span>kradtech4@gmail.com</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: KRAD TECH Signature */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <span>© {new Date().getFullYear()} LearnSphere LMS. All rights reserved.</span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="inline-flex items-center gap-1.5 text-slate-300">
              A Product of <strong className="text-white font-black tracking-wide bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">KRAD TECH</strong>
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="mailto:kradtech4@gmail.com"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Contact Support: kradtech4@gmail.com
            </a>
            <button
              type="button"
              onClick={scrollToTop}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
