import type { Metadata } from "next";
import MeetingRoomView from "@/components/meeting/MeetingRoomView";

export const metadata: Metadata = {
  title: "Live Class - Learning Sphere",
};

export default async function MeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <MeetingRoomView roomId={resolvedParams.id} />;
}
