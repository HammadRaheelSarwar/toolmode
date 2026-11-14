import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "../../../../lib/supabase/server";
import { checkRateLimit } from "../../../../lib/rate-limit.server";

export async function GET() {
  const supabase=await getSupabaseServerClient();if(!supabase)return NextResponse.json({error:"Supabase is not configured."},{status:503});
  const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Sign in required."},{status:401});
  const {data,error}=await supabase.from("account_deletion_requests").select("id,reason,status,requested_at,decided_at").eq("user_id",user.id).order("requested_at",{ascending:false}).limit(10);
  if(error)return NextResponse.json({error:"Could not load deletion request status."},{status:503});return NextResponse.json({requests:data||[]});
}

export async function POST(request:Request) {
  const supabase=await getSupabaseServerClient();if(!supabase)return NextResponse.json({error:"Supabase is not configured."},{status:503});
  const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Sign in required."},{status:401});
  if(!user.email_confirmed_at)return NextResponse.json({error:"Verify your email before requesting account deletion."},{status:403});
  const rate=await checkRateLimit(request,"account-deletion-request",3,86400,`user:${user.id}`);if(!rate.allowed)return NextResponse.json({error:"You have submitted the maximum deletion requests for today."},{status:429});
  const parsed=z.object({reason:z.string().trim().max(1000).default("")}).safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Invalid deletion request."},{status:400});
  const {data,error}=await supabase.from("account_deletion_requests").insert({user_id:user.id,email_snapshot:user.email||"",reason:parsed.data.reason,status:"pending"}).select("id,status,requested_at").single();
  if(error)return NextResponse.json({error:error.code==="23505"?"You already have an open deletion request.":"Could not submit deletion request."},{status:error.code==="23505"?409:503});
  return NextResponse.json({request:data}, {status:201});
}
