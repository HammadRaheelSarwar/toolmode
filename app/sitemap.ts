import type { MetadataRoute } from "next";
import { tools, categories } from "../lib/tools";
import { getBlogArticles } from "../lib/blog-content";
import { SITE_URL } from "../lib/seo-constants";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // 1. Core High-Priority Pages
  const coreEntries: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/tools`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
  ];

  // 2. Category Hub Pages (High Intent)
  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE_URL}/tools/${category.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.88,
  }));

  // 3. Individual Tool Pages (All 81+ Tools)
  const toolEntries: MetadataRoute.Sitemap = tools.map((tool) => ({
    url: `${SITE_URL}/tools/${tool.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  // 4. Content & Institutional Pages
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/cookies`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/disclaimer`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/affiliate-disclosure`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // 5. Blog Posts
  const postEntries: MetadataRoute.Sitemap = [];
  try {
    const posts = await getBlogArticles();
    for (const post of posts) {
      postEntries.push({
        url: `${SITE_URL}/blog/${post.slug}`,
        lastModified: new Date(post.publishedAt),
        changeFrequency: "monthly",
        priority: 0.65,
      });
    }
  } catch {
    // Graceful fallback
  }

  return [...coreEntries, ...categoryEntries, ...toolEntries, ...postEntries, ...staticEntries];
}
