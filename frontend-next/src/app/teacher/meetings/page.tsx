import type { Metadata } from "next";
import MeetingsView from "@/components/teacher/MeetingsView";

export const metadata: Metadata = {
  title: "Manage Meetings - Learning Sphere",
};

export default function MeetingsPage() {
  return <MeetingsView />;
}
