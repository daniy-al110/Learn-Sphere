import type { Metadata } from "next";
import AssignmentsView from "@/components/student/AssignmentsView";

export const metadata: Metadata = { title: "Assignments - Learning Sphere" };

export default function Page() {
  return <AssignmentsView />;
}
