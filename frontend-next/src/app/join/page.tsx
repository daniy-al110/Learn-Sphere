"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/config";
import { useSession } from "@/hooks/useSession";
import { saveSession } from "@/lib/auth";
import { toast } from "@/lib/toast-store";
import {
  GraduationCap,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  User,
  Lock,
  Mail,
  Loader2,
  AlertCircle
} from "lucide-react";

interface VerifiedCourse {
  course_id: number;
  course_name: string;
  description?: string;
  credit_hours?: number;
  teacher_name?: string;
  section_name?: string;
}

function JoinClassContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  const { session } = useSession();

  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<VerifiedCourse | null>(null);

  // Form states for unauthenticated users
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setError("No class token provided in the link. Please check your invitation link.");
      return;
    }

    async function verifyToken() {
      try {
        setVerifying(true);
        setError(null);
        const res = await fetch(`${API_BASE_URL}/api/courses/verify-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setCourse(data.course);
        } else {
          setError(data.error || "Invalid or expired class link.");
        }
      } catch (err: any) {
        setError("Network error while verifying class link.");
      } finally {
        setVerifying(false);
      }
    }

    verifyToken();
  }, [token]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload: any = { token };

      // If already logged in as student
      if (session.userId && session.role === "student") {
        payload.student_id = session.userId;
      } else {
        if (!name.trim() || !email.trim() || !password) {
          toast.warning("Please fill in your name, email, and password.");
          setSubmitting(false);
          return;
        }
        payload.name = name.trim();
        payload.email = email.trim().toLowerCase();
        payload.password = password;
      }

      const res = await fetch(`${API_BASE_URL}/api/courses/join-by-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.student) {
          // Save session if newly authenticated
          saveSession("student", data.student, data.student.student_id);
        }
        toast.success(data.message || `Enrolled in ${course?.course_name}!`);
        router.push("/student/dashboard");
      } else {
        toast.error(data.error || "Failed to join class");
      }
    } catch (err) {
      toast.error("Network error while joining class.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e17] text-white flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-pink-600/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Brand header */}
      <div className="mb-8 text-center relative z-10">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">LearnSphere</span>
        </Link>
      </div>

      <div className="w-full max-w-md rounded-3xl bg-slate-900/90 border border-white/15 p-7 sm:p-8 backdrop-blur-2xl shadow-2xl relative z-10">
        {verifying ? (
          <div className="py-16 text-center space-y-4">
            <Loader2 className="w-8 h-8 text-pink-500 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-300">Verifying secure class token...</p>
            <p className="text-xs text-slate-500">Checking rate limits and token validity</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-white">Access Denied</h2>
            <p className="text-xs text-rose-300 leading-relaxed bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
              {error}
            </p>
            <p className="text-xs text-slate-400">
              If you believe this is a mistake, contact your instructor for a renewed class link.
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 hover:text-white transition-colors"
              >
                Return to Home
              </Link>
            </div>
          </div>
        ) : course ? (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Class Invitation
              </div>
              <h2 className="text-2xl font-black text-white">{course.course_name}</h2>
              <p className="text-xs text-slate-400 mt-1">
                Taught by <strong className="text-white">{course.teacher_name}</strong>
                {course.credit_hours ? ` • ${course.credit_hours} Credit Hours` : ""}
              </p>
            </div>

            {course.description && (
              <p className="text-xs text-slate-300 bg-white/[0.02] border border-white/5 p-3 rounded-xl leading-relaxed">
                {course.description}
              </p>
            )}

            {/* If Student Already Logged In */}
            {session.userId && session.role === "student" ? (
              <div className="space-y-4 pt-2">
                <div className="p-3.5 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center font-bold text-xs text-white">
                    {session.userName?.[0] || "S"}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Logged in as {session.userName}</div>
                    <div className="text-[10px] text-slate-400">Your single student account will be enrolled</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:to-rose-600 shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Enrolling...</span>
                    </>
                  ) : (
                    <>
                      <span>Enroll in Class Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* New / Unauthenticated Student Registration */
              <form onSubmit={handleJoin} className="space-y-4 pt-1">
                <div className="text-xs text-slate-400 pb-1">
                  Create your unified student account or enter your credentials to join:
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ali Ahmed"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-pink-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-pink-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-pink-500 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:to-rose-600 shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Profile & Enrolling...</span>
                    </>
                  ) : (
                    <>
                      <span>Join Class</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function JoinClassPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0b0e17] flex items-center justify-center text-white text-xs">
          Loading join portal...
        </div>
      }
    >
      <JoinClassContent />
    </Suspense>
  );
}
