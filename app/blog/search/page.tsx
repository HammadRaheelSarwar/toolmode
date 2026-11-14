import type { Metadata } from "next";
import Link from "next/link";
import { getBlogArticles } from "../../../lib/blog-content";
export const metadata: Metadata = { title:"Search blog | ToolModeOn", robots:{index:false,follow:true} };
export default async function BlogSearch({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query=(q||"").trim().toLowerCase(); const posts=await getBlogArticles();
  const matches=query?posts.filter((post)=>`${post.title} ${post.excerpt} ${post.category} ${post.tags.join(" ")} ${post.body.join(" ")}`.toLowerCase().includes(query)):[];
  return <main className="mx-auto min-h-[60vh] max-w-5xl px-5 py-14 lg:px-8"><Link href="/blog" className="text-sm font-bold text-brand">← Blog</Link><h1 className="mt-5 text-4xl font-black">Search guides</h1><form action="/blog/search" className="mt-6 flex gap-2"><input autoFocus name="q" defaultValue={q} placeholder="Search guides…" className="min-w-0 flex-1 rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-brand"/><button className="rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white">Search</button></form><p className="mt-5 text-sm text-muted">{query?`${matches.length} result${matches.length===1?"":"s"} for “${query}”`:"Enter a word or phrase to search articles."}</p><div className="mt-5 grid gap-3">{matches.map((post)=><Link key={post.slug} href={`/blog/${post.slug}`} className="rounded-2xl border border-line p-5 hover:border-brand/40"><span className="text-xs font-extrabold uppercase text-brand">{post.category}</span><h2 className="mt-2 text-xl font-black">{post.title}</h2><p className="mt-2 text-sm leading-6 text-muted">{post.excerpt}</p></Link>)}</div>{query&&matches.length===0&&<p className="mt-7 rounded-2xl bg-pale p-6 text-sm text-muted">No articles matched. Try a shorter or more general search.</p>}</main>;
}
