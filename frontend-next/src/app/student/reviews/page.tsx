import type { Metadata } from "next";
import ReviewsView from "@/components/student/ReviewsView";

export const metadata: Metadata = { title: "Reviews - Learning Sphere" };

export default function Page() {
  return <ReviewsView />;
}
