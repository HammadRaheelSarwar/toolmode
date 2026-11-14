import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin.server";

export async function GET(request: Request) {
  const access = await requireAdmin(["admin", "super_admin"]);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const url = new URL(request.url); const status = url.searchParams.get("status") || "all"; const query = (url.searchParams.get("q") || "").trim().slice(0,100);
  const page = Math.max(1,Math.min(100000,Number(url.searchParams.get("page"))||1)); const upcoming = Number(url.searchParams.get("upcoming"))||0;
  if (!(["all","active","expired","past_due","canceled","trialing","paused"].includes(status)) || !([0,7,30].includes(upcoming))) return NextResponse.json({error:"Invalid subscription filter."},{status:400});
  let userIds:string[]=[];
  if(query.includes("@")){const {data,error}=await access.admin.from("admin_user_directory").select("user_id").ilike("email",`%${query}%`).limit(100);if(error)return NextResponse.json({error:"Could not search account directory."},{status:503});userIds=(data||[]).map(row=>row.user_id);if(!userIds.length)return NextResponse.json({subscriptions:[],count:0,page,hasNext:false});}
  const now=new Date().toISOString();
  let db=access.admin.from("subscriptions").select("id,user_id,plan_key,status,billing_interval,current_period_starts_at,current_period_ends_at,grace_period_ends_at,next_billed_at,cancel_at_period_end,created_at,updated_at,provider_subscription_id",{count:"exact"}).order("current_period_ends_at",{ascending:true,nullsFirst:false});
  if(status==="expired")db=db.or(`status.eq.expired,current_period_ends_at.lte.${now}`);
  else if(status==="active")db=db.in("status",["active","trialing","past_due","canceled"]).or(`current_period_ends_at.is.null,current_period_ends_at.gt.${now}`);
  else if(status!=="all")db=db.eq("status",status);
  if(userIds.length)db=db.in("user_id",userIds);
  if(query&&!query.includes("@")){const clean=query.replace(/[^a-zA-Z0-9_-]/g,"");if(clean)db=db.ilike("provider_subscription_id",`%${clean}%`);else return NextResponse.json({subscriptions:[],count:0,page,hasNext:false});}
  if(upcoming>0){const end=new Date(Date.now()+upcoming*86400000).toISOString();db=db.gt("current_period_ends_at",now).lte("current_period_ends_at",end).in("status",["active","trialing","past_due","canceled"]);}
  const {data,error,count}=await db.range((page-1)*50,page*50-1);if(error)return NextResponse.json({error:"Could not load subscriptions."},{status:503});
  const rows=data||[];const userList=Array.from(new Set(rows.map(row=>row.user_id)));const ids=rows.map(row=>row.id);
  const [users,payments]=await Promise.all([userList.length?access.admin.from("admin_user_directory").select("user_id,email,full_name").in("user_id",userList):Promise.resolve({data:[],error:null}),ids.length?access.admin.from("payments").select("subscription_id,status,occurred_at").in("subscription_id",ids).order("occurred_at",{ascending:false}):Promise.resolve({data:[],error:null})]);
  if(users.error||payments.error)return NextResponse.json({error:"Could not load subscription account details."},{status:503});
  const subscriptions=rows.map(row=>({...row,account:users.data?.find(user=>user.user_id===row.user_id)||null,payment_status:payments.data?.find(payment=>payment.subscription_id===row.id)?.status||"no payment record",effective_status:row.current_period_ends_at&&new Date(row.current_period_ends_at).getTime()<=Date.now()?"expired":row.status,grace_active:Boolean(row.grace_period_ends_at&&new Date(row.grace_period_ends_at).getTime()>Date.now()&&row.current_period_ends_at&&new Date(row.current_period_ends_at).getTime()<=Date.now())}));
  return NextResponse.json({subscriptions,count:count||0,page,hasNext:page*50<(count||0),upcoming});
}
