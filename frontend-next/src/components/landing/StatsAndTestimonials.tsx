"use client";

import { Award, Star, Users, Activity, ShieldCheck, Quote } from "lucide-react";

const STATS = [
  {
    label: "Active Scholars",
    value: "25,480+",
    change: "+18% this semester",
    icon: Users,
    color: "text-pink-400",
  },
  {
    label: "Accredited Faculty",
    value: "1,240+",
    change: "Across 24 Departments",
    icon: Award,
    color: "text-indigo-400",
  },
  {
    label: "Platform Reliability",
    value: "99.98%",
    change: "Cloud SLA Guaranteed",
    icon: ShieldCheck,
    color: "text-emerald-400",
  },
  {
    label: "Global Query Speed",
    value: "< 35ms",
    change: "PostgreSQL edge-cached",
    icon: Activity,
    color: "text-cyan-400",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "LearnSphere eliminated hours of spreadsheet grading. The automated GPA ledger calculates weights seamlessly, and students receive real-time clarity on their marks.",
    name: "Dr. Alexander Smith",
    role: "Department Chair of Computer Science",
    avatar: "AS",
    rating: 5,
  },
  {
    quote:
      "The integrated Jitsi lecture halls and instant quiz submissions make distance learning feel smoother than in-person classes. Everything is in one portal.",
    name: "Ayesha Malik",
    role: "Senior Software Engineering Student",
    avatar: "AM",
    rating: 5,
  },
  {
    quote:
      "Automated credentialing with SMTP notifications saved our IT team hundreds of hours during semester registration. The Supabase integration is rock-solid.",
    name: "Daniyal Khan",
    role: "Lead Campus Systems Architect",
    avatar: "DK",
    rating: 5,
  },
];

export default function StatsAndTestimonials() {
  return (
    <section id="metrics" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Performance Metric Counters */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-24">
          {STATS.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:border-pink-500/30 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {stat.label}
                  </span>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <span>{stat.change}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Testimonials Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Trusted by Leaders in Higher Education
          </h2>
          <p className="mt-3 text-slate-400 text-base">
            Discover how students, professors, and systems architects experience LearnSphere daily.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className="p-8 rounded-3xl bg-slate-900/70 border border-white/10 backdrop-blur-xl flex flex-col justify-between relative hover:border-white/20 transition-all shadow-xl"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-5">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed italic mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-rose-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                  {t.avatar}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{t.name}</h4>
                  <p className="text-[11px] text-slate-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
