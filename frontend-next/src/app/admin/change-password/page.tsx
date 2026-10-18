import type { Metadata } from "next";
import ChangePasswordView from "@/components/student/ChangePasswordView";

export const metadata: Metadata = { title: "Change Password - Learning Sphere" };

// The old admin page sent localStorage userId, defaulting to "1".
export default function Page() {
  return <ChangePasswordView role="admin" fallbackUserId="1" />;
}
