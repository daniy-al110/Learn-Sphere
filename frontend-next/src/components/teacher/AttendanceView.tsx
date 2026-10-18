"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/layout/icons";
import CourseSelect from "./CourseSelect";
import { useAsync } from "@/hooks/useAsync";
import { useCourseParam } from "@/hooks/useCourseParam";
import { fetchCourseStudents, saveAttendance } from "@/lib/teacher/api";
import { toast } from "@/lib/toast-store";

type Status = "present" | "absent";
interface Row {
  student_id: number | string;
  name: string;
  attendancePercentage: number;
}

async function loadRows(courseId: string): Promise<Row[]> {
  if (!courseId) return [];
  const students = await fetchCourseStudents(courseId);
  return students.map((s) => {
    const present = s.present_count || 0;
    const total = present + (s.absent_count || 0);
    return {
      student_id: s.student_id,
      name: s.name,
      attendancePercentage: total > 0 ? (present / total) * 100 : 100,
    };
  });
}

const TH = "px-6 py-4 font-bold text-gray-700 uppercase tracking-wider";

export default function AttendanceView() {
  const [courseId, setCourseId] = useCourseParam();
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [search, setSearch] = useState("");
  const { data, error, loading, reload } = useAsync(loadRows, courseId);
  if (error) console.error("Error loading students:", error);

  // status per student; anyone not in the map defaults to "present"
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const rows = useMemo(() => data ?? [], [data]);
  const statusOf = (r: Row): Status => statuses[String(r.student_id)] ?? "present";

  const query = search.toLowerCase().trim();
  const filtered = rows.filter((r) => r.name.toLowerCase().includes(query));
  const presentCount = rows.filter((r) => statusOf(r) === "present").length;

  function changeCourse(id: string) {
    setStatuses({});
    setCourseId(id);
  }

  function bulk(status: Status) {
    if (rows.length === 0) return toast.warning("No students loaded to mark.");
    // only filtered/visible students are marked, as before
    setStatuses((prev) => {
      const next = { ...prev };
      rows.forEach((r) => {
        if (r.name.toLowerCase().includes(query)) next[String(r.student_id)] = status;
      });
      return next;
    });
    toast.success(`Marked matching roster as ${status}.`);
  }

  async function submit() {
    if (!courseId || !date) return toast.warning("Please select a course and date");
    if (rows.length === 0) return toast.warning("No students on roster to submit attendance for.");
    try {
      const resp = await saveAttendance(
        courseId,
        rows.map((r) => ({ studentId: r.student_id, status: statusOf(r), date })),
      );
      if (resp.success) {
        toast.success("Attendance saved successfully");
        setStatuses({}); // roster reload resets everyone to present, like before
        reload();
      } else {
        toast.error("Failed to save: " + (resp.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error saving attendance:", err);
      toast.error("Network error while saving attendance");
    }
  }

  let tbody: React.ReactNode;
  if (courseId && loading) {
    tbody = (
      <tr>
        <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold">Loading student roster...</span>
          </div>
        </td>
      </tr>
    );
  } else if (courseId && error) {
    tbody = (
      <tr>
        <td colSpan={3} className="px-6 py-8 text-center text-red-500 font-medium">
          Failed to load students. Please check your network connection.
        </td>
      </tr>
    );
  } else if (filtered.length === 0) {
    tbody = (
      <tr>
        <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
          <div className="flex flex-col items-center justify-center gap-2">
            <Icon name="users" className="w-10 h-10 text-gray-300" />
            <span className="font-semibold text-sm">No students match your query.</span>
          </div>
        </td>
      </tr>
    );
  } else {
    tbody = filtered.map((r) => {
      const isPresent = statusOf(r) === "present";
      const sid = String(r.student_id);
      return (
        <tr key={sid} className="hover:bg-gray-50 transition-colors">
          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{r.name}</td>
          <td className={`px-6 py-4 whitespace-nowrap text-sm ${r.attendancePercentage < 75 ? "text-red-600 font-bold" : "text-gray-600"}`}>
            {r.attendancePercentage.toFixed(1)}%
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
            <div className="inline-flex rounded-lg p-0.5 bg-gray-100 border border-gray-200">
              <button
                type="button"
                onClick={() => setStatuses((s) => ({ ...s, [sid]: "present" }))}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${isPresent ? "bg-green-500 text-white shadow-xs" : "text-gray-500 hover:text-gray-900"}`}
              >
                Present
              </button>
              <button
                type="button"
                onClick={() => setStatuses((s) => ({ ...s, [sid]: "absent" }))}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${!isPresent ? "bg-red-500 text-white shadow-xs" : "text-gray-500 hover:text-gray-900"}`}
              >
                Absent
              </button>
            </div>
          </td>
        </tr>
      );
    });
  }

  const showBadge = filtered.length > 0 && rows.length > 0;

  return (
    <div id="attendance">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Attendance Management</h2>
        {showBadge && (
          <span className="text-xs px-3 py-1.5 rounded-full font-bold uppercase" style={{ color: "#e94560", backgroundColor: "#fff0f2" }}>
            Present: {presentCount}/{rows.length} ({Math.round((presentCount / rows.length) * 100)}%)
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Select Course</label>
          <CourseSelect value={courseId} onChange={changeCourse} id="attendanceCourseSelect" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Select Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-accent transition-all"
          />
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-1/2">
          <Icon name="search" className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student by name..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto justify-end">
          <button onClick={() => bulk("present")} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold flex items-center transition-all hover:shadow-md cursor-pointer">
            <Icon name="check-circle" className="w-4 h-4 mr-2" /> Present All
          </button>
          <button onClick={() => bulk("absent")} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold flex items-center transition-all hover:shadow-md cursor-pointer">
            <Icon name="x-circle" className="w-4 h-4 mr-2" /> Absent All
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className={`${TH} text-left`}>Student Name</th>
                <th className={`${TH} text-left`}>Attendance %</th>
                <th className={`${TH} text-center`}>Status Toggle</th>
              </tr>
            </thead>
            <tbody id="attendanceTableBody" className="divide-y divide-gray-100 bg-white">{tbody}</tbody>
          </table>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={submit}
            className="bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-lg font-bold shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
          >
            Save Attendance Record
          </button>
        </div>
      </div>
    </div>
  );
}
