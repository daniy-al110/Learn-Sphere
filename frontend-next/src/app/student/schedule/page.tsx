import type { Metadata } from "next";
import ScheduleView from "@/components/student/ScheduleView";

export const metadata: Metadata = { title: "Schedule - Learning Sphere" };

export default function Page() {
  return <ScheduleView />;
}
