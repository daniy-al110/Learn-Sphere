import type { Metadata } from "next";
import "./globals.css";
import ToastViewport from "@/components/ui/ToastViewport";
import ConfirmModalHost from "@/components/ui/ConfirmModalHost";
import ThemeSync from "@/components/ui/ThemeSync";
import GlobalRouteProgress from "@/components/ui/GlobalRouteProgress";

export const metadata: Metadata = {
  title: "Learning Sphere",
  description: "Learning Sphere LMS",
};

// Server Component: static shell only. Interactive globals are client components below.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning style={{ zoom: "0.9" } as React.CSSProperties}>
      <body>
        <GlobalRouteProgress />
        {children}
        <ToastViewport />
        <ConfirmModalHost />
        <ThemeSync />
      </body>
    </html>
  );
}
