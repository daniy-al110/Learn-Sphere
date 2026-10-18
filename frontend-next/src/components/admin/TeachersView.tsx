"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import AssignCoursesModal from "./AssignCoursesModal";
import { useAdminData } from "./AdminDataProvider";
import {
  AddButton, Avatar, BackButton, Chips, EmptyRow, FIELD, HEAD_BG, NO_MARGIN, PILL, PLUS_ICON, SubmitSpinner, TH,
  errText, pillStyle, rowClass, useTempMessage,
} from "./ui";
import { assignTeacherCourse, removeTeacher, saveTeacher, unassignTeacherCourse } from "@/lib/admin/api";
import type { AdminTeacher } from "@/lib/admin/types";
import { confirmDialog, toast } from "@/lib/toast-store";

interface FormState {
  id: string;
  name: string;
  email: string;
  degree_program: string;
  department: string;
}
const BLANK: FormState = { id: "", name: "", email: "", degree_program: "BS", department: "Computer Science" };

export default function TeachersView() {
  const { teachers, courses } = useAdminData();
  const params = useSearchParams();
  const [form, setForm] = useState<FormState | null>(() => (params.get("new") === "1" ? BLANK : null));
  const [nameQ, setNameQ] = useState("");
  const [emailQ, setEmailQ] = useState("");
  const [degreeQ, setDegreeQ] = useState("");
  const [deptQ, setDeptQ] = useState("");
  const [saving, setSaving] = useState(false);
  const [assigningId, setAssigningId] = useState<number | string | null>(null);
  const temp = useTempMessage();

  const filtered = useMemo(
    () =>
      teachers.data.filter(
        (t) => {
          if (degreeQ && t.degree_program !== degreeQ) return false;
          if (deptQ && t.department !== deptQ) return false;
          return (t.name || "").toLowerCase().includes(nameQ.toLowerCase()) && (t.email || "").toLowerCase().includes(emailQ.toLowerCase());
        }
      ),
    [teachers.data, nameQ, emailQ, degreeQ, deptQ],
  );
  const assigning = assigningId != null ? teachers.data.find((t) => String(t.teacher_id) === String(assigningId)) : undefined;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    const editing = Boolean(form.id);
    setSaving(true);
    try {
      await saveTeacher({ name: form.name.trim(), personalEmail: form.email.trim().toLowerCase(), degree_program: form.degree_program, department: form.department, ...(editing ? { teacher_id: Number(form.id) } : {}) });
      teachers.reload();
      setForm(null);
    } catch (err) {
      console.error("Save teacher failed", err);
      temp.show(`Could not ${editing ? "update" : "add"} teacher: ${errText(err)}`, true);
    } finally {
      setSaving(false);
    }
  }

  async function remove(t: AdminTeacher) {
    const ok = await confirmDialog.confirmDelete({ entityName: "this teacher" });
    if (!ok) return;
    try {
      await removeTeacher(t.teacher_id);
      teachers.reload();
    } catch (e) {
      toast.error("Could not remove teacher: " + errText(e));
    }
  }

  if (form) {
    const editing = Boolean(form.id);
    return (
      <div id="teachers">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800" style={NO_MARGIN}>Teachers Management</h1>
          <BackButton onClick={() => setForm(null)} />
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 max-w-2xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{editing ? "Edit Teacher Details" : "Add New Teacher"}</h2>
          <p className="text-sm text-gray-500 mb-6">Credentials will be auto-generated and emailed to the personal address.</p>
          <form onSubmit={submit} className="space-y-5" style={{ boxShadow: "none", padding: 0, marginBottom: 0 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Full Name *</label>
                <input type="text" required placeholder="e.g. Dr. Ahmed Ali" value={form.name}
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
                <p>An institutional email (e.g. <code>name123@lms.edu</code>) and a secure temporary password will be auto-created and sent to the personal email provided above.</p>
              </div>
            </div>
            <div className="pt-2 flex gap-3">
              <button type="submit" disabled={saving}
                className={`bg-accent text-white hover:bg-accent-hover font-semibold py-2.5 px-8 rounded-lg transition cursor-pointer ${saving ? "opacity-75 cursor-not-allowed" : ""}`}
                style={{ backgroundColor: "#e94560", width: "auto", display: "inline-block" }}>
                <span>{saving ? <><SubmitSpinner />Saving...</> : editing ? "Save Changes" : "Add Teacher"}</span>
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
    <div id="teachers">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800" style={NO_MARGIN}>Teachers Management</h1>
        <AddButton onClick={() => setForm(BLANK)}>{PLUS_ICON}Add New Teacher</AddButton>
      </div>
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {teachers.loading ? "All Teachers" : `All Teachers (${filtered.length})`}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Filter by Name</label>
            <input type="text" value={nameQ} onChange={(e) => setNameQ(e.target.value)} placeholder="Search by name..."
              className="w-full px-4 py-2 border rounded-lg focus:outline-hidden focus:border-accent" style={NO_MARGIN} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Filter by Email</label>
            <input type="text" value={emailQ} onChange={(e) => setEmailQ(e.target.value)} placeholder="Search by email..."
              className="w-full px-4 py-2 border rounded-lg focus:outline-hidden focus:border-accent" style={NO_MARGIN} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Filter by Degree</label>
            <select value={degreeQ} onChange={(e) => setDegreeQ(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-hidden focus:border-accent" style={NO_MARGIN}>
              <option value="">All Degrees</option>
              <option value="BS">BS</option>
              <option value="MS">MS</option>
              <option value="PhD">PhD</option>
            </select>
          </div>
          <div>
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
        <div className="overflow-x-auto">
          <table id="teacherTable" className="min-w-full">
            <thead>
              <tr style={HEAD_BG}>
                {["Name", "Email Address", "Courses", "Actions"].map((h) => <th key={h} className={TH}>{h}</th>)}
              </tr>
            </thead>
            <tbody id="teacherTableBody">
              {teachers.loading ? (
                <EmptyRow colSpan={4} text="Loading teachers..." />
              ) : teachers.error ? (
                <tr><td colSpan={4} className="px-6 py-4 text-center text-red-500">Error loading teachers</td></tr>
              ) : filtered.length === 0 ? (
                <EmptyRow colSpan={4} text="No teachers found." icon />
              ) : (
                filtered.map((t, idx) => (
                  <tr key={String(t.teacher_id)} className={rowClass(idx)}>
                    <td className="px-6 py-3 text-sm font-bold text-gray-800">
                      <div className="flex items-center gap-2">
                        <Avatar letter={(t.name || "T").charAt(0)} bg="linear-gradient(135deg,#e94560,#ff5c77)" />
                        {t.name || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">{t.email || "-"}</td>
                    <td className="px-6 py-3 text-sm text-gray-700 min-w-[260px]">
                      <Chips items={t.teaching_courses} bg="#eef5ff" color="#123a6b" border="#d6e8ff" />
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <div className="flex flex-nowrap items-center gap-2">
                        <button className={PILL} style={pillStyle("#e8f4ff", "#0b5d9c")}
                          onClick={() => setForm({ id: String(t.teacher_id), name: t.name || "", email: t.email || "", degree_program: t.degree_program || "BS", department: t.department || "Computer Science" })}>Edit</button>
                        <button className={PILL} style={pillStyle("#e8f7ed", "#18703a")} onClick={() => setAssigningId(t.teacher_id)}>Assign</button>
                        <button className={PILL} style={pillStyle("#fff0f3", "#be123c")} onClick={() => remove(t)}>Remove</button>
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
          title="Assign Courses to Teacher"
          subtitle={`${assigning.name} - ${assigning.email}`}
          courses={courses.data}
          assignedIds={new Set((assigning.teaching_courses || []).map((c) => String(c.course_id)))}
          onAssign={async (courseId) => {
            await assignTeacherCourse(assigning.teacher_id, courseId);
            teachers.reload();
            courses.reload(); // course rows show the teacher name
          }}
          onUnassign={async (courseId) => {
            await unassignTeacherCourse(assigning.teacher_id, courseId);
            teachers.reload();
            courses.reload();
          }}
          onClose={() => setAssigningId(null)}
        />
      )}
    </div>
  );
}
