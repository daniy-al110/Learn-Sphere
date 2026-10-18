"use client";

import Link from "next/link";
import { Icon } from "@/components/layout/icons";
import { useTeacherCourses } from "./TeacherCoursesProvider";

export default function CoursesView() {
  const { courses, loading, error } = useTeacherCourses();
  if (error) console.error("Error loading courses:", error);

  return (
    <div id="courses">
      <h2 className="text-3xl font-bold mb-6">My Courses</h2>
      <div id="coursesGrid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? null : error ? (
          <p className="text-center text-red-600">Failed to load courses</p>
        ) : (
          courses.map((course) => (
            <div key={String(course.course_id)} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-2">{course.course_name}</h3>
              <div className="inline-flex items-center gap-1.5 mb-3 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                <Icon name="clock-3" className="w-3.5 h-3.5" />
                {course.credit_hours || 3} Credit Hours
              </div>
              <p className="text-gray-600 mb-4">{course.description || "No description available"}</p>
              <div className="flex gap-2">
                <Link href={`/teacher/attendance?course=${course.course_id}`} className="bg-blue-600 text-white px-4 py-2 rounded-sm hover:bg-blue-700">
                  Attendance
                </Link>
                <Link href={`/teacher/assignments?course=${course.course_id}`} className="bg-green-600 text-white px-4 py-2 rounded-sm hover:bg-green-700">
                  Assignments
                </Link>
                <Link href={`/teacher/quizzes?course=${course.course_id}`} className="bg-purple-600 text-white px-4 py-2 rounded-sm hover:bg-purple-700">
                  Quizzes
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
