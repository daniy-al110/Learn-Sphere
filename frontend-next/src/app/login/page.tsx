import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Login - Learning Sphere" };

// Server Component: renders the static page; all interactivity is in <LoginForm/>.
export default function LoginPage() {
  return <LoginForm />;
}
