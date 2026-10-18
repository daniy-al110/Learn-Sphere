import { apiFetch, postJson } from "@/lib/api";
import { API_BASE_URL } from "@/lib/config";
import type { MarksStudent, RosterStudent, StudentReview, SubmissionRow, TeacherAssignment, TeacherCourse, TeacherQuiz } from "./types";

type Reply<T> = { success?: boolean; error?: string } & T;

/* ───────────── Roster / reviews ───────────── */

export async function fetchCourseStudents(courseId: string | number): Promise<RosterStudent[]> {
  const res = await apiFetch<RosterStudent[]>(`/api/teacher/course/${courseId}/students`);
  if (!res.ok) throw new Error(`Students ${res.status}`);
  return res.body;
}

export async function fetchCourseReviews(courseId: string | number): Promise<StudentReview[]> {
  const res = await apiFetch<{ reviews?: StudentReview[] }>(`/api/teacher/course/${courseId}/reviews`);
  return res.ok ? res.body.reviews || [] : [];
}

export async function submitStudentReview(payload: {
  teacher_id: string;
  student_id: number | string;
  course_id: number | string;
  rating: number;
  review: string;
}) {
  const res = await postJson<Reply<Record<string, never>>>("/api/teacher/student-review", payload);
  return res.body;
}

export type { TeacherCourse };

/* ───────────── Courses / schedule ───────────── */

export async function fetchTeacherCourses(teacherId: string): Promise<TeacherCourse[]> {
  const res = await apiFetch<TeacherCourse[] | { courses?: TeacherCourse[] }>(`/api/teacher/courses/${teacherId}`);
  const b = res.body;
  // payload may be { success: true, courses: [...] } or an array
  const list = Array.isArray(b) ? b : b.courses || b;
  return Array.isArray(list) ? list : [];
}

export interface ScheduleRow {
  course_name?: string;
  teacher_name?: string;
  schedule?: string;
  duration?: string;
}

export async function fetchSchedule(): Promise<ScheduleRow[]> {
  // cache-buster so the schedule is always fresh (as before)
  const res = await apiFetch<ScheduleRow[] | { schedule?: ScheduleRow[] }>(`/api/schedule?t=${Date.now()}`);
  if (!res.ok) throw new Error(`Schedule ${res.status}`);
  const b = res.body;
  const list = Array.isArray(b) ? b : b.schedule || b;
  return Array.isArray(list) ? list : [];
}

/* ───────────── Attendance ───────────── */

export async function saveAttendance(courseId: string, records: { studentId: number | string; status: string; date: string }[]) {
  const res = await postJson<Reply<Record<string, never>>>("/api/teacher/attendance", { courseId, attendance: records });
  return res.body;
}

/* ───────────── Quizzes ───────────── */

export async function fetchTeacherQuizzes(courseId: string): Promise<TeacherQuiz[]> {
  if (!courseId) return [];
  const res = await apiFetch<TeacherQuiz[] | { quizzes?: TeacherQuiz[] }>(`/api/teacher/quizzes/${courseId}`);
  const b = res.body;
  return Array.isArray(b) ? b : b.quizzes || [];
}

export async function toggleQuizActive(quizId: number, isActive: boolean) {
  const res = await postJson<Reply<Record<string, never>>>(`/api/teacher/quiz/${quizId}/toggle`, { isActive });
  return res.body;
}

export async function deleteQuizById(quizId: number) {
  const res = await apiFetch<Reply<Record<string, never>>>(`/api/teacher/quiz/${quizId}`, { method: "DELETE" });
  return res.body;
}

export async function createQuizRequest(payload: {
  courseId: number;
  title: string;
  description: string;
  timeLimit: number;
  allowBackNavigation?: boolean;
  randomizeQuestions?: boolean;
  questions: { type: string; text: string; options: string[]; correctAnswer: string; points: number }[];
}) {
  const res = await postJson<Reply<Record<string, never>>>("/api/teacher/quiz", payload);
  return res.body;
}

/* ───────────── Assignments ───────────── */

export async function fetchCourseAssignments(courseId: string): Promise<TeacherAssignment[]> {
  if (!courseId) return [];
  const res = await apiFetch<TeacherAssignment[] | { assignments?: TeacherAssignment[] }>(`/api/course/${courseId}/assignments`);
  const b = res.body;
  return Array.isArray(b) ? b : b.assignments || [];
}

export async function createAssignmentRequest(payload: {
  courseId: number;
  title: string;
  description: string;
  link: string;
  dueDate: string;
}) {
  const res = await postJson<Reply<Record<string, never>>>("/api/teacher/assignment", payload);
  return res.body;
}

export async function deleteAssignmentById(assignmentId: number) {
  const res = await apiFetch<Reply<Record<string, never>>>(`/api/teacher/assignment/${assignmentId}`, { method: "DELETE" });
  return res.body;
}

export async function fetchSubmissions(assignmentId: number): Promise<SubmissionRow[]> {
  const res = await apiFetch<{ students?: SubmissionRow[] } | SubmissionRow[]>(`/api/teacher/assignment/${assignmentId}/submissions`);
  const b = res.body;
  const list = !Array.isArray(b) && b && b.students ? b.students : Array.isArray(b) ? b : [];
  return Array.isArray(list) ? list : [];
}

export async function saveAssignmentMarks(assignmentId: number, marks: { studentId: number; marks: number }[]) {
  const res = await postJson<Reply<Record<string, never>>>(`/api/teacher/assignment/${assignmentId}/marks`, { marks });
  return res.body;
}

/* ───────────── Marks ───────────── */

export async function fetchCourseMarks(courseId: string): Promise<MarksStudent[]> {
  if (!courseId) return [];
  const res = await apiFetch<{ students?: MarksStudent[] }>(`/api/teacher/course/${courseId}/marks`);
  return res.body.students || [];
}

export interface GradePayload {
  studentId: number | string;
  courseId: string;
  quizMarks: number;
  assignmentMarks: number;
  midMarks: number;
  finalMarks: number;
  totalMarks: number;
  grade: string;
  cgpa: number;
}

export type SaveGradeOutcome =
  | { kind: "saved" }
  | { kind: "error"; message: string }
  | { kind: "network" }; // all attempts failed; the grade may still have been saved

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Port of the 8s-timeout + 3 attempts logic in saveGrade(). */
export async function saveGradeWithRetry(payload: GradePayload): Promise<SaveGradeOutcome> {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/teacher/student/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (resp.ok) {
        let j: { success?: boolean; error?: string; message?: string } | null = null;
        try {
          j = await resp.json();
        } catch {
          /* 2xx with empty body counts as success */
        }
        if (j && j.success === false) {
          return { kind: "error", message: j.error || j.message || resp.statusText || "Unknown server error" };
        }
        return { kind: "saved" };
      }
      try {
        const errBody = await resp.json();
        return { kind: "error", message: errBody.error || errBody.message || resp.statusText || `HTTP ${resp.status}` };
      } catch {
        return { kind: "error", message: resp.statusText || `HTTP ${resp.status}` };
      }
    } catch (err) {
      clearTimeout(timer);
      console.warn(`Attempt ${attempt} failed:`, err instanceof Error ? err.message : err);
      if (attempt < maxAttempts) await sleep(300 * attempt);
    }
  }
  return { kind: "network" };
}

/* ───────────── Dashboard widgets ───────────── */

export interface DashboardStats {
  courseCount: number;
  totalStudents: number;
  pendingGrading: number;
  activeQuizzes: number;
}

const listOf = <T>(body: unknown, key: string): T[] => {
  if (Array.isArray(body)) return body as T[];
  const v = (body as Record<string, unknown> | null)?.[key];
  return Array.isArray(v) ? (v as T[]) : [];
};

/**
 * Port of loadTeacherDashboardWidgets(): counts students, ungraded submissions and active
 * quizzes across all of the teacher's courses. Per-item failures are logged and skipped.
 */
export async function fetchDashboardStats(teacherId: string): Promise<DashboardStats> {
  const stats: DashboardStats = { courseCount: 0, totalStudents: 0, pendingGrading: 0, activeQuizzes: 0 };
  try {
    const courses = await fetchTeacherCourses(teacherId);
    stats.courseCount = courses.length;
    if (courses.length === 0) return stats;

    await Promise.all(
      courses.map(async (course) => {
        const id = course.course_id;
        try {
          const r = await apiFetch<unknown>(`/api/teacher/course/${id}/students`);
          stats.totalStudents += listOf(r.body, "students").length;
        } catch (e) {
          console.warn(`Failed to load students for course ${id}:`, e);
        }
        try {
          const a = await apiFetch<unknown>(`/api/course/${id}/assignments`);
          for (const assignment of listOf<{ assignment_id: number }>(a.body, "assignments")) {
            try {
              const s = await apiFetch<unknown>(`/api/teacher/assignment/${assignment.assignment_id}/submissions`);
              stats.pendingGrading += listOf<SubmissionRow>(s.body, "students").filter(
                (x) => x.submitted && (x.marks === null || x.marks === undefined),
              ).length;
            } catch (e) {
              console.warn(`Failed to load submissions for assignment ${assignment.assignment_id}:`, e);
            }
          }
        } catch (e) {
          console.warn("Failed to load pending grading:", e);
        }
        try {
          const q = await apiFetch<unknown>(`/api/teacher/quizzes/${id}`);
          stats.activeQuizzes += listOf<TeacherQuiz>(q.body, "quizzes").filter((x) => x.is_active).length;
        } catch (e) {
          console.warn("Failed to load active quizzes:", e);
        }
      }),
    );
  } catch (error) {
    console.error("Dashboard widget error:", error);
  }
  return stats;
}
