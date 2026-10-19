"use client";

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
} from "lucide-react";

const none = null;

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
