"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Activity, BriefcaseBusiness, CreditCard, Heart, LayoutDashboard, LogOut, Menu, MessageCircle, Settings2, Users, Wrench, X } from "lucide-react";
import { getSupabaseBrowserClient } from "../lib/supabase/client";
import { NotificationCenter } from "./notification-center";

const nav = [
  ["Overview", "/dashboard", LayoutDashboard], ["My Tools", "/dashboard/tools", Wrench], ["Processing History", "/dashboard/history", Activity],
  ["Favorites", "/dashboard/favorites", Heart], ["My Projects", "/dashboard/projects", BriefcaseBusiness], ["Team workspace", "/dashboard/team", Users], ["Subscription", "/dashboard/subscription", CreditCard], ["Support", "/dashboard/support", MessageCircle], ["Profile Settings", "/dashboard/profile", Settings2]
] as const;

export function DashboardShell({ children, name, email }: { children: React.ReactNode; name: string; email: string }) {
  const pathname = usePathname(); const [open, setOpen] = useState(false); const [signingOut, setSigningOut] = useState(false);
  async function signOut() {
    setSigningOut(true);
    const supabase = getSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    document.cookie = "toolmodeon_remember=; Path=/; Max-Age=0; SameSite=Lax";
    window.location.assign("/");
  }
  const sidebar = <><div className="border-b border-line px-5 py-5"><p className="text-xs font-extrabold uppercase tracking-[.16em] text-brand">Account</p><p className="mt-2 truncate font-extrabold">{name || "ToolModeOn member"}</p><p className="mt-1 truncate text-xs text-muted">{email}</p></div><nav className="grid gap-1 p-3">{nav.map(([label, href, Icon]) => { const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href); return <Link key={href} href={href} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-brand/10 text-brand" : "text-muted hover:bg-pale hover:text-ink"}`}><Icon size={17}/>{label}</Link>; })}</nav><div className="mt-auto border-t border-line p-3"><button onClick={signOut} disabled={signingOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted hover:bg-pale hover:text-ink"><LogOut size={17}/>{signingOut ? "Signing out…" : "Sign out"}</button></div></>;
  return <div className="min-h-[calc(100vh-72px)] bg-pale"><div className="mx-auto max-w-[1440px] px-3 py-4 sm:px-5 lg:px-8 lg:py-8"><div className="mb-4 flex items-center justify-between lg:hidden"><div><p className="text-sm font-extrabold">Your dashboard</p><p className="text-xs text-muted">Manage your ToolModeOn account</p></div><button onClick={() => setOpen(!open)} aria-label="Toggle dashboard menu" className="rounded-xl border border-line bg-white p-2.5 text-ink">{open ? <X size={19}/> : <Menu size={19}/>}</button></div><div className="grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]"><aside className="hidden min-h-[calc(100vh-130px)] flex-col rounded-2xl border border-line bg-white shadow-soft lg:flex">{sidebar}</aside>{open && <div className="fixed inset-0 z-[60] bg-ink/30 lg:hidden" onClick={() => setOpen(false)}><aside onClick={(event) => event.stopPropagation()} className="flex h-full w-[min(86vw,320px)] flex-col bg-white shadow-2xl">{sidebar}</aside></div>}<main className="min-w-0 rounded-2xl border border-line bg-white p-5 shadow-soft sm:p-7 lg:p-8"><NotificationCenter/>{children}</main></div></div></div>;
}
