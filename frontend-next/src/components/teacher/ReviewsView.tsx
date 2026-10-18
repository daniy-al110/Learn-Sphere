"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/layout/icons";
import CourseSelect from "./CourseSelect";
import { useTeacherCourses } from "./TeacherCoursesProvider";
import { useAsync } from "@/hooks/useAsync";
import { useCourseParam } from "@/hooks/useCourseParam";
import { useSession } from "@/hooks/useSession";
import { fetchCourseReviews, fetchCourseStudents, submitStudentReview } from "@/lib/teacher/api";
import type { RosterStudent, StudentReview } from "@/lib/teacher/types";
import { toast } from "@/lib/toast-store";

interface Roster {
  students: RosterStudent[];
  reviewsByStudent: Record<string, StudentReview[]>;
}

async function loadRoster(courseId: string): Promise<Roster | null> {
  if (!courseId) return null;
  const [students, reviews] = await Promise.all([fetchCourseStudents(courseId), fetchCourseReviews(courseId)]);
  const reviewsByStudent: Record<string, StudentReview[]> = {};
  reviews.forEach((rv) => {
    const sid = String(rv.student_id);
    (reviewsByStudent[sid] ||= []).push(rv);
  });
  return { students, reviewsByStudent };
}

const MSG = "text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm";

export default function ReviewsView() {
  const { session } = useSession();
  const teacherId = session.userId ?? "";
  const { courses } = useTeacherCourses();
  const [courseId, setCourseId] = useCourseParam();
  const [search, setSearch] = useState("");

  const course = courses.find((c) => String(c.course_id) === courseId);
  const enabled = Boolean(course && course.reviews_enabled);
  const now = new Date();
  const startOk = course?.reviews_window_start ? now >= new Date(course.reviews_window_start) : true;
  const endOk = course?.reviews_window_end ? now <= new Date(course.reviews_window_end) : true;
  const open = enabled && startOk && endOk;

  // roster is only fetched when reviews are open (same gating as the old code)
  const { data, error, loading, reload } = useAsync(loadRoster, open ? courseId : "");
  if (error) console.error("Error loading reviews/students", error);

  // per-student drafts live in state (the old DOM version lost typed text on re-render)
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  function changeCourse(id: string) {
    setRatings({});
    setTexts({});
    setCourseId(id);
  }

  async function submit(student: RosterStudent) {
    const sid = String(student.student_id);
    const rating = ratings[sid];
    const review = (texts[sid] || "").trim();
    if (!rating) return toast.warning("Please select a star rating first (1-5★).");
    if (!review) return toast.warning("Please enter constructive evaluation feedback.");

    setSaving(sid);
    try {
      const resp = await submitStudentReview({
        teacher_id: teacherId, student_id: student.student_id, course_id: courseId, rating, review,
      });
      if (resp.success) {
        toast.success("Evaluation review saved successfully.");
        setRatings({});
        setTexts({});
        reload();
      } else {
        toast.error("Failed to submit evaluation: " + (resp.error || "Unknown"));
      }
    } catch (err) {
      console.error("Submit review error", err);
      toast.error("Network error during evaluation submission.");
    } finally {
      setSaving(null);
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (data?.students ?? []).filter((s) => s.name.toLowerCase().includes(q));
  }, [data, search]);

  let badge: React.ReactNode = null;
  let body: React.ReactNode;

  if (!courseId) {
    body = (
      <div className={`${MSG} text-gray-500`}>
        <Icon name="help-circle" className="w-12 h-12 mx-auto text-gray-300 mb-2" />
        <p className="font-semibold">Please select a course above to load student evaluations.</p>
      </div>
    );
  } else if (!course || !enabled) {
    body = <div className={`${MSG} text-red-500 font-semibold`}>Reviews are disabled by the administrator for this course.</div>;
  } else if (!(startOk && endOk)) {
    badge = <span className="text-xs px-3 py-1.5 rounded-full font-bold uppercase bg-red-100 text-red-600">Closed</span>;
    body = (
      <div className={`${MSG} text-gray-600 font-semibold`}>
        Reviews window is currently closed.{" "}
        {course.reviews_window_start ? "Opens: " + new Date(course.reviews_window_start).toLocaleString() : ""}{" "}
        {course.reviews_window_end ? "| Closes: " + new Date(course.reviews_window_end).toLocaleString() : ""}
      </div>
    );
  } else {
    badge = <span className="text-xs px-3 py-1.5 rounded-full font-bold uppercase bg-green-100 text-green-600">Open &amp; Accepting</span>;
    if (loading) {
      body = (
        <div className="flex flex-col items-center justify-center p-12 text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm gap-3">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold">Loading student roster and reviews...</span>
        </div>
      );
    } else if (error || !data) {
      body = <div className={`${MSG} text-red-500 font-semibold`}>Failed to load student evaluation records.</div>;
    } else if (filtered.length === 0) {
      body = (
        <div className={`${MSG} text-gray-500`}>
          <Icon name="users" className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <p className="font-semibold">No students match your filter criteria.</p>
        </div>
      );
    } else {
      body = filtered.map((student) => {
        const sid = String(student.student_id);
        const existing = data.reviewsByStudent[sid] || [];
        const hasMine = existing.some((r) => String(r.teacher_id) === String(teacherId));
        const ratingVal = ratings[sid] || 0;
        return (
          <div key={sid} className="bg-white rounded-xl border border-gray-200 shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100">
              <div>
                <h4 className="font-bold text-lg text-gray-900">{student.name}</h4>
                <p className="text-xs text-gray-500 font-semibold">Student ID: {student.student_id}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded-sm bg-gray-100 text-gray-600 uppercase">Roster Student</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Give Performance Rating</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      disabled={hasMine}
                      onClick={() => setRatings((r) => ({ ...r, [sid]: num }))}
                      className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center border transition-all ${
                        hasMine
                          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          : ratingVal === num
                            ? "bg-accent text-white border-accent shadow-md scale-105 cursor-pointer"
                            : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200 cursor-pointer"
                      }`}
                    >
                      {num}★
                    </button>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Evaluation Feedback Notes</label>
                <textarea
                  rows={2}
                  disabled={hasMine}
                  value={texts[sid] || ""}
                  onChange={(e) => setTexts((t) => ({ ...t, [sid]: e.target.value }))}
                  placeholder="Provide constructive feedback notes on performance..."
                  className={`w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-accent transition-all ${
                    hasMine ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""
                  }`}
                />
              </div>
              <div className="flex items-center justify-end h-full pt-6 lg:pt-0">
                <button
                  type="button"
                  disabled={hasMine || saving === sid}
                  onClick={() => submit(student)}
                  className={`w-full lg:w-auto px-6 py-2.5 rounded-lg text-sm font-bold shadow-md transition-all ${
                    hasMine ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-accent hover:bg-accent-hover text-white hover:-translate-y-0.5 cursor-pointer"
                  }`}
                >
                  {saving === sid ? (
                    <span className="flex items-center gap-1.5 justify-center">
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : hasMine ? "Already Evaluated" : "Submit Review"}
                </button>
              </div>
            </div>

            {existing.map((r, i) => (
              <div key={i} className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Evaluation Log</span>
                  <span className="text-xs font-bold text-accent" style={{ color: "#e94560" }}>Rating: {r.rating}/5</span>
                </div>
                <p className="text-sm text-gray-700 font-medium">{r.review}</p>
                <div className="text-right text-[10px] text-gray-400 mt-1 font-semibold">
                  {r.created_at ? new Date(r.created_at).toLocaleString() : ""}
                </div>
              </div>
            ))}
          </div>
        );
      });
    }
  }

  return (
    <div id="reviews">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Student Reviews &amp; Evaluation</h2>
        {badge}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Select Course</label>
          <CourseSelect value={courseId} onChange={changeCourse} id="reviewsCourseSelect" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Search Students</label>
          <div className="relative">
            <Icon name="search" className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter student list..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-accent transition-all"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6" id="reviewsList">{body}</div>
    </div>
  );
}
