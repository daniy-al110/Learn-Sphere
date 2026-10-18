"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useAdminData } from "./AdminDataProvider";
import { AddButton, BackButton, EmptyRow, FIELD, HEAD_BG, NO_MARGIN, PLUS_ICON, SubmitSpinner, TH, errText, rowClass } from "./ui";
import { addEnrollment, removeEnrollment } from "@/lib/admin/api";
import { confirmDialog, toast } from "@/lib/toast-store";

export default function EnrollmentsView() {
  const { enrollments, courses } = useAdminData();
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [studentId, setStudentId] = useState("");
  const [selectedCourseName, setSelectedCourseName] = useState("");
  const [courseId, setCourseId] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return enrollments.data.filter((e) => (e.student_name || "").toLowerCase().includes(q) || (e.course_name || "").toLowerCase().includes(q));
  }, [enrollments.data, search]);

  function openForm() {
    setStudentId("");
    setSelectedCourseName("");
    setCourseId("");
    setAdding(true);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await addEnrollment(studentId.trim(), courseId);
      enrollments.reload();
      setAdding(false);
    } catch (err) {
      console.error("Add enrollment failed", err);
      toast.error("Could not add enrollment: " + errText(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number | string) {
    const ok = await confirmDialog.confirmDelete({ entityName: "this enrollment" });
    if (!ok) return;
    try {
      await removeEnrollment(id);
      enrollments.reload();
    } catch (e) {
      toast.error("Could not remove enrollment: " + errText(e));
    }
  }

  if (adding) {
    return (
      <div id="enrollments">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800" style={NO_MARGIN}>Enrollments Management</h1>
          <BackButton onClick={() => setAdding(false)} />
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 max-w-2xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Enrollment</h2>
          <form onSubmit={submit} className="space-y-5" style={{ boxShadow: "none", padding: 0, marginBottom: 0 }}>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Student ID *</label>
              <input type="text" required placeholder="e.g. 1" value={studentId} onChange={(e) => setStudentId(e.target.value)} className={FIELD} style={NO_MARGIN} />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Select Course *</label>
              <select required value={selectedCourseName} onChange={(e) => {
                  setSelectedCourseName(e.target.value);
                  setCourseId(""); // Reset specific course when subject changes
              }} className={FIELD} style={{ ...NO_MARGIN, marginBottom: '1rem' }}>
                <option value="">Select a course subject...</option>
                {Array.from(new Set(courses.data.map(c => c.course_name))).map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            {selectedCourseName && (
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Select Section & Teacher *</label>
                <select required value={courseId} onChange={(e) => setCourseId(e.target.value)} className={FIELD} style={NO_MARGIN}>
                  <option value="">Select a section...</option>
                  {courses.data.filter(c => c.course_name === selectedCourseName).map((c) => (
                    <option key={c.course_id} value={c.course_id}>
                      {c.section_name ? `Section ${c.section_name} - ` : ""}{c.teacher_name || "Unknown Teacher"} {c.course_id ? `(${c.course_id})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="pt-4 flex gap-3">
              <button type="submit" disabled={saving}
                className={`bg-accent text-white hover:bg-accent-hover font-semibold py-2.5 px-8 rounded-lg transition cursor-pointer ${saving ? "opacity-75 cursor-not-allowed" : ""}`}
                style={{ backgroundColor: "#e94560", width: "auto", display: "inline-block" }}>
                <span>{saving ? <><SubmitSpinner />Saving...</> : "Enroll Student"}</span>
              </button>
              <button type="button" onClick={() => setAdding(false)} className="py-2.5 px-6 rounded-lg font-semibold border transition cursor-pointer"
                style={{ background: "none", borderColor: "#d1d5db", color: "#6b7280", width: "auto", display: "inline-block" }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div id="enrollments">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800" style={NO_MARGIN}>Enrollments Management</h1>
        <AddButton onClick={openForm}>{PLUS_ICON}Add New Enrollment</AddButton>
      </div>
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Enrollments Directory</h2>
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-600 mb-1">Search Enrollments</label>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by student or course..."
            className="w-full px-4 py-2 border rounded-lg focus:outline-hidden focus:border-accent" style={NO_MARGIN} />
        </div>
        <div className="overflow-x-auto">
          <table id="enrollments-table" className="min-w-full">
            <thead>
              <tr style={HEAD_BG}>
                {["Student Name", "Course Name", "Enrollment Date", "Actions"].map((h) => <th key={h} className={TH}>{h}</th>)}
              </tr>
            </thead>
            <tbody id="enrollmentTableBody">
              {enrollments.loading ? (
                <EmptyRow colSpan={4} text="Loading enrollments..." />
              ) : enrollments.error ? (
                <tr><td colSpan={4} className="px-6 py-4 text-center text-red-500">Error loading enrollments</td></tr>
              ) : filtered.length === 0 ? (
                <EmptyRow colSpan={4} text="No enrollments found." icon />
              ) : (
                filtered.map((e, idx) => (
                  <tr key={String(e.enrollment_id)} className={rowClass(idx)}>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{e.student_name || `Student #${e.student_id}`}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-semibold">{e.course_name || `Course #${e.course_id}`}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{e.created_at ? new Date(e.created_at).toLocaleDateString() : "N/A"}</td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => remove(e.enrollment_id)}
                        className="flex items-center gap-1 text-red-500 hover:text-red-700 font-semibold hover:underline transition cursor-pointer"
                        style={{ background: "none", border: "none", padding: 0, width: "auto", marginBottom: 0 }}
                      >
                        🗑️ Remove
                      </button>
                    </td>
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
