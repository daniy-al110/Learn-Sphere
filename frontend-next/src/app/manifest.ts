import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LearnSphere LMS | Intelligent Cloud Education Platform",
    short_name: "LearnSphere",
    description: "Next-generation cloud Learning Management System with automated grading, real-time virtual classrooms, and curriculum tracking.",
    start_url: "/",
    display: "standalone",
    background_color: "#030712",
    theme_color: "#ec4899",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
