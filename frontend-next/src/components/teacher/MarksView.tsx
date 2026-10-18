"use client";

import { useState } from "react";
import CourseSelect from "./CourseSelect";
import MarksModal from "./MarksModal";
import { useAsync } from "@/hooks/useAsync";
import { useCourseParam } from "@/hooks/useCourseParam";
import { fetchCourseMarks } from "@/lib/teacher/api";

const TH = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase";
const fmt = (v: unknown) => (v ? Number(v).toFixed(1) : "0.0");

export default function MarksView() {
  const [courseId, setCourseId] = useCourseParam();
  const { data, error, loading, reload } = useAsync(fetchCourseMarks, courseId);
  if (error) console.error("Error loading marks:", error);
  const [editing, setEditing] = useState<number | string | null>(null);

  let rows: React.ReactNode = null;
  if (courseId && !loading) {
    if (error) {
      rows = <tr><td colSpan={7} className="px-6 py-4 text-center text-red-500">Failed to load marks</td></tr>;
    } else if (!data || data.length === 0) {
      rows = <tr><td colSpan={7} className="px-6 py-4 text-center text-gray-500">No students enrolled in this course</td></tr>;
    } else {
      rows = data.map((s) => {
        const total = Number(s.total_marks) || 0;
        const grade = s.grade || "-";
        return (
          <tr key={String(s.student_id)}>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm font-medium text-gray-900">{s.name}</div>
              <div className="text-sm text-gray-500">ID: {s.student_id}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fmt(s.quiz_marks)}/15</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fmt(s.assignment_marks)}/15</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fmt(s.mid_marks)}/30</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fmt(s.final_marks)}/40</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <div className={total >= 50 ? "text-green-600" : "text-red-600"}>{fmt(s.total_marks)}/100</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              <div className="flex flex-col gap-1">
                <div className={`font-medium ${grade === "F" ? "text-red-600" : "text-green-600"}`}>{grade}</div>
                <button onClick={() => setEditing(s.student_id)} className="text-blue-600 hover:text-blue-900 text-left cursor-pointer">
                  Update Marks
                </button>
              </div>
            </td>
          </tr>
        );
      });
    }
  }

  return (
    <div id="marks">
      <h2 className="text-3xl font-bold mb-6">Course Marks</h2>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Course</label>
        <CourseSelect id="marksSelectCourse" value={courseId} onChange={setCourseId} className="w-full max-w-md p-2 border rounded-sm" />
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className={TH}>Student</th>
              <th className={TH}>Quizzes (15%)</th>
              <th className={TH}>Assignments (15%)</th>
              <th className={TH}>Mid Term (30%)</th>
              <th className={TH}>Final (40%)</th>
              <th className={TH}>Total</th>
              <th className={TH}>Actions</th>
            </tr>
          </thead>
          <tbody id="marksTableBody" className="bg-white divide-y divide-gray-200">{rows}</tbody>
        </table>
      </div>

      {editing !== null && (
        <MarksModal
          key={String(editing)}
          studentId={editing}
          courseId={courseId}
          onClose={() => setEditing(null)}
          onSaved={reload}
        />
      )}
    </div>
  );
}
