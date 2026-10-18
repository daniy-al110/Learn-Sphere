"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/layout/icons";
import { useAdminData } from "./AdminDataProvider";
import { useAsync } from "@/hooks/useAsync";
import { fetchEnrollmentRequests } from "@/lib/admin/api";

const none = null;

function StatCard(props: { href: string; label: string; value: number; icon: IconName; tint: string; linkClass: string; linkText: string }) {
  return (
    <Link
      href={props.href}
      className="bg-white rounded-xl shadow-md border border-gray-100 p-6 flex flex-col justify-between hover:shadow-lg transition-shadow cursor-pointer"
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
      <span className={`text-sm font-semibold flex items-center mt-2 ${props.linkClass}`}>
        {props.linkText} <Icon name="arrow-right" className="w-4 h-4 ml-1" />
      </span>
    </Link>
  );
}

const QUICK = [
  { href: "/admin/students?new=1", label: "Add Student" },
  { href: "/admin/teachers?new=1", label: "Add Teacher" },
  { href: "/admin/courses?new=1", label: "Create Course" },
  { href: "/admin/fee-challans", label: "Issue Fee Challan" },
];

export default function DashboardView() {
  const { students, teachers, courses, enrollments } = useAdminData();
  const requests = useAsync(fetchEnrollmentRequests, none);
  const pending = requests.error ? 0 : (requests.data?.length ?? 0);
  // same formula as updateActiveUsers(): students + teachers + the admin
  const activeUsers = students.data.length + teachers.data.length + 1;

  return (
    <div id="dashboard" className="w-full lg:max-w-6xl lg:mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">System Dashboard</h1>
        <p className="text-gray-600 text-lg">Manage students, teachers, courses, enrollments, and approvals from one place.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard href="/admin/students" label="Total Students" value={students.data.length} icon="users" tint="bg-blue-100 text-blue-600" linkClass="text-blue-600" linkText="Manage Students" />
        <StatCard href="/admin/teachers" label="Total Teachers" value={teachers.data.length} icon="user-check" tint="bg-green-100 text-green-600" linkClass="text-green-600" linkText="Manage Teachers" />
        <StatCard href="/admin/courses" label="Total Courses" value={courses.data.length} icon="book-open" tint="bg-purple-100 text-purple-600" linkClass="text-purple-600" linkText="Manage Courses" />
        <StatCard href="/admin/enrollment-requests" label="Pending Approvals" value={pending} icon="inbox" tint="bg-orange-100 text-orange-600" linkClass="text-orange-600" linkText="Review Requests" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-gray-100 p-6">
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

        <Link href="/admin/enrollments" className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow cursor-pointer block">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Icon name="bar-chart-2" className="w-5 h-5 mr-2 text-accent" /> System Statistics
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-pink-50 rounded-lg border border-pink-100">
              <span className="text-sm font-medium text-gray-700">Total Enrollments</span>
              <span className="text-2xl font-bold text-accent">{enrollments.data.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
              <span className="text-sm font-medium text-gray-700">Active Users</span>
              <span className="text-2xl font-bold text-blue-600">{activeUsers}</span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
