import type { Metadata } from "next";
import ScheduleView from "@/components/teacher/ScheduleView";

export const metadata: Metadata = { title: "Schedule - Learning Sphere" };

export default function Page() {
  return <ScheduleView />;
}
