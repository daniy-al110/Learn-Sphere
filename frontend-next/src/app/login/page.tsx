import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Institutional Login & Role Portal",
  description:
    "Secure unified authentication for Students, Faculty, and University Administrators. Automatic role detection, institutional email validation, and temporary password reset on LearnSphere LMS.",
  alternates: {
    canonical: "/login",
  },
};

export default function LoginPage() {
  return <LoginForm />;
}
