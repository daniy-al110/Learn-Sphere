"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAdminData } from "./AdminDataProvider";
import { AddButton, FIELD, HEAD_BG, NO_MARGIN, SubmitSpinner, TH, errText } from "./ui";
import { useAsync } from "@/hooks/useAsync";
import { removeCourse, saveCourse, type CourseSaveBody } from "@/lib/admin/api";
import { formatPkDisplay } from "@/lib/student/helpers";
import type { AdminCourse } from "@/lib/admin/types";
import { confirmDialog, toast } from "@/lib/toast-store";
import { getActivePlanConfig } from "@/lib/plans";
import ShareClassModal from "@/components/courses/ShareClassModal";

const none = null;
const LINK_BTN = { background: "none", border: "none", padding: 0, display: "inline-block", width: "auto", marginBottom: 0 } as const;

interface FormState {
  id: string; // "" => adding
  name: string;
  section: string;
  semester: string;
  desc: string;
  credit: string;
  status: string;
  category: string;
  prerequisite_course_id: number | null;
  teacherIds: number[];
  degree_program: string;
  department: string;
}
const BLANK: FormState = { id: "", name: "", section: "", semester: "1", desc: "", credit: "3", status: "Draft", category: "General", prerequisite_course_id: null, teacherIds: [], degree_program: "BS", department: "Computer Science" };

export default function CoursesView() {
  const { courses, teachers } = useAdminData();
  const params = useSearchParams();
  const [form, setForm] = useState<FormState | null>(() => (params.get("new") === "1" ? BLANK : null));
  const [saving, setSaving] = useState(false);

  const [titleQ, setTitleQ] = useState("");
  const [teacherQ, setTeacherQ] = useState("");
  const [categoryQ, setCategoryQ] = useState("");
  const [degreeQ, setDegreeQ] = useState("");
  const [deptQ, setDeptQ] = useState("");
  const [sharingCourse, setSharingCourse] = useState<{ id: number; name: string } | null>(null);

  const uniqueSections = useMemo(() => {
    const secs = courses.data.map((c) => c.section_name).filter(Boolean) as string[];
    return [...new Set(secs)].sort();
  }, [courses.data]);

  const categories = useMemo(() => [...new Set(courses.data.map((c) => c.category || "General"))], [courses.data]);
  const filtered = useMemo(() => {
    let list = courses.data;
    if (titleQ) list = list.filter((c) => (c.course_name || "").toLowerCase().includes(titleQ.toLowerCase()));
    if (teacherQ) list = list.filter((c) => String(c.teacher_id) === String(teacherQ));
    if (categoryQ) list = list.filter((c) => (c.category || "General") === categoryQ);
    if (degreeQ) list = list.filter((c) => c.degree_program === degreeQ);
    if (deptQ) list = list.filter((c) => c.department === deptQ);
    return list;
  }, [courses.data, titleQ, teacherQ, categoryQ, degreeQ, deptQ]);

  function edit(c: AdminCourse) {
    const ids =
      Array.isArray(c.assigned_teacher_ids) && c.assigned_teacher_ids.length
        ? c.assigned_teacher_ids
        : Array.isArray(c.teacher_ids) && c.teacher_ids.length
          ? c.teacher_ids
          : c.teacher_id
            ? [c.teacher_id]
            : [];
    setForm({
      id: String(c.course_id), name: c.course_name || "", section: c.section_name || "", semester: "1", desc: c.description || "", credit: String(c.credit_hours || 3),
      status: c.status || "Draft", category: c.category || "General", prerequisite_course_id: c.prerequisite_course_id || null, teacherIds: ids.map(Number).filter(Number.isFinite),
      degree_program: c.degree_program || "BS", department: c.department || "Computer Science",
    });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    const creditHours = Number(form.credit);
    if (!Number.isFinite(creditHours) || creditHours <= 0) return toast.warning("Credit hours must be a positive number.");

    if (!form.id) {
      const plan = getActivePlanConfig();
      if (courses.data.length >= plan.maxCourses) {
        toast.error(
          `Batch Limit Reached: Your current plan (${plan.name}) allows a maximum of ${plan.maxCourses} courses/batches. Please upgrade your plan or email kradtech4@gmail.com.`
        );
        return;
      }
    }

    const body: CourseSaveBody = {
      course_name: form.name.trim(), section_name: form.section.trim(), description: form.desc.trim(), credit_hours: creditHours,
      status: form.status, category: form.category.trim() || "General", prerequisite_course_id: form.prerequisite_course_id,
      degree_program: form.degree_program, department: form.department
    };
    if (form.id) {
      body.course_id = parseInt(form.id, 10);
    } else {
      body.semester = Number(form.semester);
    }

    setSaving(true);
    try {
      await saveCourse(body);
      toast.success(form.id ? "Course updated successfully" : "Course added successfully");
      setForm(null);
      courses.reload();
      teachers.reload(); // teaching_courses may have changed
    } catch (err) {
      console.error("Save course failed", err);
      toast.error("Could not save course: " + errText(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    const ok = await confirmDialog.confirmDelete({ entityName: "this course" });
    if (!ok) return;
    try {
      await removeCourse(id);
      toast.success("Course removed successfully");
      courses.reload();
    } catch (e: any) {
      if (e.message && e.message.includes("dependent records")) {
        const cascadeOk = await confirmDialog.confirm({
          title: "Force Delete Course?",
          message: "This course has dependent records (enrollments, quizzes, grades, etc.). Deleting it will permanently remove all of them. Are you absolutely sure?",
          confirmText: "Yes, Delete Everything",
          type: "danger"
        });
        if (cascadeOk) {
          try {
            await removeCourse(id, true);
            toast.success("Course and dependencies removed successfully");
            courses.reload();
          } catch (e2) {
            console.error("Failed to force remove course", e2);
            toast.error("Could not remove course: " + errText(e2));
          }
        }
      } else {
        console.error("Failed to remove course", e);
        toast.error("Could not remove course: " + errText(e));
      }
    }
  }

  if (form) {
    const toggleTeacher = (id: number, on: boolean) =>
      setForm({ ...form, teacherIds: on ? [...form.teacherIds, id] : form.teacherIds.filter((x) => x !== id) });
    return (
      <div id="courses">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800" style={NO_MARGIN}>Courses Management</h1>
          <AddButton onClick={() => setForm(null)}>Cancel Form</AddButton>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{form.id ? "Edit Course" : "Add New Course"}</h2>
          <form onSubmit={submit} className="space-y-6" style={{ boxShadow: "none", padding: 0, marginBottom: 0 }}>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Course Title *</label>
              <input type="text" required placeholder="e.g. Intro to Node.js" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} className={FIELD} style={NO_MARGIN} />
            </div>
            {!form.id ? (
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Semester (1-8) *</label>
                <input type="number" min={1} max={8} step={1} required placeholder="e.g. 3" value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: e.target.value })} className={FIELD} style={NO_MARGIN} />
                <p className="text-xs text-gray-500 mt-1">This course will be automatically created for all sections in this semester.</p>
              </div>
            ) : (
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Section</label>
                <input type="text" readOnly disabled value={form.section || "N/A"} className={FIELD} style={NO_MARGIN} />
              </div>
            )}
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Description *</label>
              <textarea rows={4} required placeholder="Brief description of the course..." value={form.desc}
                onChange={(e) => setForm({ ...form, desc: e.target.value })} className={FIELD} style={NO_MARGIN} />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Credit Hours *</label>
              <input type="number" min={1} step={1} required placeholder="e.g. 3" value={form.credit}
                onChange={(e) => setForm({ ...form, credit: e.target.value })} className={FIELD} style={NO_MARGIN} />
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Status *</label>
                <select required value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={FIELD} style={NO_MARGIN}>
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Category Name</label>
              <input type="text" placeholder="General" value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })} className={FIELD} style={NO_MARGIN} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Prerequisite Course</label>
              <select 
                value={form.prerequisite_course_id || ""} 
                onChange={(e) => setForm({ ...form, prerequisite_course_id: e.target.value ? Number(e.target.value) : null })} 
                className={FIELD} style={NO_MARGIN}
              >
                <option value="">No prerequisite</option>
                {courses.data.filter(c => String(c.course_id) !== String(form.id)).map(c => (
                  <option key={c.course_id} value={c.course_id}>{c.course_name} {c.section_name ? `(${c.section_name})` : ''}</option>
                ))}
              </select>
            </div>
            <div className="pt-4">
              <button type="submit" disabled={saving}
                className={`bg-accent text-white hover:bg-accent-hover font-semibold py-2 px-6 rounded-lg transition cursor-pointer ${saving ? "opacity-75 cursor-not-allowed" : ""}`}
                style={{ backgroundColor: "#e94560", width: "auto" }}>
                <span>{saving ? <><SubmitSpinner />Saving...</> : "Save Course"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div id="courses">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800" style={NO_MARGIN}>Courses Management</h1>
        <AddButton onClick={() => setForm(BLANK)}>+ Add New Course</AddButton>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Active Courses Catalog</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Filter by Title</label>
            <input type="text" value={titleQ} onChange={(e) => setTitleQ(e.target.value)} placeholder="Search by course title..."
              className="w-full px-4 py-2 border rounded-lg focus:outline-hidden focus:border-accent" style={NO_MARGIN} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Filter by Teacher</label>
            <select value={teacherQ} onChange={(e) => setTeacherQ(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-hidden focus:border-accent" style={NO_MARGIN}>
              <option value="">All Teachers</option>
              {teachers.data.map((t) => (
                <option key={String(t.teacher_id)} value={String(t.teacher_id)}>{t.name || `Teacher #${t.teacher_id}`}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Filter by Category</label>
            <select value={categoryQ} onChange={(e) => setCategoryQ(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-hidden focus:border-accent" style={NO_MARGIN}>
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
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
            <label className="block text-sm font-semibold text-gray-600 mb-1">Filter by Dept</label>
            <select value={deptQ} onChange={(e) => setDeptQ(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-hidden focus:border-accent" style={NO_MARGIN}>
              <option value="">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Software Engineering">Software Engineering</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
              <option value="Business Administration">Business Administration</option>
            </select>
          </div>
        </div>

        <table id="courseTable" className="min-w-full">
          <thead>
            <tr style={HEAD_BG}>
              {["Title", "Status", "Credit Hours", "Category", "Teacher", "Actions"].map((h) => <th key={h} className={TH}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {courses.loading ? (
              <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">Loading courses...</td></tr>
            ) : courses.error ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-red-500">Error loading courses</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">No courses found</td></tr>
            ) : (
              filtered.map((c) => {
                const status = (c.status || "Draft").toUpperCase();
                return (
                  <tr key={c.course_id} className="hover:bg-gray-50 border-b border-gray-100 transition">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {c.course_name || ""} {c.section_name ? `(${c.section_name})` : ""}
                      {c.parent_course_id ? <span className="ml-2 text-xs text-gray-500">Offering (group {c.parent_course_id})</span> : null}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${status === "PUBLISHED" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{c.credit_hours || 3} CH</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.category || "General"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.teacher_name || "Unassigned"}</td>
                    <td className="px-6 py-4 text-sm space-x-4">
                      <button onClick={() => setSharingCourse({ id: c.course_id, name: c.course_name })} className="text-pink-600 hover:text-pink-900 font-bold hover:underline cursor-pointer" style={LINK_BTN}>🔗 Share</button>
                      <button onClick={() => edit(c)} className="text-blue-600 hover:text-blue-900 font-bold hover:underline cursor-pointer" style={LINK_BTN}>Edit</button>
                      <button onClick={() => remove(c.course_id)} className="text-red-600 hover:text-red-900 font-bold hover:underline cursor-pointer" style={LINK_BTN}>🗑️ Remove</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {sharingCourse && (
        <ShareClassModal
          courseId={sharingCourse.id}
          courseName={sharingCourse.name}
          onClose={() => setSharingCourse(null)}
        />
      )}
    </div>
  );
}
