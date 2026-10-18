/** Loose backend shapes used by the student pages (fields the old code actually read). */

export interface Course {
  course_id: number | string;
  course_name: string;
  description?: string | null;
  created_at?: string | null;
  credit_hours?: number | null;
  teacher_id?: number | string | null;
  student_feedback_enabled?: number | string | boolean;
  student_feedback_window_start?: string | null;
  student_feedback_window_end?: string | null;
}

export interface Enrollment {
  student_id?: number | string;
  course_id: number | string;
  course_name?: string;
  teacher_id?: number | string | null;
  teacher_name?: string | null;
  credit_hours?: number | null;
  schedule?: string | null;
  duration?: string | null;
}

export interface OpenEnrollmentWindow {
  is_open_now?: boolean;
  semester_name?: string;
  open_at?: string;
  open_at_iso?: string;
  close_at?: string;
  close_at_iso?: string;
}

export interface AttendanceRecord {
  date: string;
  status: string;
}
export interface AttendanceCourse {
  course_name: string;
  present_count: number;
  absent_count: number;
  attendance_percentage: number;
  attendance_details?: AttendanceRecord[];
}

export interface QuizSummary {
  quiz_id: number;
  title: string;
  description?: string | null;
  course_name?: string;
  time_limit: number;
  is_active?: boolean | number;
  submitted_at?: string | null;
  student_score?: number;
  total_questions?: number;
}
export interface QuizQuestion {
  question_id: number | string;
  question_type?: "MCQ" | "Short Answer" | "True/False";
  question_text: string;
  options: string[] | string;
}
export interface QuizDetail {
  quiz_id: number;
  quizId?: number;
  title: string;
  time_limit?: number;
  timeLimit?: number;
  allow_back_navigation?: boolean;
  randomize_questions?: boolean;
  questions: QuizQuestion[];
}

export interface Assignment {
  assignment_id?: number;
  id?: number;
  title: string;
  description?: string | null;
  course_name?: string;
  due_date?: string | null;
  status: "submitted" | "pending" | "overdue" | string;
  link?: string | null;
  marks?: number | string | null;
}

export interface ChallanCourse {
  course_id?: number | string;
  course_name?: string;
  credit_hours?: number | null;
}
export interface FeeChallan {
  challan_id?: number | string;
  challan_number: string;
  status: string;
  semester?: string;
  due_date?: string;
  issue_date?: string;
  student_name?: string;
  student_email?: string;
  total_credit_hours?: number;
  fee_per_credit_hour?: number;
  total_amount?: number;
  amount?: number;
  courses?: ChallanCourse[];
}

export interface TranscriptRow {
  name?: string;
  grade?: string | null;
  cgpa?: number | string | null;
  total_marks?: number | string | null;
}

export interface GradeRow {
  marks_obtained?: number | string | null;
}
export interface Feedback {
  student_id: number | string;
}
