"use client";

import { useAsync } from "@/hooks/useAsync";
import { fetchSchedule } from "@/lib/teacher/api";

const noArg = null;
const TH = "px-6 py-4 text-left font-bold text-gray-700 uppercase tracking-wider";

export default function ScheduleView() {
  const { data, error, loading } = useAsync(fetchSchedule, noArg);
  if (error) console.error("Error loading schedule:", error);

  return (
    <div id="schedule">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Weekly Class Schedule</h2>
      <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className={TH}>Course Name</th>
                <th className={TH}>Assigned Teacher</th>
                <th className={TH}>Class Timings</th>
                <th className={TH}>Duration</th>
              </tr>
            </thead>
            <tbody id="scheduleTableBody" className="divide-y divide-gray-100 bg-white odd:bg-white even:bg-gray-50/50">
              {loading ? null : error ? (
                <tr><td colSpan={4} className="text-center py-4 text-red-600">Failed to load schedule</td></tr>
              ) : !data || data.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-4 text-gray-500">No schedule available</td></tr>
              ) : (
                data.map((s, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">{s.course_name || "N/A"}</td>
                    <td className="px-6 py-4 text-gray-700">{s.teacher_name || "N/A"}</td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{s.schedule || "N/A"}</td>
                    <td className="px-6 py-4 text-gray-500 font-semibold">{s.duration || "N/A"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
