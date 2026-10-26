"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GraduationCap, ArrowRight, Menu, X, Sparkles, Shield, User } from "lucide-react";

interface LandingNavbarProps {
  onStartClass?: () => void;
}

export default function LandingNavbar({ onStartClass }: LandingNavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-slate-950/80 backdrop-blur-xl border-b border-white/10 shadow-lg py-3.5"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-600 p-0.5 shadow-md shadow-pink-500/25 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-pink-400 group-hover:text-pink-300 transition-colors" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold text-white tracking-tight">LearnSphere</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-400 border border-pink-500/30">
                  LMS
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-wider uppercase font-medium">
                Academic Cloud System
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-7">
            <button
              type="button"
              onClick={() => scrollToSection("features")}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("roles")}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Role Portals
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("curriculum")}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Courses
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("pricing")}
              className="text-sm font-medium text-slate-300 hover:text-pink-400 transition-colors cursor-pointer"
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("metrics")}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Performance
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("faq")}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              FAQ
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {onStartClass && (
              <button
                type="button"
                onClick={onStartClass}
                className="relative inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-pink-300 hover:text-white bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-pink-400" />
                <span>Create Class Free</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => scrollToSection("auth-section")}
              className="relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:to-rose-600 shadow-[0_4px_20px_rgba(233,69,96,0.35)] hover:shadow-[0_6px_25px_rgba(233,69,96,0.5)] transition-all cursor-pointer active:scale-95"
            >
              <User className="w-4 h-4" />
              <span>Log In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950/95 backdrop-blur-2xl border-b border-white/10 px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-4 duration-200">
          <button
            type="button"
            onClick={() => scrollToSection("features")}
            className="block w-full text-left py-2 text-base font-medium text-slate-300 hover:text-white"
          >
            Features
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("roles")}
            className="block w-full text-left py-2 text-base font-medium text-slate-300 hover:text-white"
          >
            Role Portals
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("curriculum")}
            className="block w-full text-left py-2 text-base font-medium text-slate-300 hover:text-white"
          >
            Courses
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("pricing")}
            className="block w-full text-left py-2 text-base font-medium text-slate-300 hover:text-white"
          >
            Pricing
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("metrics")}
            className="block w-full text-left py-2 text-base font-medium text-slate-300 hover:text-white"
          >
            Performance
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("faq")}
            className="block w-full text-left py-2 text-base font-medium text-slate-300 hover:text-white"
          >
            FAQ
          </button>
          <div className="pt-2 space-y-2">
            {onStartClass && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onStartClass();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-pink-300 bg-pink-500/10 border border-pink-500/30 shadow-md"
              >
                <Sparkles className="w-4 h-4 text-pink-400" />
                <span>Create Class Free</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => scrollToSection("auth-section")}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-pink-500 to-rose-600 shadow-md"
            >
              <span>Log In to Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
