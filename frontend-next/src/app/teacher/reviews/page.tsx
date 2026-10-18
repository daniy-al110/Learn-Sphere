import { Suspense } from "react";
import type { Metadata } from "next";
import ReviewsView from "@/components/teacher/ReviewsView";

export const metadata: Metadata = { title: "Student Reviews - Learning Sphere" };

// useSearchParams() (selected course) needs a Suspense boundary.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <ReviewsView />
    </Suspense>
  );
}
