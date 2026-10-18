import { Suspense } from "react";
import type { Metadata } from "next";
import MarksView from "@/components/teacher/MarksView";

export const metadata: Metadata = { title: "Marks - Learning Sphere" };

// useSearchParams() (selected course) needs a Suspense boundary.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <MarksView />
    </Suspense>
  );
}
