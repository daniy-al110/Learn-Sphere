"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  KeyRound,
  Loader2,
  CheckCircle2,
  HelpCircle,
  UserCheck,
} from "lucide-react";
import { loginRequest, passwordResetRequest } from "@/lib/api";
import { parseLoginResponse, roleHome, saveSession } from "@/lib/auth";
import { toast } from "@/lib/toast-store";

interface UltraAuthCardProps {
  /** If embedded into the landing page hero, adjusts layout and styling */
  embedded?: boolean;
  /** Initial role preset selected */
  initialRole?: "student" | "teacher" | "admin";
  /** Optional callback when user interacts */
  onSuccess?: () => void;
}

export default function UltraAuthCard({
  embedded = false,
  initialRole = "admin",
  onSuccess,
}: UltraAuthCardProps) {
  const router = useRouter();
  const [view, setView] = useState<"login" | "forgot">("login");
  const [selectedRole, setSelectedRole] = useState<"student" | "teacher" | "admin">(initialRole);

  // login form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  // forgot-password form
  const [lmsEmail, setLmsEmail] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatusMessage(null);
    setLoading(true);

    try {
      const cleanEmail = email.toLowerCase().trim();
      const res = await loginRequest(cleanEmail, password);

      if (!res.ok) {
        const msg =
          typeof res.body.error === "string" && res.body.error
            ? res.body.error
            : res.statusText || "Invalid email or password.";
        setStatusMessage({ type: "error", text: msg });
        toast.error("Login failed: " + msg);
        setLoading(false);
        return;
      }

      const parsed = parseLoginResponse(res.body);
      if (!parsed.ok) {
        setStatusMessage({ type: "error", text: parsed.error });
        toast.error(parsed.error);
        setLoading(false);
        return;
      }

      saveSession(parsed.role, parsed.user, parsed.userId);
      setStatusMessage({ type: "success", text: `Authenticated as ${parsed.role}. Redirecting...` });
      toast.success(`Welcome back! Routing to your ${parsed.role} workspace.`);

      if (onSuccess) onSuccess();

      const targetPath = roleHome(parsed.role);
      setTimeout(() => {
        router.push(targetPath);
      }, 350);
    } catch (error) {
      console.error("Login error:", error);
      const msg = error instanceof Error ? error.message : "Network error connecting to auth server.";
      setStatusMessage({ type: "error", text: msg });
      toast.error("Connection failure: " + msg);
      setLoading(false);
    }
  }

  async function handleForgot(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const lms = lmsEmail.toLowerCase().trim();
    const personal = personalEmail.toLowerCase().trim();

    if (!lms || !personal) {
      toast.warning("Please fill in both institutional and personal email.");
      return;
    }

    setForgotLoading(true);
    setStatusMessage(null);

    try {
      const res = await passwordResetRequest(lms, personal);
      if (!res.ok || !res.body.success) {
        const msg =
          typeof res.body.error === "string" && res.body.error
            ? res.body.error
            : res.statusText || "Unable to reset password. Verify your institutional email.";
        setStatusMessage({ type: "error", text: msg });
        toast.error(msg);
        setForgotLoading(false);
        return;
      }

      const msg =
        (typeof res.body.message === "string" && res.body.message) ||
        "Temporary password dispatched to your personal inbox!";
      setStatusMessage({ type: "success", text: msg });
      toast.success(msg);
      setLmsEmail("");
      setPersonalEmail("");
      setForgotLoading(false);

      // Return to login after 2 seconds
      setTimeout(() => {
        setView("login");
      }, 2000);
    } catch (error) {
      console.error("Password reset error:", error);
      const msg = error instanceof Error ? error.message : "Service unavailable.";
      setStatusMessage({ type: "error", text: msg });
      toast.error("Reset failed: " + msg);
      setForgotLoading(false);
    }
  }

  return (
    <div
      id="auth-section"
      className={`relative w-full rounded-3xl transition-all duration-300 ${
        embedded
          ? "max-w-[460px] bg-slate-900/85 backdrop-blur-2xl border border-white/10 shadow-[0_20px_70px_rgba(0,0,0,0.55)] p-6 sm:p-8"
          : "max-w-[480px] bg-slate-900/90 backdrop-blur-2xl border border-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.6)] p-8 sm:p-10"
      }`}
    >
      {/* Radiant ambient glow behind card */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header Badge */}
      <div className="flex items-center justify-between mb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-semibold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
          <span>INSTITUTIONAL ACCESS</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Server Online</span>
        </div>
      </div>

      {/* Title */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          {view === "login" ? (
            <>
              <span>Sign In to Portal</span>
            </>
          ) : (
            <>
              <KeyRound className="w-6 h-6 text-pink-400" />
              <span>Reset Password</span>
            </>
          )}
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm mt-1.5">
          {view === "login"
            ? "Unified auto-detection for Students, Faculty & Administrators."
            : "Enter your university email to receive a temporary recovery code."}
        </p>
      </div>

      {/* Status banner if present */}
      {statusMessage && (
        <div
          className={`mb-5 p-3.5 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 transition-all animate-in fade-in duration-200 ${
            statusMessage.type === "error"
              ? "bg-rose-500/15 border border-rose-500/30 text-rose-300"
              : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
          }`}
        >
          {statusMessage.type === "error" ? (
            <span className="text-rose-400 font-bold shrink-0">✕</span>
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <span className="leading-relaxed">{statusMessage.text}</span>
        </div>
      )}

      {/* Primary Login Form */}
      <div style={view === "forgot" ? { display: "none" } : undefined}>
        <form className="w-full space-y-4" id="loginForm" onSubmit={handleLogin}>
          {/* Email field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300" htmlFor="loginEmail">
              Institutional Email
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="email"
                id="loginEmail"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@learnsphere.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 hover:bg-slate-800 focus:bg-slate-800/95 border border-slate-700/80 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 rounded-xl text-sm text-white placeholder-slate-500 transition-all outline-none"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300" htmlFor="loginPassword">
                Password
              </label>
              <button
                type="button"
                id="forgotLink"
                onClick={() => {
                  setStatusMessage(null);
                  setView("forgot");
                }}
                className="text-xs font-medium text-pink-400 hover:text-pink-300 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                id="loginPassword"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-2.5 bg-slate-800/80 hover:bg-slate-800 focus:bg-slate-800/95 border border-slate-700/80 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 rounded-xl text-sm text-white placeholder-slate-500 transition-all outline-none"
              />
              <button
                type="button"
                id="toggleLoginPassword"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 p-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full group mt-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:to-rose-600 active:scale-[0.99] shadow-[0_8px_25px_rgba(233,69,96,0.35)] hover:shadow-[0_10px_30px_rgba(233,69,96,0.5)] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Authenticating Workspace...</span>
              </>
            ) : (
              <>
                <span>Access Dashboard</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Forgot Password Sub-Form */}
      <div style={{ display: view === "forgot" ? "block" : "none" }}>
        <form className="w-full space-y-4" id="forgotForm" onSubmit={handleForgot}>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300" htmlFor="forgotLmsEmail">
              Institutional Email
            </label>
            <div className="relative flex items-center">
              <GraduationCap className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="email"
                id="forgotLmsEmail"
                required
                disabled={forgotLoading}
                value={lmsEmail}
                onChange={(e) => setLmsEmail(e.target.value)}
                placeholder="your.name@student.lms.edu"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 rounded-xl text-sm text-white placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300" htmlFor="forgotPersonalEmail">
              Personal Recovery Email
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="email"
                id="forgotPersonalEmail"
                required
                disabled={forgotLoading}
                value={personalEmail}
                onChange={(e) => setPersonalEmail(e.target.value)}
                placeholder="personal@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 rounded-xl text-sm text-white placeholder-slate-500 outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400 pt-0.5">
              The recovery password will be dispatched to this mailbox via SMTP.
            </p>
          </div>

          <button
            type="submit"
            disabled={forgotLoading}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-600 shadow-[0_8px_25px_rgba(233,69,96,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {forgotLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Dispatching Temporary Password...</span>
              </>
            ) : (
              <>
                <span>Send Temporary Password</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-center text-xs text-slate-400 pt-2">
            Remembered your credentials?{" "}
            <button
              type="button"
              id="backToLogin"
              onClick={() => {
                setStatusMessage(null);
                setView("login");
              }}
              className="font-semibold text-pink-400 hover:text-pink-300 ml-1 cursor-pointer underline-offset-2 hover:underline"
            >
              Back to Sign In
            </button>
          </p>
        </form>
      </div>

      {/* Security Footer Notice */}
      <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          256-Bit TLS Encrypted
        </span>
        <span className="text-slate-400 hover:text-slate-300 flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5" />
          Campus Support
        </span>
      </div>
    </div>
  );
}
