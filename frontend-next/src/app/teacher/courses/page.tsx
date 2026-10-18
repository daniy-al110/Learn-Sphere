import type { Metadata } from "next";
import CoursesView from "@/components/teacher/CoursesView";

export const metadata: Metadata = { title: "My Courses - Learning Sphere" };

export default function Page() {
  return <CoursesView />;
}
