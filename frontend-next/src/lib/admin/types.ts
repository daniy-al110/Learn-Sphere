/** Loose backend shapes used by the admin pages (fields the old code actually read). */

export interface AssignedCourse {
  course_id: number | string;
  enrollment_id?: number | string;
  course_name?: string;
  [key: string]: unknown;
}

export interface AdminStudent {
  student_id: number | string;
  name: string;
  email: string;
  degree_program?: string;
  department?: string;
  assigned_courses?: AssignedCourse[];
  [key: string]: unknown;
}

export interface AdminTeacher {
  teacher_id: number | string;
  name: string;
  email: string;
  degree_program?: string;
  department?: string;
  teaching_courses?: AssignedCourse[];
  [key: string]: unknown;
}

export interface AdminCourse {
  course_id: number;
  course_name: string;
  section_name?: string | null;
  prerequisite_course_id?: number | null;
  description?: string | null;
  credit_hours?: number | null;
  status?: string | null;
  category?: string | null;
  degree_program?: string | null;
  department?: string | null;
  teacher_name?: string | null;
  assigned_teacher_ids?: (number | string)[];
  teacher_ids?: (number | string)[];
  teacher_id?: number | string | null;
  parent_course_id?: number | string | null;
  schedule?: string | null;
  duration?: string | null;
  [key: string]: unknown;
}

export interface AdminEnrollment {
  enrollment_id: number | string;
  student_id?: number | string;
  course_id?: number | string;
  student_name?: string;
  course_name?: string;
  created_at?: string | null;
  [key: string]: unknown;
}

export interface EnrollmentRequest {
  request_id: number;
  student_name: string;
  challan_number: string;
  course_name: string;
  fee_amount: number | string;
  student_email: string;
}

export interface OpenEnrollmentWindow {
  is_open_now?: boolean;
  semester_name?: string;
  open_at?: string;
  open_at_iso?: string;
  close_at?: string;
  close_at_iso?: string;
}
