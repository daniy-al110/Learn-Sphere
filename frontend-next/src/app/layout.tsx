import type { Metadata, Viewport } from "next";
import "./globals.css";
import ToastViewport from "@/components/ui/ToastViewport";
import ConfirmModalHost from "@/components/ui/ConfirmModalHost";
import ThemeSync from "@/components/ui/ThemeSync";
import GlobalRouteProgress from "@/components/ui/GlobalRouteProgress";
import JsonLd from "@/components/seo/JsonLd";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://learnsphere-lms.com";

export const viewport: Viewport = {
  themeColor: "#030712",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LearnSphere LMS — Intelligent Academic Cloud Platform",
    template: "%s | LearnSphere LMS",
  },
  description:
    "LearnSphere is a modern Learning Management System for universities, academies, and online educators featuring automated grading, WebRTC virtual classrooms, and cloud persistence.",
  keywords: [
    "Learning Management System",
    "LMS",
    "Online Education Platform",
    "Virtual Classroom WebRTC",
    "Student Information System",
    "Academic Portal",
    "Automated Grading Software",
    "Teacher Course Management",
    "Online Course Curriculum",
    "Supabase LMS",
    "Next.js LMS",
  ],
  authors: [{ name: "LearnSphere Academic Team" }],
  creator: "LearnSphere",
  publisher: "LearnSphere",
  applicationName: "LearnSphere LMS",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "LearnSphere LMS",
    title: "LearnSphere LMS — Intelligent Academic Cloud Platform",
    description:
      "Modern Learning Management System with automated grading, real-time WebRTC virtual classrooms, and cloud persistence.",
    images: [
      {
        url: "/favicon.ico",
        width: 1200,
        height: 630,
        alt: "LearnSphere Academic Cloud Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LearnSphere LMS — Intelligent Academic Cloud Platform",
    description:
      "Modern Learning Management System with automated grading, real-time WebRTC virtual classrooms, and cloud persistence.",
    creator: "@learnsphere",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// Server Component: static shell only. Interactive globals are client components below.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning style={{ zoom: "0.9" } as React.CSSProperties}>
      <body>
        <JsonLd />
        <GlobalRouteProgress />
        {children}
        <ToastViewport />
        <ConfirmModalHost />
        <ThemeSync />
      </body>
    </html>
  );
}

