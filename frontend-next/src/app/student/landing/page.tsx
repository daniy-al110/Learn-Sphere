import type { Metadata } from "next";
import DashboardView from "@/components/student/DashboardView";

export const metadata: Metadata = { title: "Student Landing - Learning Sphere" };

export default function Page() {
  return <DashboardView />;
}
