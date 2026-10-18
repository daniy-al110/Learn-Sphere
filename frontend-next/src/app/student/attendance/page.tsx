import type { Metadata } from "next";
import AttendanceView from "@/components/student/AttendanceView";

export const metadata: Metadata = { title: "Attendance - Learning Sphere" };

export default function Page() {
  return <AttendanceView />;
}
