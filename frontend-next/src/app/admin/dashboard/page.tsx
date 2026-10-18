import type { Metadata } from "next";
import DashboardView from "@/components/admin/DashboardView";

export const metadata: Metadata = { title: "Admin Dashboard - Learning Sphere" };

export default function Page() {
  return <DashboardView />;
}
