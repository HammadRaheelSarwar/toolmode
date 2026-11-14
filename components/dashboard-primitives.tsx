import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function DashboardHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: { label: string; href: string } }) {
  return <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-brand">{eyebrow}</p><h1 className="mt-2 text-3xl font-black tracking-tight">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>}</div>{action && <Link href={action.href} className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white hover:bg-brand">{action.label}<ArrowRight size={15}/></Link>}</div>;
}

export function EmptyState({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-line bg-pale/60 p-6 text-center"><p className="font-extrabold">{title}</p><div className="mt-2 text-sm leading-6 text-muted">{children}</div></div>;
}

export function StatusNotice({ error, success }: { error?: string; success?: string }) {
  if (!error && !success) return null;
  return <p role={error ? "alert" : "status"} className={`mb-4 rounded-xl p-3 text-sm font-semibold ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>{error || success}</p>;
}
