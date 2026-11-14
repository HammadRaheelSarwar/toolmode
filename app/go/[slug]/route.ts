import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "../../../lib/supabase/server";
import { getSupabaseAdminClient } from "../../../lib/supabase/admin";
import { checkRateLimit } from "../../../lib/rate-limit.server";
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return NextResponse.json({ error: "Affiliate link not found." }, { status: 404 });
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Affiliate links are not configured." }, { status: 503 });
  const { data: link } = await supabase.from("affiliate_links").select("id,destination_url,campaign,enabled").eq("slug", slug).eq("enabled", true).maybeSingle();
  if (!link) return NextResponse.json({ error: "Affiliate link not found." }, { status: 404 });
  let destination: URL;
  try { destination = new URL(link.destination_url); }
  catch { return NextResponse.json({ error: "Affiliate link destination is invalid." }, { status: 500 }); }
  if (destination.protocol !== "https:") return NextResponse.json({ error: "Affiliate link destination is invalid." }, { status: 500 });
  const rate = await checkRateLimit(request, "affiliate-click", 30, 60);
  if (rate.allowed) {
    const admin = getSupabaseAdminClient();
    if (admin) {
      const referer = request.headers.get("referer");
      let referrerHost: string | null = null;
      try { referrerHost = referer ? new URL(referer).hostname : null; } catch { }
      await admin.from("affiliate_clicks").insert({ affiliate_link_id: link.id, campaign: link.campaign, referrer_host: referrerHost });
    }
  }
  const response = NextResponse.redirect(destination, 302);
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
