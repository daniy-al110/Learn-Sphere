import type { Metadata } from "next";
import StudentMeetingsView from "@/components/student/StudentMeetingsView";

export const metadata: Metadata = {
  title: "My Meetings - Learning Sphere",
};

export default function MeetingsPage() {
  return <StudentMeetingsView />;
}
