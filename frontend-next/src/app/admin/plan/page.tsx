"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/config";
import { toast } from "@/lib/toast-store";
import {
  getActivePlanConfig,
  getActivePlanTier,
  setActivePlanTier,
  ACADEMY_PLANS,
  type PlanTier
} from "@/lib/plans";
import {
  CreditCard,
  Check,
  Building2,
  Users,
  GraduationCap,
  Sparkles,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Copy,
  Clock,
  ShieldCheck,
  X
} from "lucide-react";

export default function AdminPlanPage() {
  const [currentTier, setCurrentTier] = useState<PlanTier>("free");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Form states for upload
  const [selectedTier, setSelectedTier] = useState<"tuition" | "academy">("tuition");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [academyName, setAcademyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentTier(getActivePlanTier());
    const onPlanChange = () => setCurrentTier(getActivePlanTier());
    window.addEventListener("academy-plan-changed", onPlanChange);
    return () => window.removeEventListener("academy-plan-changed", onPlanChange);
  }, []);

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.warning("Please upload a valid image file (PNG, JPG, WebP)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setScreenshotData(event.target?.result as string);
      toast.success("Payment screenshot attached!");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!transactionId.trim()) {
      toast.warning("Please enter your Bank/Raast transaction ID");
      return;
    }
    if (!screenshotData) {
      toast.warning("Please upload your payment transfer screenshot");
      return;
    }

    setSubmitting(true);
    try {
      const amount = selectedTier === "academy"
        ? (billingCycle === "annual" ? 41999 : 4499)
        : (billingCycle === "annual" ? 17999 : 1999);

      const res = await fetch(`${API_BASE_URL}/api/super-admin/platform/submit-upgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academy_name: academyName.trim() || "My Academy",
          contact_name: contactName.trim() || "Admin",
          phone: phone.trim(),
          requested_tier: selectedTier,
          billing_cycle: billingCycle,
          amount_pkr: amount,
          transaction_id: transactionId.trim(),
          screenshot_base64: screenshotData,
          notes: `Uploaded via /admin/plan for ${selectedTier.toUpperCase()} plan.`
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmittedRequest(data.request);
        toast.success("Payment proof submitted! Platform Super Admin will review your screenshot.");
      } else {
        toast.error(data.error || "Submission failed");
      }
    } catch (err) {
      toast.error("Network error while submitting upgrade request");
    } finally {
      setSubmitting(false);
    }
  };

  const activePlan = ACADEMY_PLANS[currentTier];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Academy Subscriptions & Quota Management
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Upgrade Academy Plan</h1>
          <p className="text-slate-400 text-sm mt-1">
            Unlock 10+ students, multiple teachers, and unlimited course batches for your institute.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/platform"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors border border-white/10"
          >
            Super Super Admin Center
          </Link>
        </div>
      </div>

      {/* Active Quota Warning Card */}
      <div className="rounded-3xl bg-slate-900 border border-pink-500/30 p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Active Plan:</span>
            <div className="flex items-center gap-3 mt-1">
              <h2 className="text-2xl font-black text-white">{activePlan.name}</h2>
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 uppercase">
                {activePlan.badge}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Active Billing: <strong className="text-white">{activePlan.priceMonthly === 0 ? "Free (Rs. 0)" : `Rs. ${activePlan.priceMonthly.toLocaleString()}/mo`}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                Need to add <strong className="text-white">10+ students</strong> or <strong className="text-white">multiple teachers</strong>? Choose a paid tier below.
              </span>
            </div>
          </div>
        </div>

        {/* Capacity Meters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
                <Users className="w-4 h-4 text-pink-400" /> Student Limit
              </span>
              <span className="font-bold text-white">Up to {activePlan.maxStudents} Students</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-pink-500 rounded-full" style={{ width: "80%" }} />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
                <GraduationCap className="w-4 h-4 text-indigo-400" /> Teacher Seats
              </span>
              <span className="font-bold text-white">{activePlan.maxTeachers} Teacher Seat(s)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: "100%" }} />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
                <Building2 className="w-4 h-4 text-emerald-400" /> Course Batches
              </span>
              <span className="font-bold text-white">
                {activePlan.maxCourses > 500 ? "Unlimited" : `${activePlan.maxCourses} Course(s)`}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: "50%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Plan Selection Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Card 1: Tuition Center */}
        <div
          onClick={() => setSelectedTier("tuition")}
          className={`rounded-3xl p-7 border-2 transition-all cursor-pointer relative ${
            selectedTier === "tuition"
              ? "bg-slate-900/90 border-pink-500 shadow-2xl shadow-pink-500/20"
              : "bg-slate-900/50 border-white/10 hover:border-white/20"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-pink-400">Standard Center</span>
            {selectedTier === "tuition" && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500 text-white uppercase">
                Selected
              </span>
            )}
          </div>
          <h3 className="text-2xl font-black text-white">Tuition Center Plan</h3>
          <p className="text-xs text-slate-400 mt-1">Perfect for tutors & coaching centers expanding past 10 students.</p>

          <div className="mt-5 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">Rs. 1,999</span>
            <span className="text-xs text-slate-400 font-semibold">/ month</span>
          </div>

          <div className="mt-5 space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>Up to 40 Students</strong> (4x capacity of Free Plan)</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>2 Teacher Seats</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>5 Course Batches</strong></span>
            </div>
          </div>
        </div>

        {/* Card 2: Academy Pro */}
        <div
          onClick={() => setSelectedTier("academy")}
          className={`rounded-3xl p-7 border-2 transition-all cursor-pointer relative ${
            selectedTier === "academy"
              ? "bg-slate-900/90 border-indigo-500 shadow-2xl shadow-indigo-500/20"
              : "bg-slate-900/50 border-white/10 hover:border-white/20"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Academy Scale</span>
            {selectedTier === "academy" && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500 text-white uppercase">
                Selected
              </span>
            )}
          </div>
          <h3 className="text-2xl font-black text-white">Academy Pro Plan</h3>
          <p className="text-xs text-slate-400 mt-1">For multi-teacher coaching academies running cohorts at scale.</p>

          <div className="mt-5 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">Rs. 4,499</span>
            <span className="text-xs text-slate-400 font-semibold">/ month</span>
          </div>

          <div className="mt-5 space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>Up to 150 Students</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>6 Teacher Seats</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>Unlimited Courses & Batches</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details & Screenshot Upload Form */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left: Bank Transfer Credentials */}
        <div className="lg:col-span-5 rounded-3xl bg-slate-900/80 border border-white/10 p-6 sm:p-7 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Bank / Raast Credentials</h3>
              <p className="text-xs text-slate-400">Instant transfer via any Pakistani banking app</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {/* Bank Name */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-white/10">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Bank / Wallet</div>
              <div className="text-sm font-bold text-white mt-0.5">Meezan Bank / Nayapay / Raast</div>
            </div>

            {/* Account Title */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Account Title</div>
                <div className="text-sm font-bold text-white mt-0.5">KRAD TECH / Muhammad Daniyal</div>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard("KRAD TECH", "title")}
                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                {copiedField === "title" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === "title" ? "Copied" : "Copy"}</span>
              </button>
            </div>

            {/* Account / Raast Number */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Account / Raast ID</div>
                <div className="text-base font-mono font-black text-pink-400 mt-0.5">03185368686</div>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard("03185368686", "iban")}
                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                {copiedField === "iban" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === "iban" ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-pink-300">
              <ShieldCheck className="w-4 h-4 text-pink-400" />
              <span>How Verification Works</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              After transferring, take a screenshot of your receipt and upload it in the form. The Super Super Admin will verify your transaction ID and unlock your 40 or 150 student capacity.
            </p>
          </div>
        </div>

        {/* Right: Upload Payment Screenshot Form */}
        <div className="lg:col-span-7 rounded-3xl bg-slate-900 border border-white/15 p-6 sm:p-8">
          {submittedRequest ? (
            <div className="py-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-white">Payment Proof Submitted!</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                Thank you! Your payment receipt for <strong className="text-white">{submittedRequest.requested_tier.toUpperCase()}</strong> plan (Transaction ID: <span className="font-mono text-pink-400">{submittedRequest.transaction_id}</span>) is now in the verification queue.
              </p>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold">
                <Clock className="w-3.5 h-3.5" />
                Status: Pending Super Admin Approval
              </div>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setSubmittedRequest(null)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Submit Another Upgrade
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitUpgrade} className="space-y-4">
              <h3 className="text-lg font-black text-white">Submit Payment Proof</h3>
              <p className="text-xs text-slate-400">
                Upload your payment screenshot to request instant quota activation.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Academy / Tuition Name</label>
                  <input
                    type="text"
                    required
                    value={academyName}
                    onChange={(e) => setAcademyName(e.target.value)}
                    placeholder="e.g. Apex Coaching Academy"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Phone / WhatsApp</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +92 300 1234567"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Bank / Raast Transaction ID</label>
                <input
                  type="text"
                  required
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. RAAST-987412356 or TRX-82741"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* File Upload Zone */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Payment Screenshot</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {screenshotData ? (
                  <div className="relative rounded-2xl overflow-hidden border border-pink-500/40 bg-slate-950 p-2 group">
                    <img
                      src={screenshotData}
                      alt="Payment Receipt Preview"
                      className="w-full max-h-56 object-contain rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setScreenshotData(null)}
                      className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/70 hover:bg-rose-600 flex items-center justify-center text-white transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/15 hover:border-pink-500/50 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-white/[0.01] hover:bg-white/[0.03]"
                  >
                    <Upload className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-200">Click to upload payment screenshot</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">PNG, JPG, or WebP transfer receipt</p>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-600 shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {submitting ? "Uploading & Submitting..." : `Submit for Verification (${selectedTier === "academy" ? "Rs. 4,499" : "Rs. 1,999"})`}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
