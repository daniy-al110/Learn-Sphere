"use client";

import { useMemo, useState } from "react";
import { EmptyState, FilterBar, LoadingBlock, PageHeading } from "./shared";
import { useAsync } from "@/hooks/useAsync";
import { useSession } from "@/hooks/useSession";
import { fetchAttendance } from "@/lib/student/api";
import { filterAttendance } from "@/lib/student/helpers";

export default function AttendanceView() {
  const { session } = useSession();
  const studentId = session.userId ?? "";
  const { data, error, loading, reload } = useAsync(fetchAttendance, studentId);

  const [search, setSearch] = useState("");
  const [standing, setStanding] = useState("all");
  const [sort, setSort] = useState("name_asc");
  const visible = useMemo(() => filterAttendance(data ?? [], search, standing, sort), [data, search, standing, sort]);

  let body: React.ReactNode;
  if (loading) {
    body = <LoadingBlock text="Loading attendance records..." />;
  } else if (error) {
    console.error("Error loading attendance:", error);
    body = (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-sm">
        <div className="font-bold">Error</div>
        <div>{error.message}</div>
        <button onClick={reload} className="mt-2 bg-red-600 text-white px-4 py-2 rounded-sm hover:bg-red-700 cursor-pointer">
          Try Again
        </button>
      </div>
    );
  } else if (visible.length === 0) {
    body = <EmptyState text="No attendance records found matching your filters." card="rounded-xl shadow-sm" />;
  } else {
    body = (
      <div className="grid gap-6">
        {visible.map((course, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold mb-2">{course.course_name}</h3>
                <div className="flex gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500" /> Present: {course.present_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" /> Absent: {course.absent_count}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    course.attendance_percentage >= 75 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {course.attendance_percentage}% Attendance
                </span>
              </div>
            </div>
            <div className="border-t pt-4 mt-4">
              <h4 className="font-semibold mb-2 text-gray-700">Attendance History</h4>
              <div className="grid gap-2 max-h-48 overflow-y-auto pr-1">
                {(course.attendance_details || []).map((record, j) => {
                  const present = record.status === "present";
                  return (
                    <div key={j} className={`flex justify-between items-center py-2 px-3 rounded-sm ${present ? "bg-green-50" : "bg-red-50"}`}>
                      <span className="text-sm text-gray-600">{new Date(record.date).toLocaleDateString()}</span>
                      <span className={`px-2 py-1 rounded-sm text-xs font-semibold ${present ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {record.status.toUpperCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto" id="attendance">
      <PageHeading
        title="My Attendance"
        subtitle="Track your attendance statistics, status records, and course standing details."
      />
      <FilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Search attendance by course name..."
        selects={[
          {
            value: standing,
            onChange: setStanding,
            options: [["all", "All Standings"], ["good", "Good Standing (>= 75%)"], ["risk", "At Risk (< 75%)"]],
          },
          {
            value: sort,
            onChange: setSort,
            options: [
              ["name_asc", "Course Name (A-Z)"], ["name_desc", "Course Name (Z-A)"],
              ["pct_desc", "Highest Attendance"], ["pct_asc", "Lowest Attendance"],
            ],
          },
        ]}
      />
      <div id="attendanceGrid" className="grid gap-6">{body}</div>
    </div>
  );
}
