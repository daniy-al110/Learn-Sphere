"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/layout/icons";
import { useAsync } from "@/hooks/useAsync";
import { useSession } from "@/hooks/useSession";
import { fetchDashboardStats } from "@/lib/teacher/api";

const Spin = () => <span className="inline-block w-8 h-8 border-2 border-gray-300 border-t-accent rounded-full animate-spin" />;

function Widget(props: {
  href?: string;
  label: string;
  value: React.ReactNode;
  icon: IconName;
  tint: string;
  footer: React.ReactNode;
}) {
  const inner = (
    <div
      className={`bg-white rounded-xl shadow-md border border-gray-100 p-6 flex flex-col justify-between hover:shadow-lg transition-shadow h-full ${
        props.href ? "cursor-pointer" : ""
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">{props.label}</p>
          <h3 className="text-3xl font-bold text-gray-900">{props.value}</h3>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${props.tint}`}>
          <Icon name={props.icon} className="w-5 h-5" />
        </div>
      </div>
      {props.footer}
    </div>
  );
  return props.href ? <Link href={props.href} className="block">{inner}</Link> : inner;
}

const ARROW = <Icon name="arrow-right" className="w-4 h-4 ml-1" />;

const QUICK = [
  { href: "/teacher/attendance", label: "Mark Attendance" },
  { href: "/teacher/assignments", label: "Grade Assignments" },
  { href: "/teacher/quizzes", label: "Manage Quizzes" },
  { href: "/teacher/marks", label: "Update Student Marks" },
];

export default function DashboardView() {
  const { session } = useSession();
  const { data, loading } = useAsync(fetchDashboardStats, session.userId ?? "");
  const name = session.userName || "Teacher";
  const noCourses = !loading && data?.courseCount === 0;
  const v = (n: number | undefined) => (loading ? <Spin /> : n);

  return (
    <div id="dashboard" className="w-full lg:max-w-6xl lg:mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Welcome back, <span className="text-accent">{name}</span>! 👋
        </h1>
        <p className="text-gray-600 text-lg">Here&apos;s an overview of your teaching activities this semester.</p>
      </div>

      {noCourses ? (
        <div className="bg-white rounded-xl shadow-md border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Icon name="book-open" className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Courses Taught Yet</h3>
          <p className="text-gray-600 mb-6">You haven&apos;t been assigned any courses yet. Contact your administrator to get started.</p>
          <Link href="/teacher/courses" className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-lg font-semibold hover:bg-accent-hover transition-all">
            <Icon name="arrow-right" className="w-4 h-4" /> Go to My Courses
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Widget
              href="/teacher/courses" label="Courses Taught" value={v(data?.courseCount)} icon="book-open" tint="bg-blue-100 text-blue-600"
              footer={<span className="text-blue-600 text-sm font-semibold flex items-center mt-2">View All {ARROW}</span>}
            />
            <Widget
              label="Total Students Enrolled" value={v(data?.totalStudents)} icon="users" tint="bg-green-100 text-green-600"
              footer={<span className="text-green-600 text-sm font-semibold flex items-center mt-2">Across your courses</span>}
            />
            <Widget
              href="/teacher/assignments" label="Pending Grading" value={v(data?.pendingGrading)} icon="check-circle" tint="bg-orange-100 text-orange-600"
              footer={<span className="text-orange-600 text-sm font-semibold flex items-center mt-2">Grade Now {ARROW}</span>}
            />
            <Widget
              href="/teacher/quizzes" label="Active Quizzes" value={v(data?.activeQuizzes)} icon="edit-3" tint="bg-purple-100 text-purple-600"
              footer={<span className="text-purple-600 text-sm font-semibold flex items-center mt-2">Manage {ARROW}</span>}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-3 bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Icon name="activity" className="w-5 h-5 mr-2 text-accent" /> Quick Actions
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
        </>
      )}
    </div>
  );
}
