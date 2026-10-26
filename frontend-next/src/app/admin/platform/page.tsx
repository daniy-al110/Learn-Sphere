"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/config";
import { toast } from "@/lib/toast-store";
import { setActivePlanTier, ACADEMY_PLANS, type PlanTier } from "@/lib/plans";
import ShareClassModal from "@/components/courses/ShareClassModal";
import {
  ShieldAlert,
  ShieldCheck,
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  CreditCard,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  X,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Share2,
  RefreshCw
} from "lucide-react";

interface UpgradeRequest {
  id: string;
  academy_name: string;
  contact_name: string;
  contact_email?: string;
  phone?: string;
  requested_tier: "tuition" | "academy";
  billing_cycle: "monthly" | "annual";
  amount_pkr: number;
  transaction_id: string;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
  screenshot_url?: string;
  notes?: string;
}

interface PlatformCourse {
  course_id: number;
  course_name: string;
  description?: string;
  teacher_name?: string;
  teacher_email?: string;
  credit_hours?: number;
  active_plan?: string;
  join_code?: string;
}

export default function SuperSuperAdminPlatformPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    total_courses: 0,
    total_teachers: 0,
    total_students: 0,
    total_enrollments: 0,
    pending_upgrade_requests: 0
  });
  const [courses, setCourses] = useState<PlatformCourse[]>([]);
  const [requests, setRequests] = useState<UpgradeRequest[]>([]);

  // Screenshot modal preview
  const [previewScreenshot, setPreviewScreenshot] = useState<UpgradeRequest | null>(null);
  const [sharingCourse, setSharingCourse] = useState<{ id: number; name: string } | null>(null);

  // New Super Super Admin creation
  const [newSuperName, setNewSuperName] = useState("");
  const [newSuperEmail, setNewSuperEmail] = useState("");
  const [newSuperPassword, setNewSuperPassword] = useState("");
  const [creatingSuper, setCreatingSuper] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/super-admin/platform/overview`);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setCourses(data.courses || []);
        setRequests(data.recent_requests || []);
      }
    } catch (e) {
      toast.error("Failed to load platform overview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (req: UpgradeRequest) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/super-admin/platform/approve-upgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: req.id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Approved ${req.academy_name} for ${req.requested_tier.toUpperCase()} tier!`);
        // Update local academy plan so live quotas unlock immediately
        setActivePlanTier(req.requested_tier as PlanTier);
        if (previewScreenshot?.id === req.id) setPreviewScreenshot(null);
        fetchData();
      } else {
        toast.error(data.error || "Approval failed");
      }
    } catch (e) {
      toast.error("Network error while approving upgrade");
    }
  };

  const handleReject = async (req: UpgradeRequest) => {
    const reason = prompt("Enter rejection reason (optional):", "Receipt could not be verified with bank.");
    if (reason === null) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/super-admin/platform/reject-upgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: req.id, reason }),
      });
      const data = await res.json();
      if (data.success) {
        toast.info(`Rejected upgrade request for ${req.academy_name}`);
        if (previewScreenshot?.id === req.id) setPreviewScreenshot(null);
        fetchData();
      } else {
        toast.error(data.error || "Action failed");
      }
    } catch (e) {
      toast.error("Network error");
    }
  };

  const handleCreateSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuperName.trim() || !newSuperEmail.trim() || !newSuperPassword) {
      toast.warning("Please fill in name, email, and password.");
      return;
    }
    setCreatingSuper(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/super-admin/platform/create-super-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSuperName.trim(),
          email: newSuperEmail.trim().toLowerCase(),
          password: newSuperPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`🎉 New Super Super Admin created for ${newSuperEmail}!`);
        setNewSuperName("");
        setNewSuperEmail("");
        setNewSuperPassword("");
      } else {
        toast.error(data.error || "Failed to create Super Super Admin");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setCreatingSuper(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Platform Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Super Super Admin Platform Center
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Platform Overview & Plan Approvals</h1>
          <p className="text-slate-400 text-sm mt-1">
            Global management portal for KRAD TECH: inspect all classes, view payment screenshots, and approve plan tiers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchData}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2 border border-white/10 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/admin/plan"
            className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold shadow-lg shadow-pink-500/30 transition-all cursor-pointer"
          >
            Go to Plan Screen
          </Link>
        </div>
      </div>

      {/* Global Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="rounded-2xl bg-slate-900 border border-white/10 p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Total Classes</span>
            <BookOpen className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-3xl font-black text-white">{stats.total_courses}</div>
          <div className="text-[11px] text-slate-500">Across all platform academies</div>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-white/10 p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Total Students</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-white">{stats.total_students}</div>
          <div className="text-[11px] text-slate-500">{stats.total_enrollments} Total Enrollments</div>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-white/10 p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Total Teachers</span>
            <GraduationCap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white">{stats.total_teachers}</div>
          <div className="text-[11px] text-slate-500">Instructors & Tutors</div>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-white/10 p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400">{stats.pending_upgrade_requests}</div>
          <div className="text-[11px] text-slate-500">Receipt screenshots to verify</div>
        </div>
      </div>

      {/* SECTION: Pending Payment Screenshots Verification Queue */}
      <div className="rounded-3xl bg-slate-900 border border-white/10 p-6 sm:p-7 space-y-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-white">Payment Screenshots & Upgrade Verification</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Review Bank/Raast transfer receipts uploaded by class admins to approve 40 or 150 student capacity.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-white/10">
            {requests.length} Total Requests
          </span>
        </div>

        {requests.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500">
            No upgrade requests pending review.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-bold">Academy / Contact</th>
                  <th className="pb-3 font-bold">Requested Plan</th>
                  <th className="pb-3 font-bold">Amount</th>
                  <th className="pb-3 font-bold">Transaction ID</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 font-bold text-center">Receipt Screenshot</th>
                  <th className="pb-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 pr-3">
                      <div className="font-bold text-white text-sm">{r.academy_name}</div>
                      <div className="text-[11px] text-slate-400">{r.contact_name} {r.phone ? `• ${r.phone}` : ""}</div>
                    </td>
                    <td className="py-3.5 pr-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                        r.requested_tier === "academy"
                          ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                          : "bg-pink-500/20 text-pink-300 border-pink-500/30"
                      }`}>
                        {r.requested_tier === "academy" ? "Academy Pro (150)" : "Tuition Center (40)"}
                      </span>
                    </td>
                    <td className="py-3.5 pr-3 font-mono font-bold text-white">
                      Rs. {r.amount_pkr.toLocaleString()}
                    </td>
                    <td className="py-3.5 pr-3 font-mono text-slate-300 text-[11px]">
                      {r.transaction_id}
                    </td>
                    <td className="py-3.5 pr-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        r.status === "approved"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : r.status === "rejected"
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 pr-3 text-center">
                      <button
                        type="button"
                        onClick={() => setPreviewScreenshot(r)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-pink-400 hover:text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Screenshot</span>
                      </button>
                    </td>
                    <td className="py-3.5 text-right space-x-2">
                      {r.status === "pending" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApprove(r)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-md shadow-emerald-600/20"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(r)}
                            className="px-3 py-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white font-bold text-xs transition-colors cursor-pointer border border-rose-500/30"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-500">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION: All Platform Classes Directory */}
      <div className="rounded-3xl bg-slate-900 border border-white/10 p-6 sm:p-7 space-y-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-white">All Platform Classes Directory</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect every active course, assigned faculty, and shareable high-entropy class token.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-white/10">
            {courses.length} Active Courses
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="pb-3 font-bold">ID</th>
                <th className="pb-3 font-bold">Class / Course Name</th>
                <th className="pb-3 font-bold">Instructor</th>
                <th className="pb-3 font-bold">Credit Hours</th>
                <th className="pb-3 font-bold">Plan Tier</th>
                <th className="pb-3 font-bold text-right">Share Class</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {courses.map((c) => (
                <tr key={c.course_id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 pr-3 font-mono text-slate-400">#{c.course_id}</td>
                  <td className="py-3.5 pr-3 font-bold text-white text-sm">
                    {c.course_name}
                  </td>
                  <td className="py-3.5 pr-3 text-slate-300">
                    <div>{c.teacher_name || "Unassigned"}</div>
                    {c.teacher_email && <div className="text-[10px] text-slate-500">{c.teacher_email}</div>}
                  </td>
                  <td className="py-3.5 pr-3 font-mono text-slate-400">
                    {c.credit_hours || 3} CH
                  </td>
                  <td className="py-3.5 pr-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-pink-500/10 text-pink-400 border border-pink-500/20">
                      {c.active_plan || "Active"}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => setSharingCourse({ id: c.course_id, name: c.course_name })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/10 hover:bg-pink-500 text-pink-400 hover:text-white border border-pink-500/30 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share Link</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION: Create New Super Super Admin (Platform Owner Provisioning) */}
      <div className="rounded-3xl bg-slate-900 border border-purple-500/30 p-6 sm:p-7 space-y-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Provision New Super Super Admin</h3>
            <p className="text-xs text-slate-400">
              Super Super Admins can only be created from this platform control center and can directly log in.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateSuperAdmin} className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={newSuperName}
              onChange={(e) => setNewSuperName(e.target.value)}
              placeholder="e.g. Platform Co-Owner"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={newSuperEmail}
              onChange={(e) => setNewSuperEmail(e.target.value)}
              placeholder="owner@learnsphere.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="flex gap-2">
              <input
                type="password"
                required
                value={newSuperPassword}
                onChange={(e) => setNewSuperPassword(e.target.value)}
                placeholder="••••••••"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={creatingSuper}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer shrink-0"
              >
                {creatingSuper ? "Creating..." : "Add Super Admin"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* MODAL: Payment Receipt Screenshot Lightbox */}
      {previewScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-white/15 p-6 sm:p-8 shadow-2xl text-white">
            <button
              type="button"
              onClick={() => setPreviewScreenshot(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Payment Receipt Verification</h3>
                <p className="text-xs text-slate-400">
                  {previewScreenshot.academy_name} • Requested {previewScreenshot.requested_tier.toUpperCase()} Plan (Rs. {previewScreenshot.amount_pkr.toLocaleString()})
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-white/10 grid grid-cols-2 gap-4 text-xs mb-4">
              <div>
                <span className="text-slate-400">Transaction ID:</span>
                <span className="ml-2 font-mono font-bold text-pink-400">{previewScreenshot.transaction_id}</span>
              </div>
              <div>
                <span className="text-slate-400">Submitted:</span>
                <span className="ml-2 text-slate-300 font-medium">
                  {new Date(previewScreenshot.submitted_at).toLocaleString()}
                </span>
              </div>
            </div>

            {/* The High-Res Screenshot Preview */}
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/60 max-h-[420px] flex items-center justify-center mb-6">
              {previewScreenshot.screenshot_url ? (
                <img
                  src={previewScreenshot.screenshot_url}
                  alt="Bank Transfer Receipt"
                  className="max-h-[420px] w-auto object-contain"
                />
              ) : (
                <div className="py-20 text-slate-500 text-xs">No screenshot attached</div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-slate-400">
                Verifying this will upgrade the academy capacity immediately.
              </span>
              <div className="flex gap-3">
                {previewScreenshot.status === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleReject(previewScreenshot)}
                      className="px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(previewScreenshot)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-lg shadow-emerald-600/30 cursor-pointer"
                    >
                      Approve & Activate Plan
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewScreenshot(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Class Modal */}
      {sharingCourse && (
        <ShareClassModal
          courseId={sharingCourse.id}
          courseName={sharingCourse.name}
          onClose={() => setSharingCourse(null)}
        />
      )}
    </div>
  );
}
