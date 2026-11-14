import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../../../lib/supabase/admin";

export async function GET() {
  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ platform_name: "ToolModeOn", logo_url: "", support_email: "" }, { headers: { "Cache-Control": "public, max-age=60" } });
  const { data, error } = await admin.from("system_settings").select("setting_key,value").in("setting_key", ["brand.platform_name", "brand.logo_url", "brand.support_email"]);
  if (error) return NextResponse.json({ platform_name: "ToolModeOn", logo_url: "", support_email: "" }, { headers: { "Cache-Control": "public, max-age=60" } });
  const values = Object.fromEntries((data || []).map(row => [row.setting_key, row.value]));
  return NextResponse.json({ platform_name: typeof values["brand.platform_name"] === "string" ? values["brand.platform_name"] : "ToolModeOn", logo_url: typeof values["brand.logo_url"] === "string" ? values["brand.logo_url"] : "", support_email: typeof values["brand.support_email"] === "string" ? values["brand.support_email"] : "" }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=120" } });
}
