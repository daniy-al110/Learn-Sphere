"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/config";
import { saveSession } from "@/lib/auth";
import { setActivePlanTier } from "@/lib/plans";
import { toast } from "@/lib/toast-store";
import {
  X,
  Sparkles,
  BookOpen,
  User,
  Lock,
  Mail,
  Building2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Loader2
} from "lucide-react";

interface QuickStartClassModalProps {
  onClose: () => void;
}

export default function QuickStartClassModal({ onClose }: QuickStartClassModalProps) {
  const router = useRouter();
  const [academyName, setAcademyName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstClassName, setFirstClassName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim() || !email.trim() || !password || !firstClassName.trim()) {
      toast.warning("Please fill in your name, email, password, and first class name.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: adminName.trim(),
          email: email.trim().toLowerCase(),
          password: password,
          academy_name: academyName.trim() || `${adminName.trim()}'s Academy`,
          first_class_name: firstClassName.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Save distinct session for newly created Academy Admin
        saveSession("admin", data.admin, data.admin.admin_id);
        setActivePlanTier("free"); // Starts on Free Starter Plan (upgrades handled via /admin/plan)
        toast.success(`🎉 Academy registered! Class "${firstClassName.trim()}" is now live.`);
        onClose();
        router.push("/admin/courses");
      } else {
        toast.error(data.error || "Registration failed. Please try again.");
      }
    } catch (err) {
      toast.error("Network error during registration. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-white/15 p-6 sm:p-8 shadow-2xl text-white">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-white">Register Academy & Start Class</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 uppercase">
                Free Starter
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Set up your tuition center with your personal login & first course
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Academy / Tuition Name
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={academyName}
                  onChange={(e) => setAcademyName(e.target.value)}
                  placeholder="e.g. Apex Tuition Center"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Admin Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. Muhammad Daniyal"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Admin Login Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@academy.edu.pk"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Admin Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              First Class / Course Name * (Free text)
            </label>
            <div className="relative">
              <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={firstClassName}
                onChange={(e) => setFirstClassName(e.target.value)}
                placeholder="e.g. Matric Mathematics Batch 2026 or MDCAT Physics"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          {/* Plan Quota Notice */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-[11px] text-slate-400">
            <span>Includes 1 Teacher, 10 Students & WebRTC Virtual Hall.</span>
            <span className="text-pink-400 font-bold">Rs. 0 / Free</span>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:to-rose-600 shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registering Academy & Provisioning Class...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Launch Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
