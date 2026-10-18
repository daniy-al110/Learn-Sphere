import type { Metadata } from "next";
import QuizzesView from "@/components/student/QuizzesView";

export const metadata: Metadata = { title: "Quizzes - Learning Sphere" };

export default function Page() {
  return <QuizzesView />;
}
