"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/layout/icons";
import { FilterBar } from "./shared";
import { useAsync } from "@/hooks/useAsync";
import { useSession } from "@/hooks/useSession";
import {
  enrollStudent, fetchAllCourses, fetchMyAdminEnrollments, fetchOpenEnrollmentWindow,
} from "@/lib/student/api";
import { filterCourses, formatPkDisplay } from "@/lib/student/helpers";
import { API_BASE_URL } from "@/lib/config";
import type { Course, OpenEnrollmentWindow } from "@/lib/student/types";
import { toast } from "@/lib/toast-store";

interface CatalogData {
  window: OpenEnrollmentWindow | null;
  courses: Course[] | null; // null => failed to load
  enrolledIds: number[];
}

/** Port of loadEnrolledCoursesAndRender() + renderCourses(): window, catalog and my enrollments. */

async function loadCatalog(studentId: string) {
  const [enrollments, windowRes] = await Promise.all([
    fetchMyAdminEnrollments(studentId).catch(() => null),
    fetch(`${API_BASE_URL}/api/student/${studentId}/registration-window`).then(r => r.json()).catch(() => null)
  ]);
  const courses = await fetchAllCourses().catch(() => null);
  
  return { 
    windowInfo: windowRes || { eligible: false, reason: "Could not fetch registration window" },
    courses, 
    enrolledIds: (enrollments || []).map((e: any) => Number(e.course_id)) 
  };
}

function courseImage(name: string) {
  const n = name.toLowerCase();
  if (n.includes("design")) return "https://images.unsplash.com/photo-1561070791-26c113006238?w=500&auto=format&fit=crop";
  if (n.includes("business")) return "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop";
  return "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&auto=format&fit=crop";
}


function Banner({ winInfo }: { winInfo: any }) {
  if (!winInfo) return null;
  const isEligible = Boolean(winInfo.eligible);
  const win = winInfo.window;
  const degree = winInfo.degree_program || "Unknown Degree";

  if (!isEligible) {
    return (
      <div className="mb-6 rounded-xl border px-5 py-4 text-sm border-red-200 bg-red-50 text-red-800">
        <div className="font-semibold">Registration Status: Closed</div>
        <div>Degree Program: {degree}</div>
        <div>Reason: {winInfo.reason || "Not eligible for registration at this time"}</div>
      </div>
    );
  }

  const isLate = winInfo.isLateRegistration;
  return (
    <div className={`mb-6 rounded-xl border px-5 py-4 text-sm ${isLate ? "border-yellow-200 bg-yellow-50 text-yellow-800" : "border-green-200 bg-green-50 text-green-800"}`}>
      <div className="font-semibold">Registration Status: {isLate ? "Late Registration Open" : "Open"}</div>
      <div>Semester: {win?.semester}</div>
      <div>Degree Program: {degree}</div>
      <div className="mt-1">
        <div>Min Credits: {win?.min_credit_hours} | Max Credits: {win?.max_credit_hours}</div>
        {isLate ? (
          <div>Late Window Closes: {new Date(win?.late_close_date).toLocaleString()}</div>
        ) : (
          <div>Window Closes: {new Date(win?.close_date).toLocaleString()}</div>
        )}
      </div>
    </div>
  );
}

function Skeletons() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100 p-6 space-y-4 animate-pulse">
          <div className="h-40 bg-slate-200 rounded-lg w-full" />
          <div className="h-6 bg-slate-200 rounded w-3/4" />
          <div className="h-4 bg-slate-200 rounded w-1/2" />
          <div className="h-10 bg-slate-200 rounded w-1/3 mt-4" />
        </div>
      ))}
    </>
  );
}

export default function CoursesView() {
  const { session } = useSession();
  const studentId = session.userId ?? "";
  const { data, loading, reload } = useAsync(loadCatalog, studentId);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("name_asc");
  const [enrollingId, setEnrollingId] = useState<number | null>(null);

  const isOpen = Boolean(data?.windowInfo?.eligible);
  const visible = useMemo(
    () => (data?.courses ? filterCourses(data.courses, search, category, sort) : []),
    [data, search, category, sort],
  );

  async function enroll(course: Course) {
    const courseId = Number(course.course_id);
    if (!studentId) return toast.warning("You must be logged in as a student.");
    if (!courseId) return toast.error("Invalid course selected.");
    if (data?.enrolledIds.includes(courseId)) return toast.info("You are already enrolled in this course.");

    setEnrollingId(courseId);
    try {
      if (!isOpen) {
        toast.info("Open enrollment is currently closed.");
        return;
      }
      const res = await enrollStudent(Number(studentId), courseId);
      if (res.success) {
        toast.success("Successfully enrolled in " + course.course_name + "!");
        reload(); // refreshes enrollments + catalog (old code also refreshed the schedule)
      } else {
        toast.error("Enrollment failed: " + (res.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Direct enrollment error:", err);
      toast.error("Failed to enroll in the course.");
    } finally {
      setEnrollingId(null);
    }
  }

  let grid: React.ReactNode;
  if (loading) {
    grid = <Skeletons />;
  } else if (!data?.courses) {
    grid = <div className="col-span-3 text-center text-red-600">Failed to load courses.</div>;
  } else if (!isOpen) {
    grid = (
      <div className="col-span-3 text-center py-12 bg-white rounded-xl shadow-xs border border-gray-200">
        <Icon name="calendar-x" className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-700 text-lg font-semibold">No courses are offered right now.</p>
        <p className="text-gray-500 mt-1">Open enrollment is currently closed for this semester.</p>
      </div>
    );
  } else if (visible.length === 0) {
    grid = (
      <div className="col-span-3 text-center py-12">
        <Icon name="inbox" className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-lg">No courses found matching your criteria.</p>
      </div>
    );
  } else {
    grid = visible.map((course) => {
      const id = Number(course.course_id);
      const enrolled = data.enrolledIds.includes(id);
      const enrolling = enrollingId === id;
      return (
        <div
          key={course.course_id}
          className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col justify-between"
        >
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={courseImage(course.course_name)} alt="Course cover" className="w-full h-44 object-cover" />
            <div className="p-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold uppercase" style={{ color: "#e94560", backgroundColor: "#fff0f2" }}>
                  ID: {course.course_id}
                </span>
                <span className="text-gray-500 text-xs flex items-center">
                  <Icon name="calendar" className="w-3.5 h-3.5 mr-1" />
                  {course.created_at ? course.created_at.split("T")[0] : "Active"}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{course.course_name}</h3>
              <div className="inline-flex items-center gap-1.5 mb-3 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                <Icon name="clock-3" className="w-3.5 h-3.5" />
                {course.credit_hours || 3} Credit Hours
              </div>
              <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                {course.description || "No description provided."}
              </p>
            </div>
          </div>
          <div className="px-6 pb-6 pt-2 border-t border-gray-100 flex justify-between items-center bg-gray-50">
            <span className="text-sm font-semibold text-gray-500">{course.credit_hours || 3} CH</span>
            {enrolled ? (
              <button disabled className="bg-gray-300 text-gray-600 cursor-not-allowed px-4 py-2 rounded-lg text-sm font-semibold flex items-center">
                <Icon name="check-circle" className="w-4 h-4 mr-1.5 text-green-600" /> Enrolled
              </button>
            ) : isOpen ? (
              <button
                disabled={enrolling}
                onClick={() => enroll(course)}
                className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center hover:shadow-md cursor-pointer disabled:opacity-70"
              >
                {enrolling ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Enrolling...
                  </>
                ) : (
                  <>
                    Enroll Now <Icon name="arrow-right" className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </button>
            ) : (
              <button disabled className="bg-gray-300 text-gray-600 cursor-not-allowed px-4 py-2 rounded-lg text-sm font-semibold flex items-center">
                Enrollment Closed
              </button>
            )}
          </div>
        </div>
      );
    });
  }

  return (
    <div className="p-8 max-w-6xl mx-auto" id="courses">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Course Registration</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Discover our most in-demand courses designed to help you master the latest technologies and advance your career.
        </p>
      </div>

      {loading ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          Loading open enrollment status...
        </div>
      ) : (
        <Banner win={data?.window ?? null} />
      )}

      <FilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Search courses by name or description..."
        selects={[
          {
            value: category,
            onChange: setCategory,
            options: [["all", "All Categories"], ["tech", "Technology"], ["business", "Business"], ["design", "Design"]],
          },
          {
            value: sort,
            onChange: setSort,
            options: [["name_asc", "Name (A-Z)"], ["name_desc", "Name (Z-A)"], ["id_desc", "Newest First"]],
          },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" id="coursesGrid">
        {grid}
      </div>
    </div>
  );
}
