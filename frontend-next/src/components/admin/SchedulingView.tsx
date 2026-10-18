"use client";

import { useState, type FormEvent } from "react";
import { useAdminData } from "./AdminDataProvider";
import { errText } from "./ui";
import { updateCourseSchedule } from "@/lib/admin/api";
import { toast } from "@/lib/toast-store";

const INPUT = "w-full max-w-md p-2 border rounded-sm";

export default function SchedulingView() {
  const { courses } = useAdminData();

  /* ---- course schedule ---- */
  const [courseId, setCourseId] = useState("");
  const [schedule, setSchedule] = useState("");
  const [duration, setDuration] = useState("");
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [result, setResult] = useState<{ text: string; color: string } | null>(null);

  function pickCourse(id: string) {
    setCourseId(id);
    // prefill with the course's current schedule/duration
    const c = courses.data.find((x) => String(x.course_id) === String(id));
    setSchedule(c?.schedule || "");
    setDuration(c?.duration || "");
  }

  async function saveSchedule(e: FormEvent) {
    e.preventDefault();
    if (!courseId || !schedule.trim() || !duration.trim()) return toast.warning("Please fill in all fields");
    setSavingSchedule(true);
    setResult(null);
    try {
      await updateCourseSchedule(courseId, schedule.trim(), duration.trim());
      setResult({ text: "✓ Schedule saved successfully!", color: "green" });
      courses.reload();
      setTimeout(() => {
        setCourseId("");
        setSchedule("");
        setDuration("");
        setResult(null);
      }, 2000);
    } catch (err) {
      console.error("Schedule save failed", err);
      setResult({ text: "✗ Error saving schedule: " + errText(err), color: "red" });
    } finally {
      setSavingSchedule(false);
    }
  }

  return (
    <div id="scheduling">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Course Scheduling & Duration Management</h1>
      <div className="max-w-3xl mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Add or Update Course Schedule</h2>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
            <p className="text-sm text-blue-700">
              <strong>Instructions:</strong> Select a course, enter its schedule and duration, then click &quot;Save Schedule&quot;. The schedule will be visible to students and teachers in their portals.
            </p>
          </div>
          <form onSubmit={saveSchedule}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Course</label>
                <select required value={courseId} onChange={(e) => pickCourse(e.target.value)} className={INPUT}>
                  <option value="">{courses.error ? "Error loading courses" : "Choose a course..."}</option>
                  {courses.data.map((c) => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Schedule (e.g., Mon-Wed 10:00-11:30)</label>
                <input type="text" required placeholder="e.g., Mon-Wed 10:00-11:30" value={schedule} onChange={(e) => setSchedule(e.target.value)} className={INPUT} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Duration (e.g., 1.5 hours)</label>
                <input type="text" required placeholder="e.g., 1.5 hours" value={duration} onChange={(e) => setDuration(e.target.value)} className={INPUT} />
              </div>
              <button type="submit" disabled={savingSchedule} className="bg-accent text-white px-4 py-2 rounded-sm hover:bg-accent-hover cursor-pointer disabled:opacity-70" style={{ backgroundColor: "#e94560" }}>
                {savingSchedule ? "Saving..." : "Save Schedule"}
              </button>
            </div>
          </form>
          {result && <div className="mt-4 text-sm" style={{ color: result.color }}>{result.text}</div>}
        </div>
      </div>
    </div>
  );
}
