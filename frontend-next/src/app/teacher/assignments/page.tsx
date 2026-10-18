import { Suspense } from "react";
import type { Metadata } from "next";
import AssignmentsView from "@/components/teacher/AssignmentsView";

export const metadata: Metadata = { title: "Assignments - Learning Sphere" };

// useSearchParams() (selected course) needs a Suspense boundary.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <AssignmentsView />
    </Suspense>
  );
}
