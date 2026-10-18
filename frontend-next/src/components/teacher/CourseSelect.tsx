"use client";

import { useTeacherCourses } from "./TeacherCoursesProvider";

const BASE = "w-full p-3 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-accent transition-all";

/** The "Select a course..." dropdown that updateCourseSelects() filled in every section. */
export default function CourseSelect(props: {
  value: string;
  onChange: (courseId: string) => void;
  id?: string;
  className?: string;
}) {
  const { courses } = useTeacherCourses();
  return (
    <select id={props.id} value={props.value} onChange={(e) => props.onChange(e.target.value)} className={props.className ?? BASE}>
      <option value="">Select a course...</option>
      {courses.map((c) => (
        <option key={String(c.course_id)} value={String(c.course_id)}>
          {c.course_name}
        </option>
      ))}
    </select>
  );
}
