import type { Metadata } from "next";
import ChangePasswordView from "@/components/student/ChangePasswordView";

export const metadata: Metadata = { title: "Change Password - Learning Sphere" };

export default function Page() {
  return <ChangePasswordView role="teacher" />;
}
