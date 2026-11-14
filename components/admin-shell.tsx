import Link from "next/link";
import { Activity, BookOpen, Bot, CreditCard, Database, LayoutDashboard, MessageSquare, Settings, ShieldCheck, SlidersHorizontal, Users, UserCog, ReceiptText, type LucideIcon } from "lucide-react";
import type { AdminRole } from "../lib/admin.server";
import { AdminSignOut } from "./admin-sign-out";

const links: Array<{ href: string; label: string; Icon: LucideIcon; roles: AdminRole[] }> = [
  { href: "/admin", label: "Overview", Icon: LayoutDashboard, roles: ["admin", "super_admin"] },
  { href: "/admin/users", label: "Users", Icon: Users, roles: ["admin", "super_admin"] },
  { href: "/admin/subscriptions", label: "Subscriptions", Icon: ReceiptText, roles: ["admin", "super_admin"] },
  { href: "/admin/payments", label: "Payments", Icon: CreditCard, roles: ["admin", "super_admin"] },
  { href: "/admin/plans", label: "Plans", Icon: CreditCard, roles: ["admin", "super_admin"] },
  { href: "/admin/tools", label: "Tools", Icon: SlidersHorizontal, roles: ["admin", "super_admin"] },
  { href: "/admin/ai", label: "AI operations", Icon: Bot, roles: ["admin", "super_admin"] },
  { href: "/admin/storage", label: "Storage", Icon: Database, roles: ["admin", "super_admin"] },
  { href: "/admin/blog", label: "Blog CMS", Icon: BookOpen, roles: ["admin", "super_admin", "content_manager"] },
  { href: "/admin/support", label: "Support", Icon: MessageSquare, roles: ["admin", "super_admin", "support_manager"] },
  { href: "/admin/settings", label: "Settings", Icon: Settings, roles: ["admin", "super_admin"] },
  { href: "/admin/staff", label: "Staff access", Icon: UserCog, roles: ["super_admin"] },
  { href: "/admin/audit", label: "Audit log", Icon: Activity, roles: ["admin", "super_admin"] }
];

export function AdminShell({ children, role }: { children: React.ReactNode; role: AdminRole }) {
  return <div className="min-h-[80vh] bg-pale/60"><div className="mx-auto grid max-w-7xl gap-6 px-4 py-7 lg:grid-cols-[230px_1fr] lg:px-8"><aside className="h-fit rounded-2xl border border-line bg-white p-4"><div className="mb-4 flex items-center gap-2 px-2"><ShieldCheck className="text-brand" size={19}/><div><div className="font-black">Admin console</div><div className="text-[10px] font-bold uppercase tracking-wide text-muted">{role.replaceAll("_", " ")}</div></div></div><nav className="mobile-scroll flex gap-2 overflow-x-auto lg:grid">{links.filter(link=>link.roles.includes(role)).map(({href,label,Icon}) => <Link key={href} href={href} className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted hover:bg-brand/5 hover:text-brand"><Icon size={16}/>{label}</Link>)}</nav><Link href="/dashboard" className="mt-4 block border-t border-line px-3 pt-4 text-xs font-bold text-muted hover:text-brand">Return to dashboard</Link><AdminSignOut/></aside><main className="min-w-0 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-7">{children}</main></div></div>;
}
