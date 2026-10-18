import type { Metadata } from "next";
import DashboardView from "@/components/teacher/DashboardView";

export const metadata: Metadata = { title: "Teacher Dashboard - Learning Sphere" };

export default function Page() {
  return <DashboardView />;
}
