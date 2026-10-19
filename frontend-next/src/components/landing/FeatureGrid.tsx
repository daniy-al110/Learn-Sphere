"use client";

import {
  Video,
  BarChart2,
  FileCheck2,
  CalendarCheck2,
  Database,
  MailCheck,
  Sparkles,
  ShieldCheck,
  Zap,
  Layers,
} from "lucide-react";

const FEATURES = [
  {
    icon: Video,
    color: "from-pink-500 to-rose-600",
    glow: "rgba(233, 69, 96, 0.25)",
    tag: "Real-Time WebRTC",
    title: "Integrated Virtual Classrooms",
    description:
      "Native Jitsi-powered encrypted video meeting halls. Conduct interactive lectures, screen sharing, and group breakout rooms with zero plugin downloads or external licenses.",
  },
  {
    icon: BarChart2,
    color: "from-indigo-500 to-purple-600",
    glow: "rgba(99, 102, 241, 0.25)",
    tag: "Zero-Latency Ledger",
    title: "Automated GPA & Gradebook",
    description:
      "Real-time weighted score calculation across assignments, quizzes, midterms, and final exams. Auto-generates academic transcripts with 4.00-scale GPA instantly.",
  },
  {
    icon: FileCheck2,
    color: "from-cyan-500 to-blue-600",
    glow: "rgba(6, 182, 212, 0.25)",
    tag: "Assessment Engine",
    title: "Interactive Timed Quizzes",
    description:
      "Dynamic questionnaire builder with randomized questions, automatic timer enforcement, and instantaneous marks evaluation upon submission.",
  },
  {
    icon: CalendarCheck2,
    color: "from-emerald-500 to-teal-600",
    glow: "rgba(16, 185, 129, 0.25)",
    tag: "Campus Governance",
    title: "Smart Attendance Tracking",
    description:
      "1-Click daily lesson roll call with automatic student percentage computation and exam eligibility alerts when falling below university thresholds.",
  },
  {
    icon: Database,
    color: "from-amber-500 to-orange-600",
    glow: "rgba(245, 158, 11, 0.25)",
    tag: "PostgreSQL Cloud",
    title: "High-Availability Supabase Core",
    description:
      "Enterprise-grade cloud persistence with sub-50ms query responses, strict Row-Level Security, automated backups, and complete relational integrity.",
  },
  {
    icon: MailCheck,
    color: "from-rose-500 to-pink-600",
    glow: "rgba(244, 63, 94, 0.25)",
    tag: "Automated Dispatch",
    title: "Instant Credential Provisioning",
    description:
      "Integrated Nodemailer and Handlebars templates automatically dispatch encrypted institutional logins and self-service password resets directly to personal inboxes.",
  },
];

export default function FeatureGrid() {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      {/* Background radial accent */}
      <div className="absolute top-1/3 -right-20 w-96 h-96 bg-pink-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 -left-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-bold tracking-wider uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Cutting-Edge Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Engineered for Academic Precision & Speed
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400">
            Every component is crafted to eliminate operational overhead and empower instructors to focus on world-class teaching.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {FEATURES.map((feature, idx) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={idx}
                className="group relative p-8 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-white/20 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
                style={{
                  boxShadow: `0 10px 30px -15px ${feature.glow}`,
                }}
              >
                {/* Glowing border highlight on hover */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div className="relative z-10 space-y-4">
                  {/* Icon & Tag */}
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} p-0.5 shadow-md flex items-center justify-center text-white`}
                    >
                      <div className="w-full h-full bg-slate-950/80 rounded-[14px] flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-800 border border-white/10 text-slate-300">
                      {feature.tag}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-white group-hover:text-pink-300 transition-colors">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
