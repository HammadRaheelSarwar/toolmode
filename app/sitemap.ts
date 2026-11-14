import type { MetadataRoute } from "next";
import { tools, categories } from "../lib/tools";
import { getBlogArticles } from "../lib/blog-content";

export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://toolmodeon.com").replace(/\/$/, "");
  const now = new Date();
  const fixed = ["", "/tools", "/about", "/blog", "/contact", "/privacy", "/terms", "/cookies", "/disclaimer", "/affiliate-disclosure"];
  const publicPaths = [...fixed, ...categories.map((category) => `/tools/${category.slug}`), ...tools.map((tool) => `/tools/${tool.slug}`)];
  const entries: MetadataRoute.Sitemap = publicPaths.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/tools" || path === "/blog" ? 0.8 : 0.6,
  }));
  const posts = await getBlogArticles();
  for (const post of posts) {
    entries.push({
      url: `${base}/blog/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: "yearly",
      priority: 0.5,
    });
  }
  return entries;
}
