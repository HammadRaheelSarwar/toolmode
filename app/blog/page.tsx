import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { getBlogArticles } from "../../lib/blog-content";

export const metadata: Metadata = { title: "Guides and Articles | ToolModeOn Blog", description: "Practical guides for PDFs, images, calculators, text, AI and everyday digital work.", alternates: { canonical: "/blog" } };

export default async function Blog() {
  const posts = await getBlogArticles();
  const categories = Array.from(new Set(posts.map((post) => post.category))).sort();
  return <main><section className="bg-pale"><div className="mx-auto max-w-7xl px-5 py-16 lg:px-8"><p className="text-xs font-extrabold uppercase tracking-[.2em] text-brand">The ToolModeOn journal</p><h1 className="mt-3 text-5xl font-black tracking-[-.04em]">Useful things, clearly explained.</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-muted">Practical guides for PDFs, images, calculations, writing and everyday workflows.</p><form action="/blog/search" className="mt-7 flex max-w-xl items-center gap-3 rounded-2xl border border-line bg-white p-2 shadow-card"><Search className="ml-3 text-muted" size={18}/><input name="q" placeholder="Search guides…" className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none"/><button className="rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white">Search</button></form><div className="mt-6 flex flex-wrap gap-2">{categories.map((category) => <Link key={category} href={`/blog/category/${categorySlug(category)}`} className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-bold text-muted hover:text-brand">{category}</Link>)}</div></div></section><section className="mx-auto max-w-7xl px-5 py-14 lg:px-8"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{posts.map((post) => <Link href={`/blog/${post.slug}`} key={post.slug} className="group flex flex-col rounded-3xl border border-line bg-white p-6 shadow-card transition hover:-translate-y-1 hover:shadow-soft"><div className="flex items-center justify-between"><span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-extrabold text-brand">{post.category}</span><ArrowUpRight size={18} className="text-muted transition group-hover:text-brand"/></div><h2 className="mt-8 text-2xl font-black tracking-tight">{post.title}</h2><p className="mt-3 flex-1 text-sm leading-6 text-muted">{post.excerpt}</p><p className="mt-5 text-xs font-semibold text-muted">{formatDate(post.publishedAt)} · {readTime(post.body.join(" "))} min read · {post.author}</p></Link>)}</div></section></main>;
}

function categorySlug(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""); }
function formatDate(value: string) { return new Intl.DateTimeFormat("en", { dateStyle:"medium" }).format(new Date(value)); }
function readTime(value: string) { return Math.max(2, Math.ceil(value.trim().split(/\s+/).length / 200)); }
