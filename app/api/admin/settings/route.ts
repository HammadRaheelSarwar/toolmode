import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, writeAdminAudit } from "../../../../lib/admin.server";

const adSchema = z.object({ kind: z.literal("ad_slot"), placement_key: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80), enabled: z.boolean(), publisher_id: z.string().regex(/^ca-pub-\d{6,30}$/).or(z.literal("")).nullable(), ad_slot_id: z.string().regex(/^\d{1,30}$/).or(z.literal("")).nullable(), allowed_plans: z.array(z.literal("free")).max(1) });
const affiliateSchema = z.object({ kind: z.literal("affiliate"), id: z.string().uuid().optional(), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80), label: z.string().trim().min(1).max(120), destination_url: z.string().url().refine(value => { try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; } }), disclosure: z.string().trim().min(10).max(500), campaign: z.string().max(120).nullable(), enabled: z.boolean() });
const systemSchema = z.discriminatedUnion("setting_key", [
  z.object({ kind: z.literal("system"), setting_key: z.literal("brand.platform_name"), value: z.string().trim().min(1).max(80) }),
  z.object({ kind: z.literal("system"), setting_key: z.literal("brand.logo_url"), value: z.string().url().refine(value => { try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; } }).or(z.literal("")) }),
  z.object({ kind: z.literal("system"), setting_key: z.literal("brand.support_email"), value: z.string().email().max(254).or(z.literal("")) }),
  z.object({ kind: z.literal("system"), setting_key: z.literal("platform.maintenance_mode"), value: z.boolean() }),
  z.object({ kind: z.literal("system"), setting_key: z.literal("platform.maintenance_message"), value: z.string().trim().min(1).max(500) })
]);
const schema = z.union([adSchema, affiliateSchema, systemSchema]);

export async function GET() {
  const access = await requireAdmin(["admin", "super_admin"]);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const [ads, affiliates, settings, clickStats] = await Promise.all([
    access.admin.from("ad_slots").select("*").order("placement_key"),
    access.admin.from("affiliate_links").select("*").order("created_at", { ascending: false }),
    access.admin.from("system_settings").select("setting_key,value,updated_at").in("setting_key", ["brand.platform_name", "brand.logo_url", "brand.support_email", "platform.maintenance_mode", "platform.maintenance_message"]).order("setting_key"),
    access.admin.rpc("admin_affiliate_click_metrics")
  ]);
  if (ads.error || affiliates.error || settings.error || clickStats.error) return NextResponse.json({ error: "Could not load site settings. Apply the latest migration." }, { status: 503 });
  const publisher = process.env.ADSENSE_PUBLISHER_ID || "";
  return NextResponse.json({ ads: ads.data || [], affiliates: affiliates.data || [], settings: settings.data || [], affiliateStats: clickStats.data || [], adsApproved: process.env.ADSENSE_APPROVED === "true" && /^ca-pub-\d+$/.test(publisher) });
}

export async function PATCH(request: Request) {
  const access = await requireAdmin(["admin", "super_admin"]);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid site setting." }, { status: 400 });
  const value = parsed.data; let error: string | null = null; let targetId = ""; let detail: Record<string, unknown> = {};
  if (value.kind === "ad_slot") {
    const { error: saveError } = await access.admin.from("ad_slots").upsert({ ...value, publisher_id: value.publisher_id || null, ad_slot_id: value.ad_slot_id || null, updated_by: access.user.id }, { onConflict: "placement_key" });
    error = saveError?.message || null; targetId = value.placement_key; detail = { enabled: value.enabled, allowed_plans: value.allowed_plans };
  } else if (value.kind === "affiliate") {
    const payload = { slug: value.slug, label: value.label, destination_url: value.destination_url, disclosure: value.disclosure, campaign: value.campaign, enabled: value.enabled, updated_by: access.user.id };
    if (value.id) { const result = await access.admin.from("affiliate_links").update(payload).eq("id", value.id).select("id").maybeSingle(); error = result.error?.message || null; targetId = result.data?.id || value.id; }
    else { const result = await access.admin.from("affiliate_links").insert({ ...payload, created_by: access.user.id }).select("id").single(); error = result.error?.message || null; targetId = result.data?.id || value.slug; }
    detail = { slug: value.slug, destination_url: value.destination_url, enabled: value.enabled };
  } else {
    const { error: saveError } = await access.admin.from("system_settings").upsert({ setting_key: value.setting_key, value: value.value, updated_by: access.user.id }, { onConflict: "setting_key" });
    error = saveError?.message || null; targetId = value.setting_key; detail = { key: value.setting_key, value: value.value };
  }
  if (error) return NextResponse.json({ error: "Could not save setting." }, { status: 500 });
  const audit = await writeAdminAudit(access.admin, access.user.id, `${value.kind}.updated`, value.kind, targetId, detail);
  if (audit.error) return NextResponse.json({ error: "Setting saved, but the audit entry failed." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
