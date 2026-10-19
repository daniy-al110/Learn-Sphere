"use client";

import { BookOpen, Clock, Star, Users, ArrowRight, ShieldCheck, Check } from "lucide-react";

interface CoursePreviewProps {
  onPromptLogin?: () => void;
}

const COURSES = [
  {
    code: "CS-401",
    title: "Distributed Systems & Cloud Architecture",
    instructor: "Dr. Alexander Smith",
    credits: "4.0 Credits",
    level: "Advanced",
    enrolled: "142 Scholars",
    rating: "4.9",
    topics: ["Raft Consensus", "Microservices", "Event-Driven Queues"],
    badgeColor: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  },
  {
    code: "AI-302",
    title: "Deep Learning & Neural Networks",
    instructor: "Prof. Elena Rostova",
    credits: "4.0 Credits",
    level: "Intermediate",
    enrolled: "198 Scholars",
    rating: "4.8",
    topics: ["Transformers", "PyTorch", "Computer Vision"],
    badgeColor: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  },
  {
    code: "SEC-501",
    title: "Cybersecurity & Cryptographic Protocols",
    instructor: "Dr. Marcus Vance",
    credits: "3.5 Credits",
    level: "Specialist",
    enrolled: "115 Scholars",
    rating: "5.0",
    topics: ["Zero-Knowledge Proofs", "TLS 1.3", "Threat Modeling"],
    badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  },
  {
    code: "SWE-204",
    title: "Modern Full-Stack Web Architectures",
    instructor: "Prof. Sarah Jenkins",
    credits: "3.0 Credits",
    level: "Foundational",
    enrolled: "230 Scholars",
    rating: "4.9",
    topics: ["Next.js SSR", "PostgreSQL", "Tailwind CSS"],
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
];

export default function CoursePreview({ onPromptLogin }: CoursePreviewProps) {
  const handleEnrollClick = () => {
    if (onPromptLogin) {
      onPromptLogin();
    }
    const el = document.getElementById("auth-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="curriculum" className="py-24 relative overflow-hidden bg-slate-950/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-bold tracking-wider uppercase mb-4">
              <BookOpen className="w-3.5 h-3.5" />
              Academic Curriculum
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              Explore Active Academic Programs
            </h2>
            <p className="mt-4 text-slate-400 text-base">
              Interactive course rooms configured for live virtual lectures, timed quizzes, and automatic syllabus tracking.
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={handleEnrollClick}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-pink-400 hover:text-white bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 transition-all cursor-pointer"
            >
              <span>Sign In to Enroll</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {COURSES.map((course, idx) => (
            <div
              key={idx}
              className="rounded-3xl bg-slate-900/80 border border-white/10 p-6 flex flex-col justify-between hover:border-pink-500/40 transition-all duration-300 hover:-translate-y-1 shadow-xl hover:shadow-[0_15px_35px_rgba(233,69,96,0.15)] group"
            >
              <div>
                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${course.badgeColor}`}>
                    {course.code}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{course.rating}</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-pink-300 transition-colors line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">{course.instructor}</p>

                <div className="flex items-center gap-3 text-xs text-slate-400 my-4 py-2 border-y border-white/5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {course.credits}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {course.enrolled}
                  </span>
                </div>

                {/* Topics covered */}
                <div className="space-y-1.5 mb-6">
                  {course.topics.map((t, tIdx) => (
                    <div key={tIdx} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                      <Check className="w-3 h-3 text-pink-400 shrink-0" />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action */}
              <button
                type="button"
                onClick={handleEnrollClick}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-gradient-to-r hover:from-pink-500 hover:to-rose-600 transition-all flex items-center justify-center gap-2 cursor-pointer group-hover:shadow-md"
              >
                <span>Request Enrollment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
