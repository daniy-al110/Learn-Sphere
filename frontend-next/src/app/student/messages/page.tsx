import type { Metadata } from "next";
import MessagesView from "@/components/shared/MessagesView";

export const metadata: Metadata = { title: "Messages - Learning Sphere" };

export default function Page() {
  return <MessagesView />;
}
