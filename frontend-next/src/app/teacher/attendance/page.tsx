import { Suspense } from "react";
import type { Metadata } from "next";
import AttendanceView from "@/components/teacher/AttendanceView";

export const metadata: Metadata = { title: "Attendance - Learning Sphere" };

// useSearchParams() (selected course) needs a Suspense boundary.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <AttendanceView />
    </Suspense>
  );
}
