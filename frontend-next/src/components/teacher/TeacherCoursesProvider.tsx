"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useAsync } from "@/hooks/useAsync";
import { useSession } from "@/hooks/useSession";
import { fetchTeacherCourses } from "@/lib/teacher/api";
import type { TeacherCourse } from "@/lib/teacher/types";

interface Ctx {
  courses: TeacherCourse[];
  loading: boolean;
  error: Error | undefined;
  reload: () => void;
}
const TeacherCoursesCtx = createContext<Ctx | null>(null);

export function useTeacherCourses() {
  const c = useContext(TeacherCoursesCtx);
  if (!c) throw new Error("useTeacherCourses must be used inside <TeacherCoursesProvider>");
  return c;
}

/**
 * Replaces the global `teacherCourses` array + updateCourseSelects(): loads the teacher's
 * courses once for the whole /teacher section; pages read them via useTeacherCourses().
 */
export default function TeacherCoursesProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const { data, error, loading, reload } = useAsync(fetchTeacherCourses, session.userId ?? "");
  const value = useMemo(() => ({ courses: data ?? [], loading, error, reload }), [data, loading, error, reload]);
  return <TeacherCoursesCtx.Provider value={value}>{children}</TeacherCoursesCtx.Provider>;
}
