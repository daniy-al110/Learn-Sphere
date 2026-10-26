"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/layout/icons";
import { useTeacherCourses } from "./TeacherCoursesProvider";
import ShareClassModal from "@/components/courses/ShareClassModal";
import { Share2 } from "lucide-react";

export default function CoursesView() {
  const { courses, loading, error } = useTeacherCourses();
  const [sharingCourse, setSharingCourse] = useState<{ id: number; name: string } | null>(null);

  if (error) console.error("Error loading courses:", error);

  return (
    <div id="courses">
      <h2 className="text-3xl font-bold mb-6">My Courses</h2>
      <div id="coursesGrid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? null : error ? (
          <p className="text-center text-red-600">Failed to load courses</p>
        ) : (
          courses.map((course) => (
            <div key={String(course.course_id)} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{course.course_name}</h3>
                  <button
                    type="button"
                    onClick={() => setSharingCourse({ id: Number(course.course_id), name: course.course_name })}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-pink-600 hover:text-white bg-pink-50 hover:bg-pink-600 transition-colors border border-pink-200 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>
                </div>
                <div className="inline-flex items-center gap-1.5 mb-3 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                  <Icon name="clock-3" className="w-3.5 h-3.5" />
                  {course.credit_hours || 3} Credit Hours
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{course.description || "No description available"}</p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                <Link href={`/teacher/attendance?course=${course.course_id}`} className="bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-700">
                  Attendance
                </Link>
                <Link href={`/teacher/assignments?course=${course.course_id}`} className="bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-green-700">
                  Assignments
                </Link>
                <Link href={`/teacher/quizzes?course=${course.course_id}`} className="bg-purple-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-purple-700">
                  Quizzes
                </Link>
              </div>
            </div>
          ))
        )}
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
