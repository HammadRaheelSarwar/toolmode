import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "../../../../lib/supabase/server";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { data, error } = await supabase.from("billing_history").select("id,provider_transaction_id,provider_subscription_id,amount_cents,currency,status,invoice_number,receipt_url,occurred_at").order("occurred_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: "Billing history is not available until the billing migration is applied." }, { status: 503 });
  return NextResponse.json({ payments: data || [] });
}
