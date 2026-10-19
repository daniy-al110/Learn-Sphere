"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/layout/icons";
import { useAsync } from "@/hooks/useAsync";
import { useSession } from "@/hooks/useSession";
import { fetchDashboardStats } from "@/lib/teacher/api";
import {
  BookOpen,
  Users,
  CheckCircle,
  Edit3,
  ArrowRight,
  Zap,
  Sparkles,
  Award,
} from "lucide-react";

const Spin = () => (
  <span className="inline-block w-6 h-6 border-2 border-slate-300 dark:border-slate-700 border-t-pink-500 rounded-full animate-spin" />
);

function Widget(props: {
  href?: string;
  label: string;
  value: React.ReactNode;
  icon: IconName;
  iconGradient: string;
  footer: React.ReactNode;
}) {
  const inner = (
    <div
      className={`group relative bg-white dark:bg-slate-900/80 rounded-2xl shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-white/10 p-6 flex flex-col justify-between hover:shadow-lg dark:hover:border-pink-500/30 transition-all duration-300 hover:-translate-y-1 h-full ${
        props.href ? "cursor-pointer" : ""
      }`}
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
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
        {props.footer}
      </div>
    </div>
  );
  return props.href ? (
    <Link href={props.href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}

const ARROW = <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />;

const QUICK = [
  { href: "/teacher/attendance", label: "Mark Lesson Attendance", icon: "calendar" },
  { href: "/teacher/assignments", label: "Review Student Submissions", icon: "file-text" },
  { href: "/teacher/quizzes", label: "Manage Course Quizzes", icon: "edit-3" },
  { href: "/teacher/marks", label: "Update Central Gradebook", icon: "check-square" },
];

export default function DashboardView() {
  const { session } = useSession();
  const { data, loading } = useAsync(fetchDashboardStats, session.userId ?? "");
  const name = session.userName || "Instructor";
  const noCourses = !loading && data?.courseCount === 0;
  const v = (n: number | undefined) => (loading ? <Spin /> : n);

  return (
    <div id="dashboard" className="w-full lg:max-w-6xl lg:mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-pink-500/10 border border-indigo-500/20 p-6 sm:p-8 backdrop-blur-xl overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 text-xs font-bold tracking-wide mb-2.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Faculty Studio & Course Operations</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                {name}
              </span>
              ! 👋
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-1.5">
              Here is an overview of your active teaching sections and grading ledger.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/teacher/courses"
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Manage Courses</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {noCourses ? (
        <div className="bg-white dark:bg-slate-900/80 rounded-3xl shadow-md border-2 border-dashed border-gray-200 dark:border-white/10 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-500 mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Courses Assigned Yet</h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md mx-auto mb-6">
            You haven&apos;t been assigned any teaching sections yet. Contact your department administrator to configure course allocations.
          </p>
          <Link
            href="/teacher/courses"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <span>Check Course Roster</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <Widget
              href="/teacher/courses"
              label="Courses Taught"
              value={v(data?.courseCount)}
              icon="book-open"
              iconGradient="from-blue-500 to-cyan-600"
              footer={
                <span className="text-blue-500 dark:text-cyan-400 text-xs font-bold flex items-center">
                  <span>View All</span> {ARROW}
                </span>
              }
            />
            <Widget
              label="Total Enrolled"
              value={v(data?.totalStudents)}
              icon="users"
              iconGradient="from-emerald-500 to-teal-600"
              footer={
                <span className="text-emerald-500 dark:text-emerald-400 text-xs font-bold flex items-center">
                  <span>Across all sections</span>
                </span>
              }
            />
            <Widget
              href="/teacher/assignments"
              label="Pending Grading"
              value={v(data?.pendingGrading)}
              icon="check-circle"
              iconGradient="from-amber-500 to-orange-600"
              footer={
                <span className="text-amber-500 dark:text-amber-400 text-xs font-bold flex items-center">
                  <span>Grade Now</span> {ARROW}
                </span>
              }
            />
            <Widget
              href="/teacher/quizzes"
              label="Active Quizzes"
              value={v(data?.activeQuizzes)}
              icon="edit-3"
              iconGradient="from-indigo-500 to-purple-600"
              footer={
                <span className="text-indigo-500 dark:text-purple-400 text-xs font-bold flex items-center">
                  <span>Manage</span> {ARROW}
                </span>
              }
            />
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-white dark:bg-slate-900/80 rounded-2xl shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-white/10 p-6 sm:p-7">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-500" />
              <span>Teaching Workflows</span>
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {QUICK.map((q) => (
                <Link
                  key={q.href}
                  href={q.href}
                  className="bg-slate-50 dark:bg-slate-800/60 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-600 hover:text-white text-slate-700 dark:text-slate-300 p-4 rounded-xl border border-slate-200 dark:border-white/5 font-semibold text-xs transition-all flex flex-col justify-between group shadow-2xs min-h-[90px]"
                >
                  <span className="text-sm font-bold">{q.label}</span>
                  <div className="flex items-center justify-between text-xs text-slate-400 group-hover:text-white pt-2">
                    <span>Execute</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
