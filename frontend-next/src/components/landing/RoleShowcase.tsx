"use client";

import { useState } from "react";
import {
  GraduationCap,
  BookOpen,
  Award,
  Video,
  FileText,
  Users,
  CheckCircle,
  Calendar,
  Clock,
  ShieldAlert,
  Database,
  ArrowRight,
  TrendingUp,
  Activity,
  UserPlus,
  Send,
  Zap,
} from "lucide-react";

interface RoleShowcaseProps {
  onSelectRoleDemo?: (role: "student" | "teacher" | "admin") => void;
}

export default function RoleShowcase({ onSelectRoleDemo }: RoleShowcaseProps) {
  const [activeTab, setActiveTab] = useState<"student" | "teacher" | "admin">("student");

  const handleRoleAction = (role: "student" | "teacher" | "admin") => {
    if (onSelectRoleDemo) {
      onSelectRoleDemo(role);
    }
    const el = document.getElementById("auth-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="roles" className="py-24 relative overflow-hidden">
      {/* Background radial atmosphere */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-bold tracking-wider uppercase mb-4">
            <Zap className="w-3.5 h-3.5" />
            Tailored Experiences
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            One Unified Campus.{" "}
            <span className="bg-gradient-to-r from-pink-400 via-rose-400 to-indigo-400 bg-clip-text text-transparent">
              Three Dedicated Workspaces.
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400">
            LearnSphere provides purpose-built interfaces designed specifically for students, professors, and academic administrators.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-900/90 border border-white/10 backdrop-blur-xl shadow-xl">
            <button
              type="button"
              onClick={() => setActiveTab("student")}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === "student"
                  ? "bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student Hub</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("teacher")}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === "teacher"
                  ? "bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Faculty Studio</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("admin")}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === "admin"
                  ? "bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Admin Console</span>
            </button>
          </div>
        </div>

        {/* Tab Content Display */}
        <div className="bg-slate-900/70 border border-white/10 rounded-3xl p-6 sm:p-10 backdrop-blur-2xl shadow-2xl relative">
          {activeTab === "student" && (
            <div className="grid lg:grid-cols-12 gap-8 items-center animate-in fade-in duration-300">
              <div className="lg:col-span-5 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-semibold border border-cyan-500/20">
                  <GraduationCap className="w-4 h-4" />
                  Academic Excellence Engine
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Effortless Learning, Real-Time Progress & Instant Collaboration
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Students access an intuitive hub showing their complete academic standing, live lecture links via Jitsi, instant quiz results, and digital assignment submission dropboxes.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Real-time GPA calculator and dynamic course transcripts</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>1-Click Join encrypted virtual lecture rooms without installations</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Transparent attendance percentage tracker & eligibility alerts</span>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => handleRoleAction("student")}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
                  >
                    <span>Log In to Student Hub</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Interactive Mock Preview Card */}
              <div className="lg:col-span-7 bg-slate-950/80 rounded-2xl border border-white/10 p-5 sm:p-7 shadow-inner space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm">
                      KS
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Khalid Student</div>
                      <div className="text-xs text-slate-400 font-mono">khalid456@student.lms.edu</div>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                    GPA: 3.89 / 4.00
                  </div>
                </div>

                {/* Course Cards Grid Mock */}
                <div className="grid sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-white/5 space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-white">CS-401 Distributed Systems</span>
                      <span className="text-[10px] bg-pink-500/20 text-pink-400 px-2 py-0.5 rounded font-mono">
                        94% Attn
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">Dr. Smith • Mon/Wed 10:00 AM</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-emerald-400 font-semibold">Grade: A</span>
                      <span className="text-[11px] text-cyan-400 flex items-center gap-1">
                        <Video className="w-3 h-3" /> Live Room Open
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-white/5 space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-white">AI-302 Deep Learning</span>
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-mono">
                        91% Attn
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">Prof. Elena • Tue/Thu 02:00 PM</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-emerald-400 font-semibold">Grade: A-</span>
                      <span className="text-[11px] text-amber-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Quiz in 2h
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Activity Row */}
                <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-pink-300 font-medium">
                    <Clock className="w-4 h-4 text-pink-400" />
                    <span>Next Assignment: Microservice Architecture Diagram due Friday</span>
                  </div>
                  <span className="text-white font-bold underline cursor-pointer">Submit →</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "teacher" && (
            <div className="grid lg:grid-cols-12 gap-8 items-center animate-in fade-in duration-300">
              <div className="lg:col-span-5 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
                  <Users className="w-4 h-4" />
                  Educator Command Hub
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Automated Grading, Instant Roll-Call & Intelligent Course Delivery
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Professors eliminate hours of administrative drag with automated grading ledgers, 1-click attendance marking, dynamic quiz builders, and student feedback insights.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>1-Click bulk roll call marking with immediate student notification</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Centralized marks ledger calculating weighted scores automatically</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Timed online quiz creator with randomized question order</span>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => handleRoleAction("teacher")}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
                  >
                    <span>Log In to Faculty Studio</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Interactive Mock Preview Card */}
              <div className="lg:col-span-7 bg-slate-950/80 rounded-2xl border border-white/10 p-5 sm:p-7 shadow-inner space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                      DS
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Dr. Smith, Professor</div>
                      <div className="text-xs text-slate-400 font-mono">smith789@lms.edu</div>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold">
                    Faculty Score: 4.9 ★
                  </div>
                </div>

                {/* Quick Roll Call Demo */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white">Today&apos;s Lecture Attendance (CS-401)</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">42 / 45 Present</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-800/80">
                      <span className="text-slate-200">Khalid Student</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                        PRESENT
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-800/80">
                      <span className="text-slate-200">Sarah Jenkins</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                        PRESENT
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-800/80">
                      <span className="text-slate-200">Michael Ross</span>
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold">
                        ABSENT
                      </span>
                    </div>
                  </div>
                </div>

                {/* Gradebook status row */}
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                  <span className="text-emerald-300 font-medium">Midterm Marks Ledger: 100% Calculated</span>
                  <span className="text-white font-bold underline cursor-pointer">Export PDF →</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "admin" && (
            <div className="grid lg:grid-cols-12 gap-8 items-center animate-in fade-in duration-300">
              <div className="lg:col-span-5 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-pink-500/10 text-pink-400 text-xs font-semibold border border-pink-500/20">
                  <Activity className="w-4 h-4" />
                  Campus Mission Control
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Automated Credentialing, Supabase Sync & Campus Governance
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Admins maintain sovereign control over university records, enrollment authorizations, fee challan reconciliations, teacher assignments, and cloud database persistence.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Instant auto-generation of bcrypt credentials dispatched via SMTP</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Real-time Supabase PostgreSQL synchronization with cloud backups</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>One-click course registration approval and fee clearance verification</span>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => handleRoleAction("admin")}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-lg shadow-pink-500/25 transition-all cursor-pointer"
                  >
                    <span>Log In to Admin Command</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Interactive Mock Preview Card */}
              <div className="lg:col-span-7 bg-slate-950/80 rounded-2xl border border-white/10 p-5 sm:p-7 shadow-inner space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-sm">
                      DY
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Daniyal (SuperAdmin)</div>
                      <div className="text-xs text-slate-400 font-mono">daniyal@learnsphere.com</div>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                    System Health: 100%
                  </div>
                </div>

                {/* System Metrics Overview */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-900 border border-white/5 text-center">
                    <div className="text-xs text-slate-400">Total Students</div>
                    <div className="text-base font-bold text-white mt-1">2,410</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-white/5 text-center">
                    <div className="text-xs text-slate-400">Faculty Staff</div>
                    <div className="text-base font-bold text-white mt-1">128</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-white/5 text-center">
                    <div className="text-xs text-slate-400">Supabase Latency</div>
                    <div className="text-base font-bold text-emerald-400 mt-1">19ms</div>
                  </div>
                </div>

                {/* Enrollment Approval Queue */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-white/5 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-white">
                    <span>Pending Enrollment Approvals</span>
                    <span className="text-amber-400 text-[11px]">3 Awaiting Verification</span>
                  </div>
                  <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-800/80">
                    <div>
                      <div className="font-semibold text-white">Alex Zhang — Distributed Systems</div>
                      <div className="text-[10px] text-slate-400">Challan #8841 • Paid $1,200</div>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-pink-500 text-white font-bold text-[10px] cursor-pointer hover:bg-pink-600">
                      Approve
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-between text-xs text-pink-300">
                  <span>Automated Credential Engine: Active & Dispatching</span>
                  <span className="font-bold underline cursor-pointer">View Audit Logs →</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
