import RegistrationWindowsView from "@/components/admin/RegistrationWindowsView";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Registration Windows - Admin Dashboard" };

export default function RegistrationWindowsPage() {
  return <RegistrationWindowsView />;
}
