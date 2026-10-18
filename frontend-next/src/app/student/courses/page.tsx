import type { Metadata } from "next";
import CoursesView from "@/components/student/CoursesView";

export const metadata: Metadata = { title: "Courses - Learning Sphere" };

export default function Page() {
  return <CoursesView />;
}
