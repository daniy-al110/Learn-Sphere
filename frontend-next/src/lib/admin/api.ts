import { apiFetch, postJson } from "@/lib/api";
import type { FeeChallan } from "@/lib/student/types";
import type {
  AdminCourse, AdminEnrollment, AdminStudent, AdminTeacher, EnrollmentRequest, OpenEnrollmentWindow,
} from "./types";

type Reply<T> = { success?: boolean; error?: string; message?: string } & T;

/** `if (!res.ok || !body.success) throw new Error(body.error || fallback)` — used all over the old page. */
async function expectSuccess<T>(p: Promise<{ ok: boolean; body: Reply<T> }>, fallback: string): Promise<Reply<T>> {
  const res = await p;
  if (!res.ok || !res.body.success) throw new Error(res.body.error || fallback);
  return res.body;
}

const listOf = <T>(body: unknown, key: string): T[] => {
  if (Array.isArray(body)) return body as T[];
  const v = (body as Record<string, unknown> | null)?.[key];
  return Array.isArray(v) ? (v as T[]) : [];
};

/* ───────────── Directory lists (cached by <AdminDataProvider/>) ───────────── */

export async function fetchStudents(): Promise<AdminStudent[]> {
  return listOf((await apiFetch<unknown>("/api/admin/students")).body, "students");
}
export async function fetchTeachers(): Promise<AdminTeacher[]> {
  return listOf((await apiFetch<unknown>("/api/admin/teachers")).body, "teachers");
}
export async function fetchCourses(): Promise<AdminCourse[]> {
  return listOf((await apiFetch<unknown>("/api/admin/courses")).body, "courses");
}
export async function fetchEnrollments(): Promise<AdminEnrollment[]> {
  return listOf((await apiFetch<unknown>("/api/admin/enrollments")).body, "enrollments");
}

/* ───────────── Enrollment requests ───────────── */

export async function fetchEnrollmentRequests(): Promise<EnrollmentRequest[]> {
  return listOf((await apiFetch<unknown>("/api/admin/enrollment-requests")).body, "requests");
}

export async function approveEnrollmentRequest(requestId: number) {
  const res = await postJson<Reply<{ studentEmail?: string }>>(`/api/admin/enrollment-request/${requestId}/approve`, undefined);
  return res.body;
}

export async function rejectEnrollmentRequest(requestId: number) {
  const res = await postJson<Reply<Record<string, never>>>(`/api/admin/enrollment-request/${requestId}/reject`, undefined);
  return res.body;
}

/* ───────────── Fee challans ───────────── */

export async function fetchFeeChallans(): Promise<FeeChallan[]> {
  const body = await expectSuccess(apiFetch<{ challans?: FeeChallan[] }>("/api/admin/fee-challans"), "Failed to load challans");
  return body.challans || [];
}

export async function generateFeeChallan(payload: { student_id: number; semester: string; due_date: string; reissue: boolean }) {
  const body = await expectSuccess(
    postJson<{ challan: { challan_number: string } }>("/api/admin/fee-challans/generate", payload),
    "Could not generate challan",
  );
  return body.challan;
}

export async function generateBulkFeeChallans(payload: { semester: string; due_date: string; reissue: boolean }) {
  const body = await expectSuccess(
    postJson<{ issued: unknown[]; skipped: unknown[] }>("/api/admin/fee-challans/generate-bulk", payload),
    "Bulk generation failed",
  );
  return { issued: body.issued, skipped: body.skipped };
}

export async function updateFeeChallanStatus(challanId: number | string, status: string) {
  await expectSuccess(
    apiFetch<Record<string, never>>(`/api/admin/fee-challans/${challanId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }),
    "Could not update status",
  );
}

/* ───────────── Open enrollment window ───────────── */

export async function fetchOpenEnrollmentWindow(): Promise<OpenEnrollmentWindow | null> {
  const body = await expectSuccess(
    apiFetch<{ window?: OpenEnrollmentWindow | null }>("/api/open-enrollment-window"),
    "Could not load open enrollment window",
  );
  return body.window || null;
}

export { expectSuccess, listOf };

/* ───────────── Students / teachers ───────────── */

export async function saveStudent(body: { name: string; personalEmail: string; student_id?: number; department?: string; degree_program?: string }) {
  const url = body.student_id ? "/api/admin/update-student" : "/api/admin/add-student";
  await expectSuccess(postJson<Record<string, never>>(url, body), body.student_id ? "Update student failed" : "Add student failed");
}

export async function saveTeacher(body: { name: string; personalEmail: string; teacher_id?: number; department?: string; degree_program?: string }) {
  const url = body.teacher_id ? "/api/admin/update-teacher" : "/api/admin/add-teacher";
  await expectSuccess(postJson<Record<string, never>>(url, body), body.teacher_id ? "Update teacher failed" : "Add teacher failed");
}

const del = (path: string) => apiFetch<Reply<Record<string, never>>>(path, { method: "DELETE" });

export const removeStudent = (id: number | string) => expectSuccess(del(`/api/admin/remove-student/${id}`), "Delete failed");
export const removeTeacher = (id: number | string) => expectSuccess(del(`/api/admin/remove-teacher/${id}`), "Delete failed");
export const removeCourse = (id: number | string, cascade?: boolean) => expectSuccess(del(`/api/admin/remove-course/${id}${cascade ? '?cascade=true' : ''}`), "Delete failed");
export const removeEnrollment = (id: number | string) => expectSuccess(del(`/api/admin/remove-enrollment/${id}`), "Delete failed");

/* ───────────── Courses ───────────── */

export interface CourseSaveBody {
  course_name: string;
  section_name?: string;
  description: string;
  credit_hours: number;
  status: string;
  category: string;
  degree_program?: string;
  department?: string;
  teacher_id?: number | null;
  teacher_ids?: number[];
  offerings?: { section_name: string; teacher_ids: number[] }[];
  semester?: number;
  prerequisite_course_id?: number | null;
  course_id?: number;
}

export async function saveCourse(body: CourseSaveBody) {
  const url = body.course_id ? "/api/admin/update-course" : "/api/admin/add-course";
  await expectSuccess(postJson<Record<string, never>>(url, body), "Save failed");
}

export async function updateCourseSchedule(courseId: string | number, schedule: string, duration: string) {
  const res = await apiFetch<Reply<Record<string, never>>>(`/api/courses/${courseId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ schedule, duration }),
  });
  if (!res.ok) throw new Error(res.body.error || res.body.message || `${res.status} ${res.statusText}`);
  if (res.body.success === false) throw new Error(res.body.error || res.body.message || "Server rejected update");
}

/* ───────────── Enrollments / assignments ───────────── */

export async function addEnrollment(studentId: string | number, courseId: string | number) {
  await expectSuccess(postJson<Record<string, never>>("/api/admin/add-enrollment", { student_id: studentId, course_id: courseId }), "Add enrollment failed");
}

export async function assignTeacherCourse(teacherId: number | string, courseId: number | string) {
  await expectSuccess(postJson<Record<string, never>>("/api/admin/assign-teacher-course", { teacher_id: teacherId, course_id: courseId }), "Could not assign course");
}

export async function unassignTeacherCourse(teacherId: number | string, courseId: number | string) {
  await expectSuccess(postJson<Record<string, never>>("/api/admin/unassign-teacher-course", { teacher_id: teacherId, course_id: courseId }), "Could not unassign course");
}

export async function saveOpenEnrollmentWindow(payload: { semester_name: string; open_at: string; close_at: string }) {
  const body = await expectSuccess(
    postJson<{ window?: OpenEnrollmentWindow | null }>("/api/admin/open-enrollment-window", { ...payload, timezone: "Asia/Karachi" }),
    "Could not save open enrollment window",
  );
  return body.window || null;
}
