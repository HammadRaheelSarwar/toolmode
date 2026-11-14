import Link from "next/link";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ChevronRight, Sparkles } from "lucide-react";
import { categories, getTool, tools } from "../../../lib/tools";
import { ToolCard } from "../../../components/tool-card";
import { FavoriteToggle } from "../../../components/favorite-toggle";
import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "../../../lib/supabase/env";
import { AdSlot } from "../../../components/ad-slot";
import { getToolGuide } from "../../../lib/tool-guides";

const ToolWorkspace = dynamic(
  () => import("../../../components/tool-workspace").then((m) => m.ToolWorkspace),
  {
    loading: () => (
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="h-[420px] animate-pulse rounded-3xl border border-line bg-white/60 p-6" />
        <div className="h-[260px] animate-pulse rounded-2xl border border-line bg-white/60 p-5" />
      </div>
    ),
  }
);

export function generateStaticParams() {
  return [...tools.map((tool) => ({ slug: tool.slug })), ...categories.map((category) => ({ slug: category.slug }))];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tool=getTool(slug); const category=categories.find((item)=>item.slug===slug);
  if(category)return {title:`${category.name} | ToolModeOn`,description:category.description,alternates:{canonical:`/tools/${category.slug}`}};
  if(!tool)return {title:"Tool not found | ToolModeOn"};
  return {title:`${tool.name} Online | ToolModeOn`,description:tool.description,alternates:{canonical:`/tools/${tool.slug}`},openGraph:{type:"website",title:`${tool.name} Online | ToolModeOn`,description:tool.description,url:`/tools/${tool.slug}`},twitter:{card:"summary",title:`${tool.name} Online | ToolModeOn`,description:tool.description}};
}

type ToolSetting = {
  enabled: boolean;
  name_override: string | null;
  description_override: string | null;
  category_override: any;
  required_plan: string;
};

let anonServerClient: ReturnType<typeof createClient> | null = null;
function getAnonServerClient() {
  if (anonServerClient) return anonServerClient;
  const config = getSupabasePublicConfig();
  if (!config) return null;
  anonServerClient = createClient(config.url, config.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return anonServerClient;
}

const settingsCache = new Map<string, { data: ToolSetting | null; expiresAt: number }>();
let batchFetchPromise: Promise<void> | null = null;
let lastBatchFetch = 0;

async function populateAllSettings(): Promise<void> {
  if (Date.now() - lastBatchFetch < 300000) return;
  if (batchFetchPromise) return batchFetchPromise;
  batchFetchPromise = (async () => {
    try {
      const client = getAnonServerClient();
      if (!client) return;
      const { data } = await client
        .from("tool_settings")
        .select("tool_slug,enabled,name_override,description_override,category_override,required_plan");
      const now = Date.now();
      const expiresAt = now + 300000;
      if (Array.isArray(data)) {
        for (const row of (data as Array<ToolSetting & { tool_slug: string }>)) {
          settingsCache.set(row.tool_slug, { data: row, expiresAt });
        }
      }
      lastBatchFetch = now;
    } catch {
      lastBatchFetch = Date.now() - 240000;
    } finally {
      batchFetchPromise = null;
    }
  })();
  return batchFetchPromise;
}

async function getCachedToolSetting(slug: string): Promise<ToolSetting | null> {
  const cached = settingsCache.get(slug);
  if (cached && Date.now() < cached.expiresAt) return cached.data;
  await populateAllSettings();
  const updated = settingsCache.get(slug);
  if (updated && Date.now() < updated.expiresAt) return updated.data;
  return null;
}

export default async function ToolOrCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);
  if (category) return <CategoryLanding category={category} />;

  const baseTool = getTool(slug);
  if (!baseTool) notFound();
  const settings = await getCachedToolSetting(baseTool.slug);
  if (settings && !settings.enabled) notFound();
  const tool = {
    ...baseTool,
    name: settings?.name_override || baseTool.name,
    description: settings?.description_override || baseTool.description,
    category: settings?.category_override || baseTool.category,
    pro: settings?.required_plan ? settings.required_plan !== "free" : baseTool.pro,
  };
  const Icon = tool.icon;
  const related = tools.filter((item) => item.category === tool.category && item.slug !== tool.slug).slice(0, 3);
  const guide = getToolGuide(tool.slug, tool.name, tool.category);
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://toolmodeon.com" },
      { "@type": "ListItem", position: 2, name: "Tools", item: "https://toolmodeon.com/tools" },
      { "@type": "ListItem", position: 3, name: tool.category, item: `https://toolmodeon.com/tools/${tool.category.toLowerCase()}` },
      { "@type": "ListItem", position: 4, name: tool.name, item: `https://toolmodeon.com/tools/${tool.slug}` },
    ],
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }}
      />
      <section className="border-b border-line bg-pale py-10 lg:py-14">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Link href="/" className="hover:text-ink">
              Home
            </Link>
            <ChevronRight size={12} />
            <Link href="/tools" className="hover:text-ink">
              Tools
            </Link>
            <ChevronRight size={12} />
            <span className="text-muted">{tool.category}</span>
            <ChevronRight size={12} />
            <span className="font-medium text-ink">{tool.name}</span>
          </div>
          <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-white text-ink">
                <Icon size={22} strokeWidth={2} />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-ink">{tool.name}</h1>
                  <span className="rounded-md border border-line bg-white px-2 py-0.5 text-[11px] font-medium text-muted">
                    100% Free · Client-Side
                  </span>
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{tool.description}</p>
              </div>
            </div>
            <FavoriteToggle toolSlug={tool.slug} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <ToolWorkspace
          tool={{
            slug: tool.slug,
            name: tool.name,
            description: tool.description,
            category: tool.category,
            pro: tool.pro,
          }}
        />
      </section>

      <AdSlot placement="tool-page-bottom" />

      {/* How to use instructions */}
      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8 border-t border-line">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Instructions</p>
          <h2 className="mt-1 text-2xl font-bold text-ink">How to use {tool.name}</h2>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {guide.steps.map((step, idx) => (
            <div key={idx} className="rounded-xl border border-line bg-white p-5">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-pale text-xs font-bold text-ink">
                0{idx + 1}
              </span>
              <p className="mt-3 text-xs leading-relaxed text-ink">{step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="bg-pale border-t border-line py-14">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">FAQ</p>
            <h2 className="mt-1 text-2xl font-bold text-ink">Frequently asked questions</h2>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {guide.faqs.map((faq, idx) => (
              <div key={idx} className="rounded-xl border border-line bg-white p-5">
                <h3 className="font-semibold text-sm text-ink">{faq.q}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related tools */}
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="border-t border-line pt-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Recommendations</p>
              <h2 className="mt-1 text-xl font-bold text-ink">Related tools</h2>
            </div>
            <Link href="/tools" className="flex items-center gap-1 text-sm font-bold text-brand">
              View all <ArrowLeft size={15} className="rotate-180" />
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {related.map((item) => (
              <ToolCard key={item.slug} tool={item} compact />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function CategoryLanding({ category }: { category: (typeof categories)[number] }) {
  const categoryName = category.name.replace(" Tools", "");
  const categoryTools = tools.filter(
    (tool) =>
      tool.category === categoryName ||
      (categoryName === "Developer" && tool.category === "Developer") ||
      (categoryName === "SEO" && tool.category === "SEO") ||
      (categoryName === "Utility" && tool.category === "Utilities") ||
      (categoryName === "Calculator" && tool.category === "Calculators")
  );
  const Icon = category.icon;
  return <main>
    <section className="bg-pale"><div className="mx-auto max-w-7xl px-5 py-16 lg:px-8"><div className="flex items-center gap-2 text-xs font-semibold text-muted"><Link href="/tools" className="hover:text-ink">All tools</Link><ChevronRight size={13}/><span className="text-ink">{category.name}</span></div><div className="mt-9 flex items-start gap-4"><span className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: `${category.color}15`, color: category.color }}><Icon size={27}/></span><div><h1 className="text-4xl font-black tracking-tight sm:text-5xl">{category.name}</h1><p className="mt-3 max-w-xl text-lg leading-7 text-muted">{category.description}</p></div></div></div></section>
    <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{categoryTools.map((tool) => <ToolCard key={tool.slug} tool={tool}/>)}</div></section>
  </main>;
}
