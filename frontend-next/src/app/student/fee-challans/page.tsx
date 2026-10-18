import type { Metadata } from "next";
import FeeChallansView from "@/components/student/FeeChallansView";

export const metadata: Metadata = { title: "Fee Challans - Learning Sphere" };

export default function Page() {
  return <FeeChallansView />;
}
