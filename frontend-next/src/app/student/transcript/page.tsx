import type { Metadata } from "next";
import TranscriptView from "@/components/student/TranscriptView";

export const metadata: Metadata = { title: "Transcript - Learning Sphere" };

export default function Page() {
  return <TranscriptView />;
}
