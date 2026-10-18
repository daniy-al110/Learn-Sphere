import { apiFetch, postJson } from "@/lib/api";
import type {
  Assignment,
  AttendanceCourse,
  Course,
  Enrollment,
  Feedback,
  FeeChallan,
  GradeRow,
  OpenEnrollmentWindow,
  QuizDetail,
  QuizSummary,
  TranscriptRow,
} from "./types";

/** Every backend reply carries `success` plus an endpoint-specific payload. */
type Reply<T> = { success?: boolean; error?: string } & T;

const errorOf = (b: { error?: string }, fallback: string) => b.error || fallback;

/* ───────────── Courses / enrollment ───────────── */

export async function fetchOpenEnrollmentWindow(): Promise<OpenEnrollmentWindow | null> {
  const res = await apiFetch<Reply<{ window?: OpenEnrollmentWindow | null }>>("/api/open-enrollment-window");
  if (!res.ok || !res.body.success) throw new Error(errorOf(res.body, "Failed to load open enrollment window"));
  return res.body.window || null;
}

/** All courses (used by the catalog and to read feedback-window flags). */
export async function fetchAllCourses(): Promise<Course[] | null> {
  const res = await apiFetch<Reply<{ courses?: Course[] }>>("/api/admin/courses");
  if (!res.body.success || !Array.isArray(res.body.courses)) return null;
  return res.body.courses;
}

/** The old page pulled every enrollment and filtered by student id client-side; kept as is. */
export async function fetchMyAdminEnrollments(studentId: string): Promise<Enrollment[] | null> {
  const res = await apiFetch<Reply<{ enrollments?: Enrollment[] }>>("/api/admin/enrollments");
  if (!res.body.success) return null;
  return (res.body.enrollments || []).filter((e) => String(e.student_id) === String(studentId));
}

export async function enrollStudent(studentId: number, courseId: number) {
  const res = await postJson<Reply<Record<string, never>>>("/api/student/enroll", {
    student_id: studentId,
    course_id: courseId,
  });
  return res.body;
}

export async function fetchStudentEnrollments(studentId: string, bustCache = false) {
  const q = bustCache ? `?t=${Date.now()}` : "";
  const res = await apiFetch<Reply<{ enrollments?: Enrollment[] }>>(`/api/student/enrollments/${studentId}${q}`);
  return res.body;
}

export async function fetchCourseName(courseId: number | string): Promise<string | null> {
  const res = await apiFetch<Reply<{ course?: { name?: string } }>>(`/api/courses/${courseId}`);
  return res.body.success && res.body.course ? res.body.course.name ?? null : null;
}

/* ───────────── Reviews / feedback ───────────── */

export async function fetchCourseFeedback(courseId: number | string): Promise<Feedback[]> {
  const res = await apiFetch<{ feedbacks?: Feedback[] } | Feedback[]>(`/api/teacher/courses/${courseId}/feedback`);
  const b = res.body;
  return Array.isArray(b) ? b : b.feedbacks || [];
}

export async function submitFeedback(payload: {
  student_id: string;
  course_id: string;
  teacher_id: string;
  rating: string;
  review: string;
}) {
  const res = await postJson<Reply<Record<string, never>>>("/api/student/feedback", payload);
  return res.body;
}

/* ───────────── Attendance ───────────── */

export async function fetchAttendance(studentId: string): Promise<AttendanceCourse[]> {
  const res = await apiFetch<Reply<{ data?: AttendanceCourse[] }>>(`/api/student/attendance/${studentId}`);
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  if (!res.body.success) throw new Error(errorOf(res.body, "Failed to load attendance"));
  return res.body.data || [];
}

/* ───────────── Quizzes ───────────── */

export async function fetchQuizzes(studentId: string): Promise<QuizSummary[]> {
  const res = await apiFetch<Reply<{ quizzes?: QuizSummary[] }>>(`/api/student/${studentId}/quizzes`);
  if (!res.ok) throw new Error(`Server returned ${res.status}: ${res.statusText}`);
  if (!res.body.success) throw new Error(errorOf(res.body, "Failed to load quizzes"));
  return res.body.quizzes || [];
}

function fetchWithTimeout(path: string, ms = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return apiFetch<Reply<{ quiz?: QuizDetail }>>(path, { signal: controller.signal }).finally(() => clearTimeout(id));
}

/** Port of the checks at the start of startQuiz(): health -> questions, with the same messages. */
export async function loadQuizForAttempt(quizId: number): Promise<QuizDetail> {
  try {
    const health = await fetchWithTimeout("/api/health");
    if (!health.ok) throw new Error("Server is not responding properly");
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError")
      throw new Error("Server check timed out. Please ensure the server is running.");
    if (e instanceof Error && e.message === "Server is not responding properly") throw e;
    throw new Error("Unable to connect to server. Please ensure the server is running.");
  }

  let body: Reply<{ quiz?: QuizDetail }>;
  try {
    const res = await fetchWithTimeout(`/api/student/quiz/${quizId}/questions`);
    if (!res.ok) {
      if (res.status === 404) throw new Error("This quiz is not currently available or has expired");
      throw new Error(`Unable to access quiz: ${res.statusText}`);
    }
    body = res.body;
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") throw new Error("Loading the quiz timed out. Please try again.");
    throw e;
  }
  if (!body.success || !body.quiz) throw new Error(errorOf(body, "Quiz is not available at this time"));

  // normalise as the vanilla code did
  const quiz = body.quiz;
  if (!quiz.quiz_id && quiz.quizId) quiz.quiz_id = quiz.quizId;
  if (!quiz.quizId && quiz.quiz_id) quiz.quizId = quiz.quiz_id;
  quiz.questions = (quiz.questions || []).map((q) => {
    if (typeof q.options === "string") {
      try {
        q.options = JSON.parse(q.options);
      } catch {
        /* keep as-is */
      }
    }
    return q;
  });
  if (quiz.timeLimit && !quiz.time_limit) quiz.time_limit = quiz.timeLimit;
  if (quiz.time_limit && !quiz.timeLimit) quiz.timeLimit = quiz.time_limit;
  return quiz;
}

export async function submitQuizAnswers(quizId: number, studentId: string, answers: Record<string, string | number>, isTimeout: boolean) {
  const res = await postJson<Reply<{ score?: number }>>(`/api/student/quiz/${quizId}/submit`, {
    studentId,
    answers,
    is_timeout: isTimeout,
  });
  if (!res.ok) throw new Error(`Server returned ${res.status}: ${res.statusText}`);
  if (!res.body.success) throw new Error(errorOf(res.body, "Failed to submit quiz"));
  return res.body.score ?? 0;
}

/* ───────────── Assignments ───────────── */

export async function fetchAssignments(studentId: string): Promise<Assignment[]> {
  const res = await apiFetch<{ assignments?: Assignment[] } | Assignment[]>(`/api/student/${studentId}/assignments`);
  const b = res.body;
  const list = Array.isArray(b) ? b : b.assignments;
  return Array.isArray(list) ? list : [];
}

export async function submitAssignmentFile(assignmentId: number, studentId: string, file: File) {
  const formData = new FormData();
  formData.append("studentId", studentId);
  formData.append("assignment_file", file);
  const res = await apiFetch<Reply<Record<string, never>>>(`/api/student/assignment/${assignmentId}/submit`, {
    method: "POST",
    body: formData, // no Content-Type header: the browser sets the multipart boundary
  });
  return res.body;
}

/* ───────────── Fee challans / transcript / grades / password ───────────── */

export async function fetchFeeChallans(studentId: string): Promise<FeeChallan[]> {
  const res = await apiFetch<Reply<{ challans?: FeeChallan[] }>>(`/api/student/${studentId}/fee-challans`);
  if (!res.ok || !res.body.success) throw new Error(errorOf(res.body, "Failed to load challans"));
  return res.body.challans || [];
}

export async function fetchTranscript(studentId: string): Promise<TranscriptRow[]> {
  const res = await apiFetch<Reply<{ transcript?: TranscriptRow[] }>>(`/api/student/transcript/${studentId}`);
  if (!res.body.success) throw new Error(errorOf(res.body, "Failed to load transcript"));
  return res.body.transcript || [];
}

export async function fetchGrades(studentId: string): Promise<GradeRow[]> {
  const res = await apiFetch<Reply<{ data?: GradeRow[] }>>(`/api/student/${studentId}/grades`);
  return res.body.success && Array.isArray(res.body.data) ? res.body.data : [];
}

export async function fetchPendingTaskCount(studentId: string): Promise<number> {
  let pending = 0;
  try {
    const a = await apiFetch<Reply<{ assignments?: Assignment[] }>>(`/api/student/${studentId}/assignments`);
    if (a.body.success) pending += (a.body.assignments || []).length;
    const q = await apiFetch<Reply<{ quizzes?: QuizSummary[] }>>("/api/student/quizzes");
    if (q.body.success) pending += (q.body.quizzes || []).length;
  } catch {
    /* original swallowed errors here */
  }
  return pending;
}

export async function changePassword(userId: string, oldPassword: string, newPassword: string, role = "student") {
  const res = await postJson<Reply<Record<string, never>>>("/api/user/change-password", {
    role,
    userId,
    oldPassword,
    newPassword,
  });
  return res;
}
