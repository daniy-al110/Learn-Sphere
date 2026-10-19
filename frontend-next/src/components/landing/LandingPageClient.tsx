"use client";

import { useState } from "react";
import LandingNavbar from "./LandingNavbar";
import UltraAuthCard from "../auth/UltraAuthCard";
import RoleShowcase from "./RoleShowcase";
import FeatureGrid from "./FeatureGrid";
import CoursePreview from "./CoursePreview";
import StatsAndTestimonials from "./StatsAndTestimonials";
import FaqAccordion from "./FaqAccordion";
import LandingFooter from "./LandingFooter";
import {
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  GraduationCap,
  Users,
  Video,
  Database,
  CheckCircle2,
} from "lucide-react";

export default function LandingPageClient() {
  const [selectedDemoRole, setSelectedDemoRole] = useState<"student" | "teacher" | "admin">("admin");

  const handleRoleSelect = (role: "student" | "teacher" | "admin") => {
    setSelectedDemoRole(role);
  };

  const scrollToAuth = () => {
    const el = document.getElementById("auth-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToRoles = () => {
    const el = document.getElementById("roles");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e17] text-white selection:bg-pink-500 selection:text-white font-sans relative overflow-x-hidden">
      {/* Radiant ambient mesh gradient background */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-pink-600/15 rounded-full blur-[150px]" />
        <div className="absolute top-1/4 -right-40 w-[650px] h-[650px] bg-indigo-600/15 rounded-full blur-[160px]" />
        <div className="absolute top-2/3 left-1/3 w-[550px] h-[550px] bg-cyan-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-10 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-[150px]" />
        {/* Subtle dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      {/* Sticky frosted Navbar */}
      <LandingNavbar />

      <main>
        {/* HERO SECTION */}
        <section className="pt-32 pb-20 md:pt-40 md:pb-28 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Column: Compelling Hook & Value Proposition */}
              <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
                {/* Pill Status Badge */}
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/90 border border-white/10 shadow-inner backdrop-blur-xl">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-xs font-semibold text-slate-300">
                    Spring 2026 Academic Cloud Release
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 text-white uppercase tracking-wider">
                    v2.4
                  </span>
                </div>

                {/* Main Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
                  Where Campus Intelligence Meets{" "}
                  <span className="bg-gradient-to-r from-pink-400 via-rose-400 to-indigo-400 bg-clip-text text-transparent">
                    Effortless Academic Success.
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                  The unified, high-performance learning operating system connecting students, professors, and university leadership in real time. Experience automated GPA calculations, instantaneous WebRTC virtual lecture halls, and cloud-backed institutional security.
                </p>

                {/* Feature Value Highlights */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 max-w-xl mx-auto lg:mx-0 text-left">
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-xs font-bold text-pink-400">
                      <Zap className="w-4 h-4" />
                      <span>Zero-Lag Ledger</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">Instant GPA Calculation</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                      <Video className="w-4 h-4" />
                      <span>WebRTC Jitsi</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">1-Click HD Lecture Rooms</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 backdrop-blur-sm col-span-2 sm:col-span-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                      <Database className="w-4 h-4" />
                      <span>Supabase Core</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">PostgreSQL Cloud Sync</div>
                  </div>
                </div>

                {/* Call-to-action buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                  <button
                    type="button"
                    onClick={scrollToAuth}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:to-rose-600 shadow-[0_10px_35px_rgba(233,69,96,0.4)] hover:shadow-[0_12px_45px_rgba(233,69,96,0.6)] transition-all cursor-pointer active:scale-95"
                  >
                    <span>Log In to Your Workspace</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={scrollToRoles}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-white/10 transition-all cursor-pointer"
                  >
                    <span>Explore Role Portals</span>
                  </button>
                </div>

                {/* Social Proof Metric Line */}
                <div className="pt-3 flex items-center justify-center lg:justify-start gap-4 text-xs text-slate-400">
                  <div className="flex -space-x-2">
                    <div className="w-7 h-7 rounded-full bg-pink-500 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white">
                      DK
                    </div>
                    <div className="w-7 h-7 rounded-full bg-indigo-500 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white">
                      AS
                    </div>
                    <div className="w-7 h-7 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white">
                      KS
                    </div>
                  </div>
                  <span>
                    Trusted by <strong className="text-white">25,000+ scholars</strong> & faculty across 24 departments.
                  </span>
                </div>
              </div>

              {/* Right Column: The Integrated Hero Auth Card */}
              <div className="lg:col-span-5 flex justify-center lg:justify-end">
                <UltraAuthCard
                  embedded={true}
                  initialRole={selectedDemoRole}
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: Role Ecosystem (Student, Teacher, Admin) */}
        <RoleShowcase onSelectRoleDemo={handleRoleSelect} />

        {/* SECTION: Architectural Capabilities Grid */}
        <FeatureGrid />

        {/* SECTION: Active Academic Curriculum */}
        <CoursePreview onPromptLogin={scrollToAuth} />

        {/* SECTION: Metrics & Testimonials */}
        <StatsAndTestimonials />

        {/* SECTION: FAQ Accordion */}
        <FaqAccordion />

        {/* CALL TO ACTION BANNER */}
        <section className="py-20 relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl bg-gradient-to-r from-pink-600/30 via-rose-600/20 to-indigo-600/30 border border-white/15 p-8 sm:p-14 text-center backdrop-blur-2xl shadow-2xl overflow-hidden">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                Step into the Next Generation of Campus Learning
              </h2>
              <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
                Join thousands of students and faculty members who have upgraded their academic workflow with LearnSphere.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={scrollToAuth}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:to-rose-600 shadow-[0_10px_35px_rgba(233,69,96,0.5)] transition-all cursor-pointer active:scale-95"
                >
                  <span>Sign In to Access Your Portal</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Instant Automatic Role Detection
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Self-Service Password Reset
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Modern Footer */}
      <LandingFooter />
    </div>
  );
}
