import type { Metadata } from "next";
import StudentLecturesView from "@/components/student/StudentLecturesView";

export const metadata: Metadata = {
  title: "Lectures - Learning Sphere",
  description: "Watch your course lectures.",
};

export default function StudentLecturesPage() {
  return <StudentLecturesView />;
}
