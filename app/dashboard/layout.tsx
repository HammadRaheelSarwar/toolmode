import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardShell } from "../../components/dashboard-shell";
import { isSupabaseConfigured } from "../../lib/supabase/env";
import { getSupabaseServerClient } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";

const profileNameCache = new Map<string, { name: string; expiresAt: number }>();

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) return <main className="mx-auto flex min-h-[65vh] max-w-3xl items-center px-5 py-16"><section className="w-full rounded-3xl border border-line bg-white p-8 shadow-soft"><p className="text-xs font-extrabold uppercase tracking-[.18em] text-brand">Account setup</p><h1 className="mt-3 text-3xl font-black">Connect Supabase to enable your dashboard</h1><p className="mt-4 text-sm leading-7 text-muted">The dashboard is protected by Supabase Auth. Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, apply the Phase 3 migration, and restart the app.</p><Link href="/login" className="gradient-bg mt-6 inline-flex rounded-xl px-5 py-3 text-sm font-bold text-white">Go to login</Link></section></main>;
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase!.auth.getUser();
  if (!user) redirect("/login?next=%2Fdashboard");
  if (!user.email_confirmed_at) redirect(`/verify-email?email=${encodeURIComponent(user.email || "")}`);

  let name = "";
  const cachedProfile = profileNameCache.get(user.id);
  if (cachedProfile && Date.now() < cachedProfile.expiresAt) {
    name = cachedProfile.name;
  } else {
    const { data: profile } = await supabase!.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    name = profile?.full_name || user.user_metadata?.full_name || "";
    profileNameCache.set(user.id, { name, expiresAt: Date.now() + 60000 });
  }

  return <DashboardShell name={name} email={user.email || ""}>{children}</DashboardShell>;
}
