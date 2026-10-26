import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join Class & Quick Enrollment",
  description:
    "Enter your course invite token to securely join your virtual class hall, view course assignments, and connect with your instructors on LearnSphere LMS.",
  alternates: {
    canonical: "/join",
  },
};

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
