import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://learnsphere-lms.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login"],
        disallow: [
          "/admin",
          "/admin/*",
          "/teacher",
          "/teacher/*",
          "/student",
          "/student/*",
          "/meeting",
          "/meeting/*",
          "/api/*",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/login"],
        disallow: [
          "/admin",
          "/admin/*",
          "/teacher",
          "/teacher/*",
          "/student",
          "/student/*",
          "/meeting",
          "/meeting/*",
          "/api/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
