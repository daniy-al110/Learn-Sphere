"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import AssignCoursesModal from "./AssignCoursesModal";
import { useAdminData } from "./AdminDataProvider";
import {
  AddButton, Avatar, BackButton, Chips, EmptyRow, FIELD, HEAD_BG, NO_MARGIN, PILL, PLUS_ICON, SubmitSpinner, TH,
  errText, pillStyle, rowClass, useTempMessage,
} from "./ui";
import { addEnrollment, removeEnrollment, removeStudent, saveStudent } from "@/lib/admin/api";
import type { AdminStudent } from "@/lib/admin/types";
import { confirmDialog, toast } from "@/lib/toast-store";

interface FormState {
  id: string; // "" => adding
  name: string;
  email: string;
  degree_program: string;
  department: string;
}
const BLANK: FormState = { id: "", name: "", email: "", degree_program: "BS", department: "Computer Science" };

export default function StudentsView() {
  const { students, courses } = useAdminData();
  const params = useSearchParams();
  // Dashboard "Add Student" quick action links here with ?new=1
  const [form, setForm] = useState<FormState | null>(() => (params.get("new") === "1" ? BLANK : null));
  const [search, setSearch] = useState("");
  const [degreeQ, setDegreeQ] = useState("");
  const [deptQ, setDeptQ] = useState("");
  const [saving, setSaving] = useState(false);
  const [assigningId, setAssigningId] = useState<number | string | null>(null);
  const temp = useTempMessage();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return students.data.filter((s) => {
      if (degreeQ && s.degree_program !== degreeQ) return false;
      if (deptQ && s.department !== deptQ) return false;
      if (!q) return true;
      return (
        (s.name || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q) ||
        (s.assigned_courses || []).some((c) => (c.course_name || "").toLowerCase().includes(q))
      );
    });
  }, [students.data, search, degreeQ, deptQ]);

  const assigning = assigningId != null ? students.data.find((s) => String(s.student_id) === String(assigningId)) : undefined;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    const editing = Boolean(form.id);
    const body = { name: form.name.trim(), personalEmail: form.email.trim().toLowerCase(), degree_program: form.degree_program, department: form.department, ...(editing ? { student_id: Number(form.id) } : {}) };
    setSaving(true);
    try {
      await saveStudent(body);
      students.reload();
      setForm(null);
    } catch (err) {
      console.error("Save student failed", err);
      temp.show(`Could not ${editing ? "update" : "add"} student: ${errText(err)}`, true);
    } finally {
      setSaving(false);
    }
  }

  async function remove(s: AdminStudent) {
    const ok = await confirmDialog.confirmDelete({ entityName: "this student" });
    if (!ok) return;
    try {
      await removeStudent(s.student_id);
      students.reload();
    } catch (e) {
      toast.error("Could not remove student: " + errText(e));
    }
  }

  const SEARCH_BOX = (
    <div className="mb-5 flex flex-col md:flex-row gap-4">
      <div className="flex-1">
        <label className="block text-sm font-semibold text-gray-600 mb-1">Search Students</label>
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..."
          className="w-full px-4 py-2 border rounded-lg focus:outline-hidden focus:border-accent" style={NO_MARGIN}
        />
      </div>
      <div className="flex-1">
        <label className="block text-sm font-semibold text-gray-600 mb-1">Filter by Degree</label>
        <select value={degreeQ} onChange={(e) => setDegreeQ(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-hidden focus:border-accent" style={NO_MARGIN}>
          <option value="">All Degrees</option>
          <option value="BS">BS</option>
          <option value="MS">MS</option>
          <option value="PhD">PhD</option>
        </select>
      </div>
      <div className="flex-1">
        <label className="block text-sm font-semibold text-gray-600 mb-1">Filter by Department</label>
        <select value={deptQ} onChange={(e) => setDeptQ(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-hidden focus:border-accent" style={NO_MARGIN}>
          <option value="">All Departments</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Software Engineering">Software Engineering</option>
          <option value="Electrical Engineering">Electrical Engineering</option>
          <option value="Business Administration">Business Administration</option>
        </select>
      </div>
    </div>
  );

  if (form) {
    const editing = Boolean(form.id);
    return (
      <div id="students">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800" style={NO_MARGIN}>Students Management</h1>
          <BackButton onClick={() => setForm(null)} />
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 max-w-2xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{editing ? "Edit Student Details" : "Add New Student"}</h2>
          <p className="text-sm text-gray-500 mb-6">Credentials will be auto-generated and emailed to the personal address.</p>
          <form onSubmit={submit} className="space-y-5" style={{ boxShadow: "none", padding: 0, marginBottom: 0 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Full Name *</label>
                <input type="text" required placeholder="e.g. Ali Hassan" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} className={FIELD} style={NO_MARGIN} />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Personal Email *</label>
                <input type="email" required={!editing} disabled={editing} placeholder="personal@email.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} className={FIELD} style={NO_MARGIN} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Degree Program *</label>
                <select value={form.degree_program} onChange={(e) => setForm({ ...form, degree_program: e.target.value })} className={FIELD} style={NO_MARGIN}>
                  <option value="BS">BS</option>
                  <option value="MS">MS</option>
                  <option value="PhD">PhD</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Department *</label>
                <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className={FIELD} style={NO_MARGIN}>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Software Engineering">Software Engineering</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Business Administration">Business Administration</option>
                </select>
              </div>
            </div>
            <div className="rounded-lg p-4 flex items-start gap-3" style={{ backgroundColor: "#fff0f2", border: "1px solid #fcd0d7" }}>
              <div className="text-sm" style={{ color: "#c62a47" }}>
                <p className="font-semibold mb-1">Auto-Generated Credentials</p>
                <p>An institutional email (e.g. <code>name456@student.lms.edu</code>) and a secure temporary password will be auto-created and sent to the personal email above.</p>
              </div>
            </div>
            <div className="pt-2 flex gap-3">
              <button type="submit" disabled={saving}
                className={`bg-accent text-white hover:bg-accent-hover font-semibold py-2.5 px-8 rounded-lg transition cursor-pointer ${saving ? "opacity-75 cursor-not-allowed" : ""}`}
                style={{ backgroundColor: "#e94560", width: "auto", display: "inline-block" }}>
                <span>{saving ? <><SubmitSpinner />Saving...</> : editing ? "Save Changes" : "Add Student"}</span>
              </button>
              <button type="button" onClick={() => setForm(null)} className="py-2.5 px-6 rounded-lg font-semibold border transition cursor-pointer"
                style={{ background: "none", borderColor: "#d1d5db", color: "#6b7280", width: "auto", display: "inline-block" }}>
                Cancel
              </button>
            </div>
          </form>
          {temp.node}
        </div>
      </div>
    );
  }

  return (
    <div id="students">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800" style={NO_MARGIN}>Students Management</h1>
        <AddButton onClick={() => setForm(BLANK)}>{PLUS_ICON}Add New Student</AddButton>
      </div>
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">All Students</h2>
        {SEARCH_BOX}
        <div className="overflow-x-auto">
          <table id="studentTable" className="min-w-full">
            <thead>
              <tr style={HEAD_BG}>
                {["ID", "Name", "Institutional Email", "Assigned Courses", "Actions"].map((h) => <th key={h} className={TH}>{h}</th>)}
              </tr>
            </thead>
            <tbody id="studentTableBody">
              {students.loading ? (
                <EmptyRow colSpan={5} text="Loading students..." />
              ) : students.error ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-red-500">Error loading students</td></tr>
              ) : filtered.length === 0 ? (
                <EmptyRow colSpan={5} text="No students found." icon />
              ) : (
                filtered.map((s, idx) => (
                  <tr key={String(s.student_id)} className={rowClass(idx)}>
                    <td className="px-6 py-3 text-sm font-semibold text-gray-500">#{s.student_id}</td>
                    <td className="px-6 py-3 text-sm font-bold text-gray-800">
                      <div className="flex items-center gap-2">
                        <Avatar letter={(s.name || "S").charAt(0)} bg="#e94560" />
                        {s.name || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">{s.email || "-"}</td>
                    <td className="px-6 py-3 text-sm text-gray-700 min-w-[260px]">
                      <Chips items={s.assigned_courses} bg="#e8f7ed" color="#123a2a" border="#d2efda" />
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <div className="flex flex-nowrap items-center gap-2">
                        <button className={PILL} style={pillStyle("#e8f4ff", "#0b5d9c")}
                          onClick={() => setForm({ id: String(s.student_id), name: s.name || "", email: s.email || "", degree_program: s.degree_program || "BS", department: s.department || "Computer Science" })}>Edit</button>
                        <button className={PILL} style={pillStyle("#e8f7ed", "#18703a")} onClick={() => setAssigningId(s.student_id)}>Assign</button>
                        <button className={PILL} style={pillStyle("#fff0f3", "#be123c")} onClick={() => remove(s)}>Remove</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {assigning && (
        <AssignCoursesModal
          title="Assign Courses"
          subtitle={`${assigning.name} - ${assigning.email}`}
          courses={courses.data}
          assignedIds={new Set((assigning.assigned_courses || []).map((c) => String(c.course_id)))}
          onAssign={async (courseId) => {
            await addEnrollment(assigning.student_id, courseId);
            students.reload();
          }}
          onUnassign={async (courseId) => {
            const enrollmentId = (assigning.assigned_courses || []).find((c) => String(c.course_id) === String(courseId))?.enrollment_id;
            if (enrollmentId == null) throw new Error("Could not unassign course");
            await removeEnrollment(enrollmentId);
            students.reload();
          }}
          onClose={() => setAssigningId(null)}
        />
      )}
    </div>
  );
}
