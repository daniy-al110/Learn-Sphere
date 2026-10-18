"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useAsync } from "@/hooks/useAsync";
import { fetchCourses, fetchEnrollments, fetchStudents, fetchTeachers } from "@/lib/admin/api";
import type { AdminCourse, AdminEnrollment, AdminStudent, AdminTeacher } from "@/lib/admin/types";

interface Resource<T> {
  data: T[];
  loading: boolean;
  error: Error | undefined;
  reload: () => void;
}
interface Ctx {
  students: Resource<AdminStudent>;
  teachers: Resource<AdminTeacher>;
  courses: Resource<AdminCourse>;
  enrollments: Resource<AdminEnrollment>;
}
const AdminDataCtx = createContext<Ctx | null>(null);

export function useAdminData() {
  const c = useContext(AdminDataCtx);
  if (!c) throw new Error("useAdminData must be used inside <AdminDataProvider>");
  return c;
}

const none = null;
function useResource<T>(loader: (arg: null) => Promise<T[]>): Resource<T> {
  const { data, loading, error, reload } = useAsync(loader, none);
  return useMemo(() => ({ data: data ?? [], loading, error, reload }), [data, loading, error, reload]);
}

/**
 * Replaces window._cachedStudents / _cachedTeachers / _cachedCourses / _cachedEnrollments.
 * Loaded once when the admin area mounts; sections read them (and call reload() after changes).
 */
export default function AdminDataProvider({ children }: { children: ReactNode }) {
  const students = useResource(fetchStudents);
  const teachers = useResource(fetchTeachers);
  const courses = useResource(fetchCourses);
  const enrollments = useResource(fetchEnrollments);
  const value = useMemo(() => ({ students, teachers, courses, enrollments }), [students, teachers, courses, enrollments]);
  return <AdminDataCtx.Provider value={value}>{children}</AdminDataCtx.Provider>;
}
