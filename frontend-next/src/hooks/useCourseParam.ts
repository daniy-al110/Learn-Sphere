"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Selected course kept in the URL (?course=ID). This is how "My Courses" buttons could do
 * `showPage('attendance'); select.value = id` before: now they just link to /teacher/attendance?course=ID.
 */
export function useCourseParam(): [string, (id: string) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const value = params.get("course") ?? "";
  const set = useCallback(
    (id: string) => {
      const next = new URLSearchParams(params.toString());
      if (id) next.set("course", id);
      else next.delete("course");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );
  return [value, set];
}
