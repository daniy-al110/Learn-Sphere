import type { Metadata } from "next";
import LandingPageClient from "@/components/landing/LandingPageClient";

export const metadata: Metadata = {
  title: "LearnSphere LMS — Intelligent Academic Cloud Platform",
  description:
    "LearnSphere is a next-generation Learning Management System for Students, Faculty, and University Administrators featuring automated grading, real-time WebRTC virtual classrooms, and cloud persistence.",
  keywords: [
    "Learning Management System",
    "LMS",
    "Online Education",
    "Academic Portal",
    "University Portal",
    "Student Dashboard",
    "Teacher Dashboard",
    "Supabase LMS",
  ],
};

export default function Home() {
  return <LandingPageClient />;
}
