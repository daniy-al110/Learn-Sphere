"use client";

import { useAsync } from "@/hooks/useAsync";
import { useSession } from "@/hooks/useSession";
import { fetchStudentEnrollments } from "@/lib/student/api";

async function loadSchedule(studentId: string) {
  // cache-buster so the schedule is always fresh (as before)
  const json = await fetchStudentEnrollments(studentId, true);
  return json.success ? json.enrollments || [] : null;
}

const TH = "border px-4 py-3 text-left font-semibold text-gray-700";
const TD = "border px-3 py-2";

export default function ScheduleView() {
  const { session } = useSession();
  const studentId = session.userId ?? "";
  const { data, error, loading } = useAsync(loadSchedule, studentId);
  if (error) console.error("Load student schedule failed", error);

  return (
    <div className="p-8 max-w-6xl mx-auto" id="schedule">
      <h2 className="text-3xl font-bold mb-6">Course Schedule</h2>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr style={{ backgroundImage: "linear-gradient(to right, #fff0f2, #ffe0e5)" }}>
              <th className={TH}>Course ID</th>
              <th className={TH}>Course Name</th>
              <th className={TH}>Teacher</th>
              <th className={TH}>Credit Hours</th>
              <th className="border px-4 py-3 text-left font-semibold" style={{ color: "#e94560" }}>Schedule</th>
              <th className={TH}>Duration</th>
            </tr>
          </thead>
          <tbody id="studentScheduleBody">
            {loading || !data ? null : data.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4 text-gray-500">No courses scheduled.</td>
              </tr>
            ) : (
              data.map((s, i) => (
                <tr key={i}>
                  <td className={TD}>{s.course_id}</td>
                  <td className={TD}>{s.course_name}</td>
                  <td className={TD}>{s.teacher_name || s.teacher_id || "N/A"}</td>
                  <td className={TD}>{s.credit_hours || 3} CH</td>
                  <td className={TD}>{s.schedule || "-"}</td>
                  <td className={TD}>{s.duration || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
