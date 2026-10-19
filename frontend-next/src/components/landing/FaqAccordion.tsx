"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const FAQS = [
  {
    q: "How does the Unified Automatic Role Detection Login work?",
    a: "You no longer need to remember or manually select a role. Our backend parses your institutional email pattern (@student.lms.edu for students, @lms.edu for faculty, and admin accounts) or cross-references the secure PostgreSQL database, routing you automatically to your designated role dashboard.",
  },
  {
    q: "How do students and faculty receive their initial credentials?",
    a: "When an administrator provisions an account, our auto-credential engine creates an institutional identity, hashes a temporary password via bcrypt, and securely dispatches it directly to the user's personal email address via our automated SMTP service.",
  },
  {
    q: "What if I forget my password or cannot access my account?",
    a: "Simply click 'Forgot Password?' on the login card. Provide your institutional email alongside your verified personal email. The system validates ownership and instantly delivers a new temporary login password to your personal inbox.",
  },
  {
    q: "Do virtual lectures require installing third-party software like Zoom?",
    a: "No downloads or external accounts are necessary. LearnSphere features integrated WebRTC video halls powered by Jitsi, enabling HD audio, video, chat, and screen-sharing right inside any modern browser.",
  },
  {
    q: "How are grades, midterms, and cumulative GPAs calculated?",
    a: "The grading ledger dynamically weights attendance, online quizzes, and exam scores. When instructors input marks, the platform instantly recomputes GPAs on a standard 4.00 scale and updates the student transcript in real time.",
  },
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 relative overflow-hidden bg-slate-950/40">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-bold tracking-wider uppercase mb-4">
            <HelpCircle className="w-3.5 h-3.5" />
            Clear Answers
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-slate-400 text-base">
            Everything you need to know about accessing and managing your LearnSphere account.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-slate-900/70 border border-white/10 backdrop-blur-xl overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02]"
                >
                  <span className="font-bold text-white text-base sm:text-lg">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-pink-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 text-slate-300 text-sm leading-relaxed border-t border-white/5 pt-3 animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
