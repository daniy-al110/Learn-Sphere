import type { Metadata } from "next";
import LandingPageClient from "@/components/landing/LandingPageClient";

export const metadata: Metadata = {
  title: "LearnSphere LMS | Intelligent Academic Cloud Platform",
  description:
    "LearnSphere is the intelligent Operating System for modern academies, universities, and coaching centers. Featuring automated grading ledgers, WebRTC video classrooms, token-based enrollment, and cloud course tracking.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return <LandingPageClient />;
}
