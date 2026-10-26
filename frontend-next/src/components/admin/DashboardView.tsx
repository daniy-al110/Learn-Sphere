"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/layout/icons";
import { useAdminData } from "./AdminDataProvider";
import { useAsync } from "@/hooks/useAsync";
import { fetchEnrollmentRequests } from "@/lib/admin/api";
import {
  Users,
  UserCheck,
  BookOpen,
  Inbox,
  ArrowRight,
  Zap,
  BarChart2,
  Sparkles,
  ShieldAlert,
  Database,
  Activity,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  getActivePlanConfig,
  getActivePlanTier,
  setActivePlanTier,
  ACADEMY_PLANS,
  type PlanTier,
} from "@/lib/plans";

const none = null;

function AcademyPlanStatusCard({
  studentCount,
  teacherCount,
  courseCount,
}: {
  studentCount: number;
  teacherCount: number;
  courseCount: number;
}) {
  const [currentTier, setCurrentTier] = useState<PlanTier>("free");

  useEffect(() => {
    setCurrentTier(getActivePlanTier());
    const onPlanChange = () => setCurrentTier(getActivePlanTier());
    window.addEventListener("academy-plan-changed", onPlanChange);
    return () => window.removeEventListener("academy-plan-changed", onPlanChange);
  }, []);

  const plan = ACADEMY_PLANS[currentTier];
  const isUnlimitedPlan = plan.maxStudents >= 99999;
  const studentPct = isUnlimitedPlan ? 15 : Math.min(100, Math.round((studentCount / plan.maxStudents) * 100));
  const teacherPct = isUnlimitedPlan ? 15 : Math.min(100, Math.round((teacherCount / plan.maxTeachers) * 100));
  const coursePct = isUnlimitedPlan ? 15 : Math.min(100, Math.round((courseCount / plan.maxCourses) * 100));

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-pink-500/30 p-6 sm:p-7 backdrop-blur-xl shadow-lg dark:shadow-xl space-y-5 transition-colors">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 dark:bg-pink-500/20 border border-pink-500/20 dark:border-pink-500/30 flex items-center justify-center text-pink-500 dark:text-pink-400 shadow-sm">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">{plan.name}</h3>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-pink-500/10 dark:bg-pink-500/20 text-pink-600 dark:text-pink-300 border border-pink-500/20 dark:border-pink-500/30 uppercase tracking-wide">
                {plan.badge}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Active Billing:{" "}
              <strong className="text-slate-800 dark:text-white font-bold">
                {plan.priceMonthly === 0 ? "Free (Rs. 0)" : `Rs. ${plan.priceMonthly.toLocaleString()}/month`}
              </strong>{" "}
              • Managed by KRAD TECH
            </p>
          </div>
        </div>

        {/* Plan Switcher / Tester */}
        <div className="flex items-center gap-2.5">
          <label className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Workspace Plan:</label>
          <select
            value={currentTier}
            onChange={(e) => setActivePlanTier(e.target.value as PlanTier)}
            className="text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-white/15 px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:border-pink-500 cursor-pointer shadow-sm"
          >
            <option value="free">Free Starter (10 Students • Rs. 0)</option>
            <option value="tuition">Tuition Center (50 Students • Rs. 1,999/mo)</option>
            <option value="academy">Academy Pro (UNLIMITED • Rs. 4,499/mo)</option>
          </select>
          <Link
            href="/admin/plan"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-pink-600 dark:text-pink-400 hover:text-white bg-pink-500/10 hover:bg-pink-600 dark:hover:bg-pink-500/30 border border-pink-500/30 transition-all cursor-pointer shadow-sm"
          >
            <span>Billing & Plans</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Quota Progress Trackers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Student Capacity */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-pink-500" /> Student Capacity
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {studentCount} / {isUnlimitedPlan ? "Unlimited" : plan.maxStudents}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isUnlimitedPlan
                  ? "bg-emerald-500"
                  : studentPct >= 100
                  ? "bg-rose-500"
                  : studentPct >= 80
                  ? "bg-amber-400"
                  : "bg-gradient-to-r from-pink-500 to-rose-500"
              }`}
              style={{ width: isUnlimitedPlan ? "100%" : `${studentPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>{isUnlimitedPlan ? "★ Unlimited Capacity" : `${studentPct}% utilized`}</span>
            {!isUnlimitedPlan && studentCount >= plan.maxStudents && (
              <span className="text-rose-500 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Plan limit reached
              </span>
            )}
          </div>
        </div>

        {/* Teacher Seats */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> Tutor Seats
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {teacherCount} / {isUnlimitedPlan ? "Unlimited" : plan.maxTeachers}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isUnlimitedPlan
                  ? "bg-emerald-500"
                  : teacherPct >= 100 ? "bg-rose-500" : "bg-gradient-to-r from-emerald-500 to-teal-500"
              }`}
              style={{ width: isUnlimitedPlan ? "100%" : `${teacherPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>{isUnlimitedPlan ? "★ Unlimited Tutors" : `${teacherPct}% utilized`}</span>
            {!isUnlimitedPlan && teacherCount >= plan.maxTeachers && (
              <span className="text-rose-500 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Seat full
              </span>
            )}
          </div>
        </div>

        {/* Course / Batch Limit */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> Active Batches
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {courseCount} / {isUnlimitedPlan ? "Unlimited" : plan.maxCourses}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isUnlimitedPlan
                  ? "bg-indigo-500"
                  : "bg-gradient-to-r from-indigo-500 to-purple-500"
              }`}
              style={{ width: isUnlimitedPlan ? "100%" : `${coursePct}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>{isUnlimitedPlan ? "★ Unlimited Batches" : `${coursePct}% utilized`}</span>
            {!isUnlimitedPlan && courseCount >= plan.maxCourses && (
              <span className="text-rose-500 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Max batches
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard(props: {
  href: string;
  label: string;
  value: number;
  icon: IconName;
  iconGradient: string;
  linkClass: string;
  linkText: string;
}) {
  return (
    <Link
      href={props.href}
      className="group relative bg-white dark:bg-slate-900/80 rounded-2xl shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-white/10 p-6 flex flex-col justify-between hover:shadow-lg dark:hover:border-pink-500/30 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">
            {props.label}
          </p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {props.value}
          </h3>
        </div>
        <div
          className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${props.iconGradient} text-white flex items-center justify-center shadow-md`}
        >
          <Icon name={props.icon} className="w-5 h-5 text-white" />
        </div>
      </div>
      <span
        className={`text-xs font-bold flex items-center mt-3 pt-3 border-t border-gray-100 dark:border-white/5 ${props.linkClass}`}
      >
        <span>{props.linkText}</span>
        <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
      </span>
    </Link>
  );
}

const QUICK = [
  { href: "/admin/students?new=1", label: "Add Student Scholar", tag: "Enrollment" },
  { href: "/admin/teachers?new=1", label: "Provision Faculty Member", tag: "Personnel" },
  { href: "/admin/courses?new=1", label: "Configure New Course", tag: "Curriculum" },
  { href: "/admin/fee-challans", label: "Reconcile Fee Challan", tag: "Finance" },
];

export default function DashboardView() {
  const { students, teachers, courses, enrollments } = useAdminData();
  const requests = useAsync(fetchEnrollmentRequests, none);
  const pending = requests.error ? 0 : requests.data?.length ?? 0;
  const activeUsers = students.data.length + teachers.data.length + 1;

  return (
    <div id="dashboard" className="w-full lg:max-w-6xl lg:mx-auto space-y-8">
      {/* Admin Mission Control Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-pink-500/10 via-rose-500/5 to-purple-500/10 border border-pink-500/20 p-6 sm:p-8 backdrop-blur-xl overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 text-pink-500 dark:text-pink-400 text-xs font-bold tracking-wide mb-2.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Campus Governance & Database Core</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Administrator Mission Control
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-1.5">
              Manage university scholars, faculty personnel, course catalogs, and cloud database records.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-xs font-bold flex items-center gap-2 text-emerald-500 dark:text-emerald-400 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Supabase Cloud Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Academy Subscription Plan & Capacity Widget */}
      <AcademyPlanStatusCard
        studentCount={students.data.length}
        teacherCount={teachers.data.length}
        courseCount={courses.data.length}
      />

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          href="/admin/students"
          label="Total Students"
          value={students.data.length}
          icon="users"
          iconGradient="from-blue-500 to-cyan-600"
          linkClass="text-blue-500 hover:text-blue-600 dark:text-cyan-400"
          linkText="Manage Students"
        />
        <StatCard
          href="/admin/teachers"
          label="Total Faculty"
          value={teachers.data.length}
          icon="user-check"
          iconGradient="from-emerald-500 to-teal-600"
          linkClass="text-emerald-500 hover:text-emerald-600 dark:text-emerald-400"
          linkText="Manage Teachers"
        />
        <StatCard
          href="/admin/courses"
          label="Total Courses"
          value={courses.data.length}
          icon="book-open"
          iconGradient="from-indigo-500 to-purple-600"
          linkClass="text-indigo-500 hover:text-indigo-600 dark:text-purple-400"
          linkText="Manage Courses"
        />
        <StatCard
          href="/admin/enrollment-requests"
          label="Pending Approvals"
          value={pending}
          icon="inbox"
          iconGradient="from-pink-500 to-rose-600"
          linkClass="text-pink-500 hover:text-pink-600 dark:text-rose-400"
          linkText="Review Requests"
        />
      </div>

      {/* Grid: Quick Actions & System Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/80 rounded-2xl shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-white/10 p-6 sm:p-7">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
            <Zap className="w-5 h-5 text-pink-500" />
            <span>Administrative Direct Actions</span>
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {QUICK.map((q) => (
              <Link
                key={q.href}
                href={q.href}
                className="w-full bg-slate-50 dark:bg-slate-800/60 hover:bg-gradient-to-r hover:from-pink-500 hover:to-rose-600 hover:text-white text-slate-700 dark:text-slate-300 p-4 rounded-xl border border-slate-200 dark:border-white/5 font-semibold text-xs transition-all flex flex-col justify-between group shadow-2xs min-h-[90px]"
              >
                <div className="flex justify-between items-start">
                  <span className="text-sm font-bold">{q.label}</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-pink-500/10 text-pink-500 group-hover:bg-white/20 group-hover:text-white transition-colors">
                    {q.tag}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 group-hover:text-white pt-2">
                  <span>Open Module</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* System Statistics Widget */}
        <Link
          href="/admin/enrollments"
          className="group bg-white dark:bg-slate-900/80 rounded-2xl shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-white/10 p-6 sm:p-7 hover:border-pink-500/30 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-pink-500" />
              <span>Live System Statistics</span>
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-4 bg-pink-500/5 dark:bg-pink-500/10 rounded-xl border border-pink-500/10">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Total Enrollments
                </span>
                <span className="text-2xl font-black text-pink-500">
                  {enrollments.data.length}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-blue-500/5 dark:bg-blue-500/10 rounded-xl border border-blue-500/10">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Active User Accounts
                </span>
                <span className="text-2xl font-black text-blue-500 dark:text-cyan-400">
                  {activeUsers}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs font-bold text-pink-500 dark:text-pink-400">
            <span>View All Enrollments</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
}
