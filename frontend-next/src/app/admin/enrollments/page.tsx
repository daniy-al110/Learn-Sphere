import type { Metadata } from "next";
import EnrollmentsView from "@/components/admin/EnrollmentsView";

export const metadata: Metadata = { title: "Enrollments - Learning Sphere" };

export default function Page() {
  return <EnrollmentsView />;
}
