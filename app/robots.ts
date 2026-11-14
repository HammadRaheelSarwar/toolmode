import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/seo-constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/tools",
          "/tools/*",
          "/blog",
          "/blog/*",
          "/about",
          "/contact",
          "/privacy-policy",
          "/terms",
        ],
        disallow: ["/admin", "/admin/*", "/api/", "/dashboard", "/account-suspended"],
      },
      {
        userAgent: "Googlebot",
        allow: [
          "/",
          "/tools",
          "/tools/*",
          "/about",
          "/contact",
          "/privacy-policy",
          "/terms",
        ],
        disallow: ["/admin/", "/api/"],
      },
      {
        userAgent: "Bingbot",
        allow: [
          "/",
          "/tools",
          "/tools/*",
          "/about",
          "/contact",
          "/privacy-policy",
          "/terms",
        ],
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
