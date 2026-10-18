import { Suspense } from "react";
import type { Metadata } from "next";
import QuizzesView from "@/components/teacher/QuizzesView";

export const metadata: Metadata = { title: "Quizzes - Learning Sphere" };

// useSearchParams() (selected course) needs a Suspense boundary.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <QuizzesView />
    </Suspense>
  );
}
