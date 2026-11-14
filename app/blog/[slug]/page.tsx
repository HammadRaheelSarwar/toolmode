import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { articleUrl, getBlogArticles, starterArticles } from "../../../lib/blog-content";

export function generateStaticParams() { return starterArticles.map((post) => ({ slug: post.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = (await getBlogArticles()).find((post) => post.slug === slug);
  if (!article) return { title: "Article not found | ToolModeOn" };
  const canonical = article.canonicalUrl || articleUrl(article.slug);
  return { title: article.metaTitle, description: article.metaDescription, alternates: { canonical }, openGraph: { type: "article", url: canonical, title: article.metaTitle, description: article.metaDescription, publishedTime: article.publishedAt, authors: [article.author], ...(article.featuredImageUrl ? { images: [{ url: article.featuredImageUrl, alt: article.featuredImageAlt || article.title }] } : {}) }, twitter: { card: article.featuredImageUrl ? "summary_large_image" : "summary", title: article.metaTitle, description: article.metaDescription, ...(article.featuredImageUrl ? { images: [article.featuredImageUrl] } : {}) } };
}

import { SITE_URL } from "../../../lib/seo-constants";

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = (await getBlogArticles()).find((article) => article.slug === slug);
  if (!post) notFound();
  const canonical = post.canonicalUrl || articleUrl(post.slug);
  const related = (await getBlogArticles()).filter((article) => article.category === post.category && article.slug !== post.slug).slice(0, 3);
  const articleJson = { "@context":"https://schema.org", "@type":"Article", headline:post.title, description:post.metaDescription, datePublished:post.publishedAt, dateModified:post.publishedAt, author:{"@type":"Organization",name:post.author}, publisher:{"@type":"Organization",name:"ToolModeOn",url:SITE_URL}, mainEntityOfPage:canonical, ...(post.featuredImageUrl?{image:post.featuredImageUrl}:{}) };
  const breadcrumbJson = { "@context":"https://schema.org", "@type":"BreadcrumbList", itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:SITE_URL},{"@type":"ListItem",position:2,name:"Blog",item:`${SITE_URL}/blog`},{"@type":"ListItem",position:3,name:post.title,item:canonical}] };
  return <main><script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJson(articleJson)}}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJson(breadcrumbJson)}}/><section className="bg-pale"><div className="mx-auto max-w-3xl px-5 py-16 lg:px-8"><nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-muted"><Link href="/" className="hover:text-brand">Home</Link><ChevronRight size={13}/><Link href="/blog" className="hover:text-brand">Blog</Link><ChevronRight size={13}/><span aria-current="page" className="truncate text-ink">{post.title}</span></nav><p className="mt-10 text-xs font-extrabold uppercase tracking-[.2em] text-brand">{post.category}</p><h1 className="mt-4 text-4xl font-black leading-tight tracking-[-.04em] sm:text-5xl">{post.title}</h1><p className="mt-6 text-lg leading-8 text-muted">{post.excerpt}</p><p className="mt-5 text-xs font-semibold text-muted">{new Intl.DateTimeFormat("en",{dateStyle:"long"}).format(new Date(post.publishedAt))} · By {post.author}</p>{post.featuredImageUrl&&<img src={post.featuredImageUrl} alt={post.featuredImageAlt||post.title} className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover"/>}</div></section><article className="mx-auto max-w-3xl px-5 py-14 lg:px-8">{post.body.map((paragraph,index)=><p key={index} className="mb-6 text-lg leading-8 text-muted">{paragraph}</p>)}<div className="mt-10 rounded-2xl bg-pale p-6"><p className="font-extrabold">Try a related free tool</p><p className="mt-2 text-sm leading-6 text-muted">Use a focused tool to apply these steps to your own file or text.</p><Link href="/tools" className="mt-4 inline-flex rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white">Explore tools</Link></div></article>{related.length>0&&<section className="mx-auto max-w-7xl px-5 pb-16 lg:px-8"><h2 className="text-2xl font-black">More in {post.category}</h2><div className="mt-5 grid gap-4 sm:grid-cols-3">{related.map((item)=><Link key={item.slug} href={`/blog/${item.slug}`} className="rounded-2xl border border-line p-5 hover:border-brand/40"><h3 className="font-extrabold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted">{item.excerpt}</p></Link>)}</div></section>}</main>;
}

function safeJson(value: unknown) { return JSON.stringify(value).replace(/</g,"\\u003c"); }
