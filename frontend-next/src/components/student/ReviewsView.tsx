"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAsync } from "@/hooks/useAsync";
import { useSession } from "@/hooks/useSession";
import { fetchAllCourses, fetchCourseFeedback, fetchMyAdminEnrollments, submitFeedback } from "@/lib/student/api";
import type { Course, Enrollment } from "@/lib/student/types";

/** Enrollments that currently accept feedback (flag enabled + inside the feedback window). */
async function loadReviewable(studentId: string): Promise<Enrollment[] | null> {
  const enrollments = await fetchMyAdminEnrollments(studentId);
  if (!enrollments) return null;
  const courses = (await fetchAllCourses().catch(() => null)) || [];
  const byId: Record<string, Course> = {};
  courses.forEach((c) => (byId[String(c.course_id)] = c));

  const now = new Date();
  return enrollments.filter((e) => {
    const c = byId[String(e.course_id)];
    if (!c) return false;
    const flag = c.student_feedback_enabled;
    if (flag !== undefined && flag !== 1 && flag !== "1") return false;
    const start = c.student_feedback_window_start ? new Date(c.student_feedback_window_start) : null;
    const end = c.student_feedback_window_end ? new Date(c.student_feedback_window_end) : null;
    return (start ? now >= start : true) && (end ? now <= end : true);
  });
}

function FeedbackForm({ enrollment, studentId }: { enrollment: Enrollment; studentId: string }) {
  const [rating, setRating] = useState("");
  const [review, setReview] = useState("");
  const [status, setStatus] = useState("");
  const [locked, setLocked] = useState(false);

  // disable the form if this student already submitted feedback for the course
  useEffect(() => {
    let cancelled = false;
    fetchCourseFeedback(enrollment.course_id)
      .then((list) => {
        if (!cancelled && list.find((f) => String(f.student_id) === String(studentId))) {
          setLocked(true);
          setStatus("Feedback already submitted for this course");
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [enrollment.course_id, studentId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const resp = await submitFeedback({
        student_id: studentId,
        course_id: String(enrollment.course_id),
        teacher_id: String(enrollment.teacher_id ?? ""),
        rating,
        review,
      });
      setStatus(resp.success ? "Feedback submitted!" : "Error: " + (resp.error || "Unknown error"));
      if (resp.success) {
        setRating("");
        setReview("");
        setLocked(true);
      }
    } catch {
      setStatus("Network error");
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <label className="block mb-1 font-semibold">Your Rating (1-5):</label>
      <input
        type="number" min={1} max={5} required disabled={locked}
        value={rating} onChange={(e) => setRating(e.target.value)}
        className="border rounded-sm px-2 py-1 mb-2 w-16"
      />
      <label className="block mb-1 font-semibold">Your Review:</label>
      <textarea
        rows={2} required disabled={locked}
        value={review} onChange={(e) => setReview(e.target.value)}
        className="border rounded-sm px-2 py-1 mb-2 w-full"
      />
      <button type="submit" disabled={locked} className="bg-accent text-white px-4 py-2 rounded-sm hover:bg-accent-hover cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
        Submit Feedback
      </button>
      <div className="mt-2 text-sm">{status}</div>
    </form>
  );
}

export default function ReviewsView() {
  const { session } = useSession();
  const studentId = session.userId ?? "";
  const { data, loading } = useAsync(loadReviewable, studentId);

  return (
    <div className="p-8 max-w-6xl mx-auto" id="reviews">
      <h2 className="text-3xl font-bold mb-6">My Reviews / Feedback</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? null : !data || data.length === 0 ? (
          <div className="col-span-3 text-center text-gray-500 py-8">No active reviews at the moment.</div>
        ) : (
          data.map((e) => (
            <div key={String(e.course_id)} className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h3 className="text-xl font-bold mb-2">
                {e.course_name} ({e.course_id})
              </h3>
              <p className="text-gray-600 mb-2">Teacher ID: {e.teacher_id || ""}</p>
              <FeedbackForm enrollment={e} studentId={studentId} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
