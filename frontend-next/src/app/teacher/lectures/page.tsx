import type { Metadata } from "next";
import LecturesView from "@/components/teacher/LecturesView";

export const metadata: Metadata = {
  title: "My Lectures - Learning Sphere",
  description: "Manage and upload your lecture videos.",
};

export default function LecturesPage() {
  return <LecturesView />;
}
