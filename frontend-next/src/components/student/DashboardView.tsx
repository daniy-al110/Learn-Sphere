"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/layout/icons";
import { useSession } from "@/hooks/useSession";
import { useAsync } from "@/hooks/useAsync";
import {
  fetchCourseName, fetchGrades, fetchPendingTaskCount, fetchStudentEnrollments,
} from "@/lib/student/api";
import { fetchAttendance } from "@/lib/student/api";

const Spin = () => (
  <span className="inline-block w-8 h-8 border-2 border-gray-300 border-t-accent rounded-full animate-spin" />
);

/* Each widget loads independently (the old code did them in sequence in one function). */

async function loadEnrollmentWidget(studentId: string) {
  const data = await fetchStudentEnrollments(studentId);
  if (!data.success || !Array.isArray(data.enrollments)) return { count: 0, classes: null as string[] | null };
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
  tint: string; // e.g. "bg-blue-100 text-blue-600"
  linkClass: string;
  href: string;
  linkText: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 flex flex-col justify-between hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">{props.label}</p>
          {props.children}
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${props.tint}`}>
          <Icon name={props.icon} className="w-5 h-5" />
        </div>
      </div>
      <Link href={props.href} className={`text-sm font-semibold flex items-center mt-2 ${props.linkClass}`}>
        {props.linkText} <Icon name="arrow-right" className="w-4 h-4 ml-1" />
      </Link>
    </div>
  );
}

const QUICK = [
  { href: "/student/courses", label: "Browse Catalog" },
  { href: "/student/assignments", label: "Submit Assignment" },
  { href: "/student/quizzes", label: "Take Quiz" },
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
  const attClass = pct == null ? "text-gray-500" : pct < 75 ? "text-red-500" : "text-green-500";

  return (
    <div className="p-8 w-full lg:max-w-6xl lg:mx-auto" id="dashboard">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Welcome back, <span className="text-accent">{name}</span>! 👋
        </h1>
        <p className="text-gray-600 text-lg">Here&apos;s your academic overview for this semester.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard label="Enrolled Courses" icon="book-open" tint="bg-blue-100 text-blue-600"
          linkClass="text-blue-600 hover:text-blue-800" href="/student/courses" linkText="View Courses">
          <h3 className="text-3xl font-bold text-gray-900">{enroll.loading || enroll.error ? <Spin /> : enroll.data?.count}</h3>
        </StatCard>

        <StatCard label="Overall Attendance" icon="calendar-check" tint="bg-green-100 text-green-600"
          linkClass="text-green-600 hover:text-green-800" href="/student/attendance" linkText="View Details">
          {attendance.loading ? (
            <h3 className="text-3xl font-bold text-gray-900"><Spin /></h3>
          ) : (
            <h3 className={`text-3xl font-bold ${attClass}`}>{pct == null ? "N/A" : `${pct}%`}</h3>
          )}
        </StatCard>

        <StatCard label="Pending Tasks" icon="clock" tint="bg-orange-100 text-orange-600"
          linkClass="text-orange-600 hover:text-orange-800" href="/student/assignments" linkText="Go to Assignments">
          <h3 className="text-3xl font-bold text-gray-900">{pending.loading ? <Spin /> : pending.data}</h3>
        </StatCard>

        <StatCard label="Average CGPA" icon="award" tint="bg-purple-100 text-purple-600"
          linkClass="text-purple-600 hover:text-purple-800" href="/student/transcript" linkText="View Transcript">
          <h3 className="text-3xl font-bold text-gray-900">{cgpa.loading ? <Spin /> : cgpa.data}</h3>
        </StatCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Icon name="calendar" className="w-5 h-5 mr-2 text-accent" /> Today&apos;s Schedule
          </h2>
          <div className="space-y-3">
            {enroll.loading ? (
              <div className="animate-pulse flex space-x-4">
                <div className="rounded bg-slate-200 h-10 w-10" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="space-y-3"><div className="h-4 bg-slate-200 rounded" /></div>
                </div>
              </div>
            ) : enroll.error || enroll.data?.classes == null ? (
              <p className="text-gray-500 italic">No classes scheduled.</p>
            ) : enroll.data.count === 0 ? (
              <p className="text-gray-500 italic">No classes scheduled today. Go explore courses!</p>
            ) : (
              enroll.data.classes.map((courseName, i) => (
                <div key={i} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                  <div className="bg-blue-100 text-blue-700 p-2 rounded-lg shrink-0">
                    <Icon name="book-open" className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{courseName}</h4>
                    <p className="text-sm text-gray-500">
                      <Icon name="clock" className="w-3 h-3 inline" /> Coming Soon
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Icon name="zap" className="w-5 h-5 mr-2 text-accent" /> Quick Actions
          </h2>
          <div className="space-y-3">
            {QUICK.map((q) => (
              <Link
                key={q.href}
                href={q.href}
                className="w-full bg-gray-50 hover:bg-accent hover:text-white text-gray-700 text-left px-4 py-3 rounded-lg border border-gray-200 font-medium transition-colors flex items-center justify-between group"
              >
                <span>{q.label}</span>
                <Icon name="chevron-right" className="w-4 h-4 text-gray-400 group-hover:text-white" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
