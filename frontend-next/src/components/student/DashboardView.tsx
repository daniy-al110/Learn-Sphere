"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/layout/icons";
import { useSession } from "@/hooks/useSession";
import { useAsync } from "@/hooks/useAsync";
import {
  fetchCourseName,
  fetchGrades,
  fetchPendingTaskCount,
  fetchStudentEnrollments,
  fetchAttendance,
} from "@/lib/student/api";
import {
  BookOpen,
  CalendarCheck,
  Clock,
  Award,
  ArrowRight,
  Zap,
  Calendar,
  Sparkles,
  CheckCircle,
} from "lucide-react";

const Spin = () => (
  <span className="inline-block w-6 h-6 border-2 border-slate-300 dark:border-slate-700 border-t-pink-500 rounded-full animate-spin" />
);

async function loadEnrollmentWidget(studentId: string) {
  const data = await fetchStudentEnrollments(studentId);
  if (!data.success || !Array.isArray(data.enrollments))
    return { count: 0, classes: null as string[] | null };
  const sample = data.enrollments.slice(0, 3);
  const names: string[] = [];
  for (const e of sample) {
    const name = await fetchCourseName(e.course_id);
    if (name != null) names.push(name);
  }
  return { count: data.enrollments.length, classes: names };
}

async function loadAttendanceWidget(studentId: string): Promise<number | null> {
  const res = await fetchAttendance(studentId).catch(() => []);
  if (!res.length) return null;
  const present = res.reduce((s, r) => s + (r.present_count || 0), 0);
  const absent = res.reduce((s, r) => s + (r.absent_count || 0), 0);
  const total = present + absent;
  return total > 0 ? Math.round((present / total) * 100) : 100;
}

async function loadCgpaWidget(studentId: string): Promise<string> {
  try {
    const rows = await fetchGrades(studentId);
    if (!rows.length) return "N/A";
    let totalScore = 0;
    let totalWeight = 0;
    rows.forEach((g) => {
      const mark = Number(g.marks_obtained);
      if (!isNaN(mark)) {
        totalScore += mark;
        totalWeight += 100;
      }
    });
    const avg = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
    const cgpa = (avg / 100) * 4.0;
    return cgpa > 0 ? cgpa.toFixed(2) : "N/A";
  } catch {
    return "N/A";
  }
}

function StatCard(props: {
  label: string;
  icon: IconName;
  iconGradient: string;
  linkClass: string;
  href: string;
  linkText: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative bg-white dark:bg-slate-900/80 rounded-2xl shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-white/10 p-6 flex flex-col justify-between hover:shadow-lg dark:hover:border-pink-500/30 transition-all duration-300 hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">
            {props.label}
          </p>
          {props.children}
        </div>
        <div
          className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${props.iconGradient} text-white flex items-center justify-center shadow-md`}
        >
          <Icon name={props.icon} className="w-5 h-5 text-white" />
        </div>
      </div>
      <Link
        href={props.href}
        className={`text-xs font-bold flex items-center mt-3 pt-3 border-t border-gray-100 dark:border-white/5 ${props.linkClass}`}
      >
        <span>{props.linkText}</span>
        <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}

const QUICK = [
  { href: "/student/courses", label: "Browse Catalog", icon: "book-open" },
  { href: "/student/assignments", label: "Submit Assignment", icon: "file-text" },
  { href: "/student/quizzes", label: "Take Quiz", icon: "edit-3" },
  { href: "/student/transcript", label: "View Transcripts", icon: "award" },
];

export default function DashboardView() {
  const { session } = useSession();
  const studentId = session.userId ?? "";
  const name = session.userName || "Student";

  const enroll = useAsync(loadEnrollmentWidget, studentId);
  const attendance = useAsync(loadAttendanceWidget, studentId);
  const pending = useAsync(fetchPendingTaskCount, studentId);
  const cgpa = useAsync(loadCgpaWidget, studentId);

  const pct = attendance.data;
  const attColor =
    pct == null
      ? "text-slate-500"
      : pct < 75
      ? "text-rose-500"
      : "text-emerald-500";

  return (
    <div className="w-full lg:max-w-6xl lg:mx-auto space-y-8" id="dashboard">
      {/* Welcome Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-pink-500/10 via-rose-500/5 to-indigo-500/10 border border-pink-500/20 p-6 sm:p-8 backdrop-blur-xl overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 text-pink-500 dark:text-pink-400 text-xs font-bold tracking-wide mb-2.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Spring 2026 Academic Term</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                {name}
              </span>
              ! 👋
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-1.5">
              Here is your real-time academic standing and daily curriculum overview.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/student/courses"
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-md shadow-pink-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Explore Courses</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Enrolled Courses"
          icon="book-open"
          iconGradient="from-blue-500 to-cyan-600"
          linkClass="text-blue-500 hover:text-blue-600 dark:text-cyan-400"
          href="/student/courses"
          linkText="View Courses"
        >
          <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {enroll.loading || enroll.error ? <Spin /> : enroll.data?.count}
          </h3>
        </StatCard>

        <StatCard
          label="Overall Attendance"
          icon="calendar-check"
          iconGradient="from-emerald-500 to-teal-600"
          linkClass="text-emerald-500 hover:text-emerald-600 dark:text-emerald-400"
          href="/student/attendance"
          linkText="View Details"
        >
          {attendance.loading ? (
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">
              <Spin />
            </h3>
          ) : (
            <h3 className={`text-3xl font-black tracking-tight ${attColor}`}>
              {pct == null ? "N/A" : `${pct}%`}
            </h3>
          )}
        </StatCard>

        <StatCard
          label="Pending Tasks"
          icon="clock"
          iconGradient="from-amber-500 to-orange-600"
          linkClass="text-amber-500 hover:text-amber-600 dark:text-amber-400"
          href="/student/assignments"
          linkText="Go to Assignments"
        >
          <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {pending.loading ? <Spin /> : pending.data}
          </h3>
        </StatCard>

        <StatCard
          label="Average CGPA"
          icon="award"
          iconGradient="from-indigo-500 to-purple-600"
          linkClass="text-indigo-500 hover:text-indigo-600 dark:text-purple-400"
          href="/student/transcript"
          linkText="View Transcript"
        >
          <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {cgpa.loading ? <Spin /> : cgpa.data}
          </h3>
        </StatCard>
      </div>

      {/* Grid: Schedule & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/80 rounded-2xl shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-white/10 p-6 sm:p-7">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-pink-500" />
              <span>Today&apos;s Academic Schedule</span>
            </h2>
            <Link
              href="/student/schedule"
              className="text-xs font-semibold text-pink-500 hover:text-pink-600 dark:text-pink-400"
            >
              Full Calendar →
            </Link>
          </div>

          <div className="space-y-3">
            {enroll.loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl" />
              </div>
            ) : enroll.error || enroll.data?.classes == null || enroll.data.count === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-white/10">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No active lectures scheduled for today. Take time to review upcoming coursework!
                </p>
              </div>
            ) : (
              enroll.data.classes.map((courseName, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-white/5 hover:border-pink-500/30 transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-500 dark:text-pink-400 flex items-center justify-center font-bold text-sm">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {courseName}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Interactive Lecture Session</span>
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/student/meetings"
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-pink-500 dark:text-pink-400 bg-pink-500/10 hover:bg-pink-500/20 transition-colors"
                  >
                    Join Room
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-white dark:bg-slate-900/80 rounded-2xl shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-white/10 p-6 sm:p-7">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
            <Zap className="w-5 h-5 text-pink-500" />
            <span>Quick Workflows</span>
          </h2>
          <div className="space-y-2.5">
            {QUICK.map((q) => (
              <Link
                key={q.href}
                href={q.href}
                className="w-full bg-slate-50 dark:bg-slate-800/60 hover:bg-gradient-to-r hover:from-pink-500 hover:to-rose-600 hover:text-white text-slate-700 dark:text-slate-300 px-4 py-3 rounded-xl border border-slate-200 dark:border-white/5 font-semibold text-xs transition-all flex items-center justify-between group shadow-2xs"
              >
                <span>{q.label}</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-transform" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
