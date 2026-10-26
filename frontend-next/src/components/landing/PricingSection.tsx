"use client";

import { useState } from "react";
import {
  Check,
  Building2,
  Users,
  GraduationCap,
  Sparkles,
  Mail,
  Copy,
  CheckCircle,
  X,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { setActivePlanTier, type PlanTier } from "@/lib/plans";

interface PricingSectionProps {
  onSelectFreePlan?: () => void;
}

export default function PricingSection({ onSelectFreePlan }: PricingSectionProps) {
  const [isAnnual, setIsAnnual] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedPlanForBank, setSelectedPlanForBank] = useState<{
    tier: PlanTier;
    name: string;
    price: string;
    seats: string;
  } | null>(null);

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleFreeClick = () => {
    setActivePlanTier("free");
    if (onSelectFreePlan) {
      onSelectFreePlan();
    } else {
      const el = document.getElementById("auth-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSelectPlan = (tier: PlanTier, name: string, price: string, seats: string) => {
    setActivePlanTier(tier);
    setSelectedPlanForBank({ tier, name, price, seats });
  };

  return (
    <section id="pricing" className="py-24 relative overflow-hidden bg-slate-950/70 border-t border-b border-white/5">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-pink-600/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-bold tracking-wider uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Affordable Academic Pricing in PKR
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Built for Tutors, Tuition Centers & Academies
          </h2>
          <p className="mt-4 text-slate-400 text-base sm:text-lg">
            Choose your academy capacity. All core features (WebRTC Live Classes, Quizzes, Grading & Attendance) are <span className="text-pink-400 font-semibold">100% unlocked</span> across every plan.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="mt-8 inline-flex items-center p-1.5 rounded-2xl bg-slate-900 border border-white/10 shadow-inner">
            <button
              type="button"
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                !isAnnual ? "bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setIsAnnual(true)}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                isAnnual ? "bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Save 25%
              </span>
            </button>
          </div>
        </div>

        {/* 3 Main Capacity Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-14">
          {/* Card 1: Free / Starter */}
          <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-7 sm:p-8 backdrop-blur-xl flex flex-col justify-between hover:border-white/20 transition-all shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Solo Tutor & Friends</span>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-white/10">
                  Starter
                </span>
              </div>
              <h3 className="text-2xl font-black text-white">Free Plan</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-400">
                Perfect for independent tutors getting started or small friend study pods.
              </p>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-white">Rs. 0</span>
                <span className="text-xs text-slate-400 font-semibold">/ forever free</span>
              </div>

              {/* Core Limits Highlight */}
              <div className="mt-6 p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-200">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-pink-400" /> Student Capacity
                  </span>
                  <span className="font-bold text-white">Up to 10 Students</span>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-pink-400" /> Tutor Seats
                  </span>
                  <span className="font-bold text-white">1 Teacher Seat</span>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-pink-400" /> Active Batches
                  </span>
                  <span className="font-bold text-white">1 Course / Batch</span>
                </div>
              </div>

              {/* Included Features */}
              <div className="mt-6 space-y-3 text-xs text-slate-300">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">All Core Features Unlocked:</p>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Interactive WebRTC Virtual Lecture Hall</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Timed Online Quizzes & Instant Scoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Automated GPA Ledger & Attendance</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                type="button"
                onClick={handleFreeClick}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
              >
                Get Started Free
              </button>
            </div>
          </div>

          {/* Card 2: Tuition Center (Most Popular) */}
          <div className="rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border-2 border-pink-500/50 p-7 sm:p-8 backdrop-blur-xl flex flex-col justify-between hover:border-pink-500 transition-all shadow-2xl relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 text-white text-[10px] font-black uppercase tracking-wider shadow-lg">
              Most Popular for Tuition Centers
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-pink-400">Coaching Centers</span>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  Standard Center
                </span>
              </div>
              <h3 className="text-2xl font-black text-white">Tuition Center</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-400">
                Ideal for established tuition teachers and coaching institutes running multiple batches.
              </p>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-white">
                  Rs. {isAnnual ? "1,499" : "1,999"}
                </span>
                <span className="text-xs text-slate-400 font-semibold">/ month</span>
              </div>
              {isAnnual && (
                <p className="text-[11px] text-emerald-400 mt-1 font-semibold">Billed annually (Rs. 17,999/yr)</p>
              )}

              {/* Core Limits Highlight */}
              <div className="mt-6 p-4 rounded-2xl bg-pink-500/5 border border-pink-500/20 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-200">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-pink-400" /> Student Capacity
                  </span>
                  <span className="font-extrabold text-pink-300">Up to 40 Students</span>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-pink-400" /> Tutor Seats
                  </span>
                  <span className="font-extrabold text-pink-300">2 Teacher Seats</span>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-pink-400" /> Active Batches
                  </span>
                  <span className="font-extrabold text-pink-300">5 Courses / Batches</span>
                </div>
              </div>

              {/* Included Features */}
              <div className="mt-6 space-y-3 text-xs text-slate-300">
                <p className="text-[11px] font-bold uppercase tracking-wider text-pink-400">Everything in Starter plus:</p>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unlimited Live WebRTC Lecture Hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Parent Email Notifications (SMTP)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Export Performance Sheets & CSVs</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                type="button"
                onClick={() =>
                  handleSelectPlan(
                    "tuition",
                    "Tuition Center Plan",
                    isAnnual ? "Rs. 1,499/mo (Rs. 17,999/yr)" : "Rs. 1,999/mo",
                    "40 Students • 2 Tutors • 5 Batches"
                  )
                }
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:to-rose-600 shadow-[0_10px_25px_rgba(233,69,96,0.4)] transition-all cursor-pointer"
              >
                Choose Tuition Plan (Bank / Raast)
              </button>
            </div>
          </div>

          {/* Card 3: Academy Pro */}
          <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-7 sm:p-8 backdrop-blur-xl flex flex-col justify-between hover:border-white/20 transition-all shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Large Coaching Academies</span>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Academy Scale
                </span>
              </div>
              <h3 className="text-2xl font-black text-white">Academy Pro</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-400">
                For larger multi-teacher tuition centers managing multiple classes and cohorts.
              </p>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-white">
                  Rs. {isAnnual ? "3,499" : "4,499"}
                </span>
                <span className="text-xs text-slate-400 font-semibold">/ month</span>
              </div>
              {isAnnual && (
                <p className="text-[11px] text-emerald-400 mt-1 font-semibold">Billed annually (Rs. 41,999/yr)</p>
              )}

              {/* Core Limits Highlight */}
              <div className="mt-6 p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-200">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-400" /> Student Capacity
                  </span>
                  <span className="font-bold text-white">Up to 150 Students</span>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-400" /> Tutor Seats
                  </span>
                  <span className="font-bold text-white">6 Teacher Seats</span>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" /> Active Batches
                  </span>
                  <span className="font-bold text-white">Unlimited Courses</span>
                </div>
              </div>

              {/* Included Features */}
              <div className="mt-6 space-y-3 text-xs text-slate-300">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Everything in Tuition Center plus:</p>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Multi-Faculty Administration Dashboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>1-Click Bulk Student Enroller Engine</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Priority WhatsApp / Email Support</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                type="button"
                onClick={() =>
                  handleSelectPlan(
                    "academy",
                    "Academy Pro Plan",
                    isAnnual ? "Rs. 3,499/mo (Rs. 41,999/yr)" : "Rs. 4,499/mo",
                    "150 Students • 6 Tutors • Unlimited Batches"
                  )
                }
                className="w-full py-3.5 rounded-xl font-bold text-sm text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
              >
                Choose Academy Plan (Bank / Raast)
              </button>
            </div>
          </div>
        </div>

        {/* 4th SPECIAL CARD: Custom Branding & Dedicated Deployment */}
        <div className="rounded-3xl bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90 border border-indigo-500/30 p-8 sm:p-10 backdrop-blur-2xl shadow-2xl mb-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5" />
                Custom Deployment & White-Label
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Want Your Own Logo, Name & Separate Dedicated Cloud?
              </h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                We will deploy a 100% private, customized version of LearnSphere exclusively for your institute (e.g. displaying <span className="text-white font-bold">&quot;Apex Coaching Center&quot;</span> on your own custom domain like <code className="text-indigo-400 text-xs font-mono">lms.youracademy.com</code>) with dedicated database infrastructure.
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-1 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" /> Custom Academy Logo & Colors
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" /> Custom Domain / Subdomain
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" /> Isolated Supabase PostgreSQL Cloud
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 shrink-0">
              <a
                href="mailto:kradtech4@gmail.com?subject=Custom%20Deployment%20Inquiry%20-%20LearnSphere%20LMS&body=Hello%20KRAD%20TECH%20Team%2C%0A%0AWe%20are%20interested%20in%20a%20dedicated%20custom-branded%20deployment%20of%20LearnSphere%20LMS%20for%20our%20academy.%0A%0AOrganization%20%2F%20Tuition%20Name%3A%20%0AEstimated%20Number%20of%20Students%3A%20%0AContact%20Person%20Name%3A%20%0APhone%20%2F%20WhatsApp%3A%20%0A"
                className="inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
              >
                <Mail className="w-4 h-4" />
                <span>Email for Custom Deployment</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <span className="text-xs text-slate-400">
                Direct inquiry: <strong className="text-slate-200">kradtech4@gmail.com</strong>
              </span>
            </div>
          </div>
        </div>

        {/* KRAD TECH Footer Endorsement */}
        <div className="text-center pt-4 pb-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            <span>
              Engineered & Supported by <strong className="text-white font-extrabold tracking-wide">KRAD TECH</strong>
            </span>
            <span className="text-slate-600">•</span>
            <a href="mailto:kradtech4@gmail.com" className="text-pink-400 hover:text-pink-300 font-semibold underline underline-offset-2">
              kradtech4@gmail.com
            </a>
          </div>
        </div>
      </div>

      {/* DIRECT BANK TRANSFER DETAILS MODAL */}
      {selectedPlanForBank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-white/15 p-6 sm:p-8 shadow-2xl text-white animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedPlanForBank(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Direct Bank / Raast Transfer</h3>
                <p className="text-xs text-slate-400">Selected Plan: {selectedPlanForBank.name}</p>
              </div>
            </div>

            {/* Selected Plan Details */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs mb-6">
              <div>
                <span className="text-slate-400">Amount to Transfer:</span>
                <span className="ml-2 font-black text-pink-400 text-sm">{selectedPlanForBank.price}</span>
              </div>
              <span className="text-slate-400 font-medium">{selectedPlanForBank.seats}</span>
            </div>

            {/* Bank Credentials */}
            <div className="space-y-3.5 mb-6 text-xs">
              <p className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Official Bank Transfer Credentials:</p>

              {/* Bank Name */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-white/10">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Bank / Wallet</div>
                  <div className="text-sm font-bold text-white">Meezan Bank / Nayapay / Raast (Instant)</div>
                </div>
              </div>

              {/* Account Title */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-white/10">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Account Title</div>
                  <div className="text-sm font-bold text-white">KRAD TECH / Muhammad Daniyal</div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard("KRAD TECH", "title")}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedField === "title" ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === "title" ? "Copied" : "Copy"}</span>
                </button>
              </div>

              {/* Account / IBAN Number */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-white/10">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Account Number / Raast ID</div>
                  <div className="text-sm font-mono font-bold text-pink-400">03185368686</div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard("03185368686", "iban")}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedField === "iban" ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === "iban" ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Verification Instructions */}
            <div className="p-4 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-xs space-y-2 mb-6">
              <div className="flex items-center gap-2 font-bold text-pink-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Instant Activation via Email Screenshot</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Send your payment screenshot or transaction ID to <strong className="text-white">kradtech4@gmail.com</strong> along with your academy name. Your workspace quota will be activated within 15 minutes.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <a
                href={`mailto:kradtech4@gmail.com?subject=Payment%20Receipt%20for%20${encodeURIComponent(
                  selectedPlanForBank.name
                )}&body=Hello%20KRAD%20TECH%20Team%2C%0A%0AI%20have%20completed%20the%20transfer%20of%20${encodeURIComponent(
                  selectedPlanForBank.price
                )}%20for%20the%20${encodeURIComponent(
                  selectedPlanForBank.name
                )}.%0A%0AAcademy%20%2F%20Tuition%20Name%3A%20%0AContact%20Phone%20%2F%20WhatsApp%3A%20%0ATransaction%20ID%20%2F%20Receipt%3A%20%0A%0AAttached%20is%20my%20screenshot.`}
                className="flex-1 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-center text-white bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-600 transition-all shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Email Payment Screenshot</span>
              </a>
              <button
                type="button"
                onClick={() => setSelectedPlanForBank(null)}
                className="px-5 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
