"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast-store";
import { useSession } from "@/hooks/useSession";
import { API_BASE_URL } from "@/lib/config";
import { Icon } from "../layout/icons";

interface Course {
  course_id: number;
  course_name: string;
  course_code: string;
  teacher_name?: string;
}

interface Lecture {
  lecture_id: number;
  course_id: number;
  teacher_id: number;
  title: string;
  description: string;
  content_type: string;
  media_url: string;
  duration_minutes: number | null;
  upload_date: string;
}

export default function StudentLecturesView() {
  const { session, ready } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | "">("");
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready && session.userId) {
      fetchCourses();
    }
  }, [ready, session]);

  useEffect(() => {
    if (selectedCourse) {
      fetchLectures(selectedCourse as number);
    } else {
      setLectures([]);
    }
  }, [selectedCourse]);

  async function fetchCourses() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/enrollments`);
      const data = await res.json();
      if (data.success && data.enrollments) {
        const studentEnrollments = data.enrollments.filter((e: any) => String(e.student_id) === String(session.userId));
        setCourses(studentEnrollments);
      }
    } catch (err) {
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  }

  async function fetchLectures(courseId: number) {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/lectures?course_id=${courseId}`);
      const data = await res.json();
      if (data.success) {
        setLectures(data.lectures);
      } else {
        toast.error("Failed to fetch lectures");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (loading && courses.length === 0) {
    return <div className="p-6 text-gray-500 animate-pulse">Loading lectures...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Lectures</h1>
          <p className="text-sm text-gray-500">Watch video lectures uploaded by your instructors.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value ? Number(e.target.value) : "")}
            className="w-full sm:w-1/3 border-gray-300 rounded-lg shadow-sm focus:border-accent focus:ring-accent"
          >
            <option value="">-- Select a Course --</option>
            {courses.map((c) => (
              <option key={c.course_id} value={c.course_id}>
                {c.course_name} {c.course_code ? `(${c.course_code})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="p-0">
          {!selectedCourse ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
              <Icon name="video" className="w-12 h-12 text-gray-300 mb-4" />
              <p>Please select a course to view available lectures.</p>
            </div>
          ) : loading ? (
            <div className="p-12 text-center text-gray-500">Loading...</div>
          ) : lectures.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Icon name="play-circle" className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No lectures available</h3>
              <p className="text-sm text-gray-500 max-w-sm">Your instructor hasn't uploaded any video lectures for this course yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {lectures.map((l) => (
                <div key={l.lecture_id} className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                  <div className="aspect-video bg-gray-900 relative group flex items-center justify-center">
                    <Icon name={l.content_type === 'YouTube' ? "video" : "play-circle"} className="w-12 h-12 text-white/50 group-hover:text-white transition-colors" />
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded font-medium">
                      {l.duration_minutes ? `${l.duration_minutes}m` : l.content_type}
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h4 className="font-bold text-gray-900 line-clamp-1 mb-1" title={l.title}>{l.title}</h4>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{l.description || "No description provided."}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xs text-gray-400">
                        {new Date(l.upload_date).toLocaleDateString()}
                      </span>
                      <a 
                        href={l.media_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="px-4 py-2 bg-accent/10 hover:bg-accent text-accent hover:text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <Icon name="play-circle" className="w-4 h-4" />
                        Watch
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
