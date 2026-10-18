/** Loose backend shapes used by the teacher pages (fields the old code actually read). */

export interface TeacherCourse {
  course_id: number | string;
  course_name: string;
  description?: string | null;
  credit_hours?: number | null;
  reviews_enabled?: number | boolean | string | null;
  reviews_window_start?: string | null;
  reviews_window_end?: string | null;
  [key: string]: unknown;
}

export interface RosterStudent {
  student_id: number | string;
  name: string;
  email?: string;
  present_count?: number;
  absent_count?: number;
  [key: string]: unknown;
}

export interface StudentReview {
  student_id: number | string;
  teacher_id: number | string;
  rating: number;
  review: string;
  created_at?: string | null;
}

export interface TeacherQuiz {
  quiz_id: number;
  title?: string;
  time_limit?: number | null;
  question_count?: number;
  is_active?: boolean | number;
  allow_back_navigation?: boolean;
  randomize_questions?: boolean;
}

export type QuizQuestionType = "MCQ" | "Short Answer" | "True/False";

export interface QuizDraftQuestion {
  type: QuizQuestionType;
  text: string;
  options: string[];
  correct: string; // "0".."3" (select value) or textual short answer
}

export interface TeacherAssignment {
  assignment_id: number;
  title?: string;
  description?: string | null;
  link?: string | null;
  due_date?: string | null;
}

export interface SubmissionRow {
  student_id: number | string;
  name: string;
  submitted?: boolean | number;
  file_url?: string | null;
  marks?: number | string | null;
}

export interface MarksStudent {
  student_id: number | string;
  name: string;
  quiz_marks?: number | null;
  assignment_marks?: number | null;
  mid_marks?: number | null;
  final_marks?: number | null;
  total_marks?: number | null;
  grade?: string | null;
}
