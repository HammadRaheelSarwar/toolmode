-- Final 30-day plan policy, R2 document lifecycle, independent history retention,
-- notifications, and automatic maintenance. This is additive to phases 3-8.

alter table public.plan_entitlements
  add column if not exists access_period_days integer not null default 30 check (access_period_days between 1 and 366),
  add column if not exists document_grace_days integer not null default 7 check (document_grace_days between 0 and 90),
  add column if not exists storage_limit_bytes bigint check (storage_limit_bytes is null or storage_limit_bytes >= 0),
  add column if not exists ai_requests_per_minute integer not null default 10 check (ai_requests_per_minute between 1 and 600);

update public.plan_entitlements set
  monthly_price_cents=case plan_key when 'pro' then 230 when 'business' then 700 else 0 end,
  yearly_price_cents=0,
  yearly_paddle_price_id=null,
  ai_credits=case plan_key when 'free' then 1 else 0 end,
  history_days=case plan_key when 'pro' then 7 when 'business' then 14 else 0 end,
  access_period_days=30,
  document_grace_days=7,
  team_members=case plan_key when 'business' then 5 else 0 end,
  ads_enabled=(plan_key='free'),
  ai_requests_per_minute=10,
  updated_at=now();

alter table public.subscriptions add column if not exists grace_period_ends_at timestamptz;

alter table public.processing_history
  add column if not exists retention_expires_at timestamptz,
  add column if not exists output_storage_provider text not null default 'supabase' check (output_storage_provider in ('supabase','r2')),
  add column if not exists cleanup_locked_at timestamptz,
  add column if not exists cleanup_attempts integer not null default 0 check (cleanup_attempts >= 0),
  add column if not exists cleanup_error text;

update public.processing_history h set retention_expires_at=h.processed_at + make_interval(days=>case when s.plan_key='business' then 14 else 7 end)
from lateral (select s.plan_key from public.subscriptions s where s.user_id=h.user_id
  and h.processed_at>=coalesce(s.current_period_starts_at,s.created_at)
  and h.processed_at<coalesce(s.current_period_ends_at,s.created_at+interval '30 days')
  order by s.created_at desc limit 1) s
where h.retention_expires_at is null;
delete from public.processing_history where retention_expires_at is null;

alter table public.project_files
  add column if not exists storage_provider text not null default 'supabase' check (storage_provider in ('supabase','r2')),
  add column if not exists billing_owner_user_id uuid references auth.users(id) on delete set null,
  add column if not exists grace_period_ends_at timestamptz,
  add column if not exists cleanup_locked_at timestamptz,
  add column if not exists cleanup_attempts integer not null default 0 check (cleanup_attempts >= 0),
  add column if not exists cleanup_error text;

update public.project_files f set
  billing_owner_user_id=coalesce(w.owner_user_id,f.user_id),
  grace_period_ends_at=coalesce(
    (select s.current_period_ends_at + make_interval(days=>coalesce(p.document_grace_days,7))
      from public.subscriptions s join public.plan_entitlements p on p.plan_key=s.plan_key
      where s.user_id=coalesce(w.owner_user_id,f.user_id) and s.status in ('active','trialing','past_due','canceled')
        and (s.current_period_ends_at is null or s.current_period_ends_at>now())
      order by s.updated_at desc limit 1),
    now()+interval '7 days')
from public.projects pr left join public.team_workspaces w on w.id=pr.workspace_id
where pr.id=f.project_id and f.billing_owner_user_id is null;

update public.subscriptions s set
  billing_interval='month',
  current_period_starts_at=coalesce(s.current_period_starts_at,s.created_at),
  current_period_ends_at=coalesce(s.current_period_starts_at,s.created_at)+make_interval(days=>coalesce(p.access_period_days,30)),
  grace_period_ends_at=coalesce(s.current_period_starts_at,s.created_at)+make_interval(days=>coalesce(p.access_period_days,30)+coalesce(p.document_grace_days,7))
from public.plan_entitlements p where p.plan_key=s.plan_key and s.status in ('active','trialing','past_due','canceled');
update public.project_files f set grace_period_ends_at=s.grace_period_ends_at
from public.subscriptions s where s.user_id=f.billing_owner_user_id and s.status in ('active','trialing','past_due','canceled');

create index if not exists project_files_billing_owner_idx on public.project_files(billing_owner_user_id,created_at desc);
create index if not exists project_files_grace_cleanup_idx on public.project_files(grace_period_ends_at) where grace_period_ends_at is not null;
create index if not exists processing_history_expiry_idx on public.processing_history(retention_expires_at) where retention_expires_at is not null;

create table if not exists public.ai_generation_reservations (
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  tool_slug text not null,
  status text not null default 'pending' check (status in ('pending','completed','released')),
  expires_at timestamptz not null default now()+interval '10 minutes',
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key(user_id,request_id)
);

create table if not exists public.account_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_key text not null,
  kind text not null,
  title text not null,
  body text not null,
  href text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  email_status text not null default 'pending' check (email_status in ('pending','sent','failed','skipped')),
  email_attempts integer not null default 0 check (email_attempts>=0),
  email_error text,
  unique(user_id,event_key)
);

create table if not exists public.system_logs (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  level text not null check (level in ('info','warning','error')),
  event_type text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists account_notifications_user_created_idx on public.account_notifications(user_id,created_at desc);
create index if not exists account_notifications_email_idx on public.account_notifications(email_status,created_at) where email_status in ('pending','failed');
create index if not exists system_logs_error_created_idx on public.system_logs(level,created_at desc);

alter table public.ai_generation_reservations enable row level security;
alter table public.account_notifications enable row level security;
alter table public.system_logs enable row level security;
drop policy if exists account_notifications_select_own on public.account_notifications;
create policy account_notifications_select_own on public.account_notifications for select to authenticated using (user_id=(select auth.uid()));
drop policy if exists account_notifications_update_own on public.account_notifications;
create policy account_notifications_update_own on public.account_notifications for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
grant select,update on public.account_notifications to authenticated;

-- All document and history writes go through server routes so clients cannot
-- spoof retention, storage ownership, or object paths in direct REST calls.
drop policy if exists processing_history_insert_own on public.processing_history;
drop policy if exists processing_history_update_own on public.processing_history;
drop policy if exists project_files_insert_own_or_team on public.project_files;
drop policy if exists project_files_delete_own_or_team_admin on public.project_files;
drop policy if exists projects_delete_owner on public.projects;
drop policy if exists project_outputs_select_own on storage.objects;
drop policy if exists project_outputs_insert_own on storage.objects;
drop policy if exists project_outputs_delete_own on storage.objects;

drop policy if exists projects_insert_own_or_team on public.projects;
create policy projects_insert_own_or_team on public.projects for insert to authenticated with check (
  user_id=(select auth.uid()) and (workspace_id is null or exists (
    select 1 from public.team_members m join public.team_workspaces w on w.id=m.workspace_id
    join public.subscriptions s on s.user_id=w.owner_user_id
    join public.plan_entitlements e on e.plan_key=s.plan_key and e.is_active
    where m.workspace_id=projects.workspace_id and m.user_id=(select auth.uid()) and e.plan_key='business'
      and s.status in ('active','trialing','past_due','canceled') and (s.current_period_ends_at is null or s.current_period_ends_at>now())
      and (s.status<>'trialing' or e.trials_enabled)
  ))
);

create or replace function public.process_paddle_webhook_final(p_notification_id text,p_event_type text,p_occurred_at timestamptz,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,auth as $$
declare
  v_event_id uuid;
  v_data jsonb:=p_payload->'data';
  v_custom jsonb:=p_payload->'data'->'custom_data';
  v_intent_id uuid;
  v_intent public.checkout_intents%rowtype;
  v_subscription public.subscriptions%rowtype;
  v_plan public.plan_entitlements%rowtype;
  v_user_id uuid;
  v_plan_key text;
  v_interval text;
  v_price_id text;
  v_mapped_plan text;
  v_mapped_interval text;
  v_subscription_id text;
  v_customer_id text;
  v_transaction_id text;
  v_amount bigint;
  v_refunded bigint;
  v_currency text;
  v_old_payment_status text;
  v_period_start timestamptz;
  v_period_end timestamptz;
  v_grace_end timestamptz;
  v_cancel boolean;
begin
  insert into public.payment_webhook_events(notification_id,event_type,occurred_at,payload)
    values(p_notification_id,p_event_type,p_occurred_at,p_payload)
    on conflict(notification_id) do nothing returning id into v_event_id;
  if v_event_id is null then return jsonb_build_object('ok',true,'duplicate',true); end if;

  if coalesce(v_custom->>'toolmodeon_intent_id','') ~* '^[0-9a-f-]{36}$' then v_intent_id:=(v_custom->>'toolmodeon_intent_id')::uuid; end if;
  v_subscription_id:=coalesce(v_data->>'subscription_id',case when p_event_type like 'subscription.%' then v_data->>'id' end);
  v_price_id:=coalesce(v_data #>> '{items,0,price,id}',v_data #>> '{items,0,price_id}');
  v_customer_id:=v_data->>'customer_id';
  if v_intent_id is not null then
    select * into v_intent from public.checkout_intents where id=v_intent_id for update;
  end if;
  if v_intent.id is not null then
    v_user_id:=v_intent.user_id; v_plan_key:=v_intent.plan_key; v_interval:=v_intent.billing_interval;
    if v_price_id is null or v_intent.provider_price_id<>v_price_id then raise exception 'Paddle price does not match checkout intent'; end if;
    if v_intent.status='pending' and v_intent.expires_at<p_occurred_at then raise exception 'Paddle checkout intent expired'; end if;
  elsif v_subscription_id is not null then
    select * into v_subscription from public.subscriptions where provider_subscription_id=v_subscription_id for update;
    if v_subscription.id is not null then v_user_id:=v_subscription.user_id; v_plan_key:=v_subscription.plan_key; v_interval:=v_subscription.billing_interval; end if;
  end if;
  if v_price_id is not null then
    select plan_key,case when monthly_paddle_price_id=v_price_id then 'month' else 'year' end
      into v_mapped_plan,v_mapped_interval from public.plan_entitlements
      where is_active and (monthly_paddle_price_id=v_price_id or yearly_paddle_price_id=v_price_id);
    if v_mapped_plan is not null then
      if v_intent.id is not null and v_mapped_plan<>v_intent.plan_key then raise exception 'Paddle plan does not match checkout intent'; end if;
      v_plan_key:=v_mapped_plan; v_interval:=v_mapped_interval;
    elsif v_intent.id is null and v_subscription.id is not null and v_subscription.provider_price_id is distinct from v_price_id then
      raise exception 'Paddle price does not match the stored subscription';
    end if;
  end if;

  if p_event_type='transaction.completed' then
    v_transaction_id:=v_data->>'id';
    if v_user_id is null or v_plan_key not in ('pro','business') or v_transaction_id is null or v_subscription_id is null then
      raise exception 'Completed subscription transaction has no valid intent or stored subscription';
    end if;
    if v_interval<>'month' then raise exception 'Only 30-day billing intervals are supported'; end if;
    select * into v_plan from public.plan_entitlements where plan_key=v_plan_key and is_active;
    if v_plan.plan_key is null then raise exception 'Paid plan is inactive'; end if;
    v_amount:=coalesce(nullif(v_data #>> '{details,totals,total}','')::bigint,0);
    v_currency:=coalesce(v_data->>'currency_code','USD');
    if v_currency<>'USD' or v_amount<v_plan.monthly_price_cents then raise exception 'Paddle transaction amount does not meet the configured USD plan price'; end if;
    select status into v_old_payment_status from public.payments where provider_transaction_id=v_transaction_id for update;
    if v_old_payment_status in ('completed','refunded','partially_refunded') then
      return jsonb_build_object('ok',true,'duplicate_transaction',true,'event_id',v_event_id);
    elsif v_old_payment_status is null then
      insert into public.payments(user_id,provider_transaction_id,provider_subscription_id,amount_cents,currency,status,invoice_number,occurred_at)
        values(v_user_id,v_transaction_id,v_subscription_id,v_amount,v_currency,'completed',v_data->>'invoice_number',p_occurred_at);
    else
      update public.payments set user_id=v_user_id,provider_subscription_id=v_subscription_id,amount_cents=v_amount,currency=v_currency,
        status='completed',invoice_number=coalesce(v_data->>'invoice_number',invoice_number),occurred_at=greatest(occurred_at,p_occurred_at)
        where provider_transaction_id=v_transaction_id;
    end if;

    select * into v_subscription from public.subscriptions where provider_subscription_id=v_subscription_id for update;
    v_period_start:=case when v_subscription.current_period_ends_at>p_occurred_at then v_subscription.current_period_ends_at else p_occurred_at end;
    v_period_end:=v_period_start+make_interval(days=>v_plan.access_period_days);
    v_grace_end:=v_period_end+make_interval(days=>v_plan.document_grace_days);
    insert into public.subscriptions(user_id,plan_key,provider_customer_id,provider_subscription_id,provider_price_id,billing_interval,status,
      current_period_starts_at,current_period_ends_at,next_billed_at,cancel_at_period_end,canceled_at,grace_period_ends_at,provider_updated_at)
      values(v_user_id,v_plan_key,v_customer_id,v_subscription_id,v_price_id,'month','active',v_period_start,v_period_end,v_period_end,false,null,v_grace_end,p_occurred_at)
      on conflict(provider_subscription_id) do update set user_id=excluded.user_id,plan_key=excluded.plan_key,
        provider_customer_id=coalesce(excluded.provider_customer_id,subscriptions.provider_customer_id),provider_price_id=excluded.provider_price_id,
        billing_interval='month',status='active',current_period_starts_at=excluded.current_period_starts_at,
        current_period_ends_at=excluded.current_period_ends_at,next_billed_at=excluded.next_billed_at,cancel_at_period_end=false,
        canceled_at=null,grace_period_ends_at=excluded.grace_period_ends_at,provider_updated_at=excluded.provider_updated_at,updated_at=now()
      where subscriptions.provider_updated_at<=excluded.provider_updated_at;
    update public.payments set subscription_id=(select id from public.subscriptions where provider_subscription_id=v_subscription_id)
      where provider_transaction_id=v_transaction_id;
    update public.project_files set grace_period_ends_at=v_grace_end where coalesce(billing_owner_user_id,user_id)=v_user_id;
    update public.checkout_intents set status='consumed',consumed_at=coalesce(consumed_at,now()) where id=v_intent_id;
    select coalesce(sum(nullif(latest.payload #>> '{data,totals,total}','')::bigint),0) into v_refunded
      from (select distinct on(payload #>> '{data,id}') payload from public.payment_webhook_events
        where event_type in ('adjustment.created','adjustment.updated') and payload #>> '{data,transaction_id}'=v_transaction_id
          and payload #>> '{data,action}'='refund' order by payload #>> '{data,id}',occurred_at desc) latest
      where latest.payload #>> '{data,status}'='approved';
    update public.payments set refunded_amount_cents=least(amount_cents,v_refunded),
      status=case when v_refunded=0 then 'completed' when v_refunded>=amount_cents then 'refunded' else 'partially_refunded' end
      where provider_transaction_id=v_transaction_id;
    insert into public.account_notifications(user_id,event_key,kind,title,body,href,metadata) values
      (v_user_id,'payment:'||v_transaction_id,'payment','Payment confirmed','Your Paddle payment was verified and recorded.','/dashboard/subscription',jsonb_build_object('transaction_id',v_transaction_id,'amount_cents',v_amount,'currency',v_currency)),
      (v_user_id,'subscription:'||v_subscription_id||':activated:'||v_transaction_id,'subscription','Your '||v_plan.name||' plan is active',
       'Your paid access runs through '||to_char(v_period_end at time zone 'UTC','YYYY-MM-DD HH24:MI "UTC"')||'.','/dashboard/subscription',jsonb_build_object('plan_key',v_plan_key,'starts_at',v_period_start,'ends_at',v_period_end))
      on conflict(user_id,event_key) do nothing;
  elsif p_event_type like 'subscription.%' then
    select * into v_subscription from public.subscriptions where provider_subscription_id=v_subscription_id for update;
    -- Subscription webhooks can change cancellation/payment state, but cannot grant a plan or alter the 30-day access dates.
    if v_subscription.id is not null and p_occurred_at>=v_subscription.provider_updated_at then
      v_cancel:=v_data #>> '{scheduled_change,action}'='cancel';
      if v_data->>'status' in ('active','trialing','past_due','canceled','paused') then
        update public.subscriptions set status=v_data->>'status',cancel_at_period_end=v_cancel,
          canceled_at=nullif(v_data->>'canceled_at','')::timestamptz,provider_updated_at=p_occurred_at
          where id=v_subscription.id;
      end if;
    end if;
  elsif p_event_type in ('transaction.past_due','transaction.payment_failed','transaction.canceled') then
    v_transaction_id:=v_data->>'id';
    if v_user_id is not null and v_transaction_id is not null then
      v_amount:=coalesce(nullif(v_data #>> '{details,totals,total}','')::bigint,0);
      v_currency:=coalesce(v_data->>'currency_code','USD');
      insert into public.payments(user_id,provider_transaction_id,provider_subscription_id,amount_cents,currency,status,invoice_number,occurred_at)
        values(v_user_id,v_transaction_id,v_subscription_id,v_amount,v_currency,case when p_event_type='transaction.canceled' then 'canceled' else 'past_due' end,v_data->>'invoice_number',p_occurred_at)
        on conflict(provider_transaction_id) do update set status=case when payments.status in ('completed','refunded','partially_refunded') then payments.status else excluded.status end,
          occurred_at=greatest(payments.occurred_at,excluded.occurred_at);
    end if;
  elsif p_event_type in ('adjustment.created','adjustment.updated') then
    v_transaction_id:=v_data->>'transaction_id';
    if v_transaction_id is not null and v_data->>'action'='refund' then
      select coalesce(sum(nullif(latest.payload #>> '{data,totals,total}','')::bigint),0) into v_refunded
        from (select distinct on(payload #>> '{data,id}') payload from public.payment_webhook_events
          where event_type in ('adjustment.created','adjustment.updated') and payload #>> '{data,transaction_id}'=v_transaction_id
            and payload #>> '{data,action}'='refund' order by payload #>> '{data,id}',occurred_at desc) latest
        where latest.payload #>> '{data,status}'='approved';
      update public.payments set refunded_amount_cents=least(amount_cents,v_refunded),
        status=case when v_refunded=0 then 'completed' when v_refunded>=amount_cents then 'refunded' else 'partially_refunded' end
        where provider_transaction_id=v_transaction_id;
    end if;
  end if;
  return jsonb_build_object('ok',true,'event_id',v_event_id);
end;
$$;

revoke all on function public.process_paddle_webhook_final(text,text,timestamptz,jsonb) from public,anon,authenticated;
grant execute on function public.process_paddle_webhook_final(text,text,timestamptz,jsonb) to service_role;

create or replace function public.reserve_ai_generation(p_user_id uuid,p_request_id uuid,p_tool_slug text)
returns jsonb language plpgsql security definer set search_path=public,auth as $$
declare
  v_plan text;
  v_ai_limit integer;
  v_ai_rate integer;
  v_used bigint;
  v_rate jsonb;
  v_enabled boolean;
  v_required text;
  v_rank integer;
  v_required_rank integer;
begin
  perform pg_advisory_xact_lock(hashtextextended('ai:'||p_user_id::text,1));
  if exists(select 1 from public.user_access where user_id=p_user_id and status='suspended') then
    return jsonb_build_object('allowed',false,'reason','account_suspended');
  end if;
  if exists(select 1 from public.ai_generation_reservations where user_id=p_user_id and request_id=p_request_id and status='completed') then
    return jsonb_build_object('allowed',true,'duplicate',true);
  end if;
  select s.plan_key into v_plan from public.subscriptions s join public.plan_entitlements p on p.plan_key=s.plan_key and p.is_active
  where s.user_id=p_user_id and s.status in ('active','trialing','past_due','canceled') and (s.current_period_ends_at is null or s.current_period_ends_at>now())
    and (s.status<>'trialing' or p.trials_enabled) order by s.updated_at desc limit 1;
  v_plan:=coalesce(v_plan,'free');
  select ai_credits,ai_requests_per_minute into v_ai_limit,v_ai_rate from public.plan_entitlements where plan_key=v_plan;
  select enabled,required_plan into v_enabled,v_required from public.tool_settings where tool_slug=p_tool_slug;
  if not coalesce(v_enabled,false) then return jsonb_build_object('allowed',false,'reason','tool_unavailable'); end if;
  v_rank:=case v_plan when 'business' then 2 when 'pro' then 1 else 0 end;
  v_required_rank:=case v_required when 'business' then 2 when 'pro' then 1 else 0 end;
  if v_rank<v_required_rank then return jsonb_build_object('allowed',false,'reason','plan_required','required_plan',v_required); end if;
  if exists(select 1 from public.ai_generation_reservations where user_id=p_user_id and request_id=p_request_id and status='pending' and expires_at>now()) then
    return jsonb_build_object('allowed',true,'duplicate',true,'plan_key',v_plan);
  end if;
  if v_plan='free' then
    select (select count(*) from public.usage_events where user_id=p_user_id and event_type='ai_request') +
           (select count(*) from public.ai_generation_reservations where user_id=p_user_id and status='pending' and expires_at>now())
      into v_used;
    if v_used>=coalesce(v_ai_limit,1) then return jsonb_build_object('allowed',false,'reason','ai_lifetime_limit','limit',coalesce(v_ai_limit,1),'used',v_used); end if;
  end if;
  v_rate:=public.take_rate_limit('ai-account:'||p_user_id::text,coalesce(v_ai_rate,10),60);
  if not coalesce((v_rate->>'allowed')::boolean,false) then return jsonb_build_object('allowed',false,'reason','ai_rate_limit'); end if;
  insert into public.ai_generation_reservations(user_id,request_id,tool_slug,status,expires_at)
    values(p_user_id,p_request_id,p_tool_slug,'pending',now()+interval '10 minutes')
    on conflict(user_id,request_id) do update set tool_slug=excluded.tool_slug,status='pending',expires_at=excluded.expires_at,completed_at=null;
  return jsonb_build_object('allowed',true,'plan_key',v_plan,'ai_credits',v_ai_limit,'ai_requests_per_minute',v_ai_rate);
end;
$$;

create or replace function public.complete_ai_generation(p_user_id uuid,p_request_id uuid,p_succeeded boolean)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_reservation public.ai_generation_reservations%rowtype; v_plan text;
begin
  perform pg_advisory_xact_lock(hashtextextended('ai:'||p_user_id::text,1));
  select * into v_reservation from public.ai_generation_reservations where user_id=p_user_id and request_id=p_request_id for update;
  if v_reservation.user_id is null then return jsonb_build_object('ok',false,'reason','reservation_missing'); end if;
  if v_reservation.status='completed' then return jsonb_build_object('ok',true,'duplicate',true); end if;
  if v_reservation.status<>'pending' then return jsonb_build_object('ok',false,'reason','reservation_closed'); end if;
  if p_succeeded then
    insert into public.usage_events(user_id,tool_slug,event_type,units,request_id,metadata)
      values(p_user_id,v_reservation.tool_slug,'ai_request',1,p_request_id,'{"source":"ai-generation"}'::jsonb)
      on conflict(user_id,request_id,event_type) do nothing;
    update public.ai_generation_reservations set status='completed',completed_at=now() where user_id=p_user_id and request_id=p_request_id;
    select s.plan_key into v_plan from public.subscriptions s join public.plan_entitlements p on p.plan_key=s.plan_key and p.is_active
      where s.user_id=p_user_id and s.status in ('active','trialing','past_due','canceled') and (s.current_period_ends_at is null or s.current_period_ends_at>now())
      and (s.status<>'trialing' or p.trials_enabled) order by s.updated_at desc limit 1;
    if v_plan is null then
      insert into public.account_notifications(user_id,event_key,kind,title,body,href,metadata)
        values(p_user_id,'ai:first-success','usage','Your free AI generation is used','Your one free AI generation has been used. Pro and Business include AI subject to fair-use limits.','/pricing',jsonb_build_object('tool_slug',v_reservation.tool_slug))
        on conflict(user_id,event_key) do nothing;
    end if;
  else
    update public.ai_generation_reservations set status='released',completed_at=now() where user_id=p_user_id and request_id=p_request_id;
  end if;
  return jsonb_build_object('ok',true);
end;
$$;

revoke all on function public.reserve_ai_generation(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.reserve_ai_generation(uuid,uuid,text) to service_role;
revoke all on function public.complete_ai_generation(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.complete_ai_generation(uuid,uuid,boolean) to service_role;

create or replace function public.reserve_project_file(
  p_uploader_id uuid,p_project_id uuid,p_history_id uuid,p_file_name text,p_mime_type text,p_size_bytes bigint,p_storage_path text,p_storage_provider text
) returns jsonb language plpgsql security definer set search_path=public,auth as $$
declare
  v_project public.projects%rowtype;
  v_owner uuid;
  v_plan public.plan_entitlements%rowtype;
  v_subscription public.subscriptions%rowtype;
  v_used bigint;
  v_grace timestamptz;
  v_file_id uuid;
begin
  select * into v_project from public.projects where id=p_project_id;
  if v_project.id is null then return jsonb_build_object('ok',false,'reason','project_not_found'); end if;
  if v_project.workspace_id is null then
    if v_project.user_id<>p_uploader_id then return jsonb_build_object('ok',false,'reason','project_access'); end if;
    v_owner:=v_project.user_id;
  else
    if not exists(select 1 from public.team_members where workspace_id=v_project.workspace_id and user_id=p_uploader_id) then return jsonb_build_object('ok',false,'reason','project_access'); end if;
    select owner_user_id into v_owner from public.team_workspaces where id=v_project.workspace_id;
  end if;
  if v_owner is null then return jsonb_build_object('ok',false,'reason','billing_owner_missing'); end if;
  perform pg_advisory_xact_lock(hashtextextended('storage:'||v_owner::text,2));
  select s.* into v_subscription from public.subscriptions s join public.plan_entitlements p on p.plan_key=s.plan_key and p.is_active
    where s.user_id=v_owner and s.status in ('active','trialing','past_due','canceled') and (s.current_period_ends_at is null or s.current_period_ends_at>now())
      and (s.status<>'trialing' or p.trials_enabled) order by s.updated_at desc limit 1;
  if v_subscription.id is null then return jsonb_build_object('ok',false,'reason','paid_plan_required'); end if;
  select * into v_plan from public.plan_entitlements where plan_key=v_subscription.plan_key and is_active;
  if v_plan.storage_limit_bytes is null or v_plan.storage_limit_bytes<=0 then return jsonb_build_object('ok',false,'reason','storage_not_configured'); end if;
  if p_size_bytes<=0 or p_size_bytes>v_plan.max_file_bytes then return jsonb_build_object('ok',false,'reason','file_too_large','limit',v_plan.max_file_bytes); end if;
  if p_storage_provider not in ('r2','supabase') then return jsonb_build_object('ok',false,'reason','storage_provider_invalid'); end if;
  select coalesce(sum(size_bytes),0) into v_used from public.project_files where coalesce(billing_owner_user_id,user_id)=v_owner;
  if v_used+p_size_bytes>v_plan.storage_limit_bytes then return jsonb_build_object('ok',false,'reason','storage_limit','used',v_used,'limit',v_plan.storage_limit_bytes); end if;
  if p_history_id is not null and not exists(select 1 from public.processing_history where id=p_history_id and user_id=p_uploader_id) then
    return jsonb_build_object('ok',false,'reason','history_not_found');
  end if;
  v_grace:=case when v_subscription.current_period_ends_at is null then now()+make_interval(days=>v_plan.document_grace_days)
    else v_subscription.current_period_ends_at+make_interval(days=>v_plan.document_grace_days) end;
  insert into public.project_files(project_id,user_id,billing_owner_user_id,processing_history_id,file_name,mime_type,size_bytes,storage_path,storage_provider,grace_period_ends_at)
    values(p_project_id,p_uploader_id,v_owner,p_history_id,p_file_name,p_mime_type,p_size_bytes,p_storage_path,p_storage_provider,v_grace)
    returning id into v_file_id;
  if p_history_id is not null then
    update public.processing_history set output_filename=p_file_name,output_mime_type=p_mime_type,output_size_bytes=p_size_bytes,
      output_storage_path=p_storage_path,output_storage_provider=p_storage_provider,output_expires_at=null where id=p_history_id and user_id=p_uploader_id;
  end if;
  return jsonb_build_object('ok',true,'file_id',v_file_id,'storage_owner_user_id',v_owner,'storage_used_bytes',v_used+p_size_bytes,'storage_limit_bytes',v_plan.storage_limit_bytes,'grace_period_ends_at',v_grace);
exception when unique_violation then
  return jsonb_build_object('ok',false,'reason','duplicate_storage_path');
end;
$$;

create or replace function public.account_storage_usage(p_owner_user_id uuid)
returns jsonb language sql stable security definer set search_path=public as $$
  select jsonb_build_object('used_bytes',coalesce(sum(f.size_bytes),0),'files',count(f.id))
  from public.project_files f where coalesce(f.billing_owner_user_id,f.user_id)=p_owner_user_id
$$;

revoke all on function public.reserve_project_file(uuid,uuid,uuid,text,text,bigint,text,text) from public,anon,authenticated;
grant execute on function public.reserve_project_file(uuid,uuid,uuid,text,text,bigint,text,text) to service_role;
revoke all on function public.account_storage_usage(uuid) from public,anon,authenticated;
grant execute on function public.account_storage_usage(uuid) to service_role;

create or replace function public.run_subscription_maintenance(p_now timestamptz default now())
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_expired bigint; v_expiring bigint; v_grace_notice bigint;
begin
  update public.ai_generation_reservations set status='released',completed_at=p_now
    where status='pending' and expires_at<=p_now;

  with expired as (
    update public.subscriptions s set status='expired',grace_period_ends_at=coalesce(s.grace_period_ends_at,
      s.current_period_ends_at+make_interval(days=>coalesce(p.document_grace_days,7)))
    from public.plan_entitlements p
    where p.plan_key=s.plan_key and s.status in ('active','trialing','past_due','canceled')
      and s.current_period_ends_at is not null and s.current_period_ends_at<=p_now
    returning s.id,s.user_id,s.plan_key,s.current_period_ends_at,s.grace_period_ends_at
  ), notified as (
    insert into public.account_notifications(user_id,event_key,kind,title,body,href,metadata)
    select e.user_id,'subscription:'||e.id||':expired','subscription','Your paid plan has expired',
      'Paid features have ended. Your saved documents remain available until '||to_char(e.grace_period_ends_at at time zone 'UTC','YYYY-MM-DD HH24:MI "UTC"')||'.','/dashboard/subscription',
      jsonb_build_object('subscription_id',e.id,'plan_key',e.plan_key,'expired_at',e.current_period_ends_at,'grace_period_ends_at',e.grace_period_ends_at)
    from expired e on conflict(user_id,event_key) do nothing returning 1
  ) select count(*) into v_expired from expired;

  with inserted as (
    insert into public.account_notifications(user_id,event_key,kind,title,body,href,metadata)
    select s.user_id,'subscription:'||s.id||':expiring:'||s.current_period_ends_at::text,'subscription','Your subscription expires soon',
      'Your paid access ends on '||to_char(s.current_period_ends_at at time zone 'UTC','YYYY-MM-DD HH24:MI "UTC"')||'. Renew to keep paid features.','/dashboard/subscription',
      jsonb_build_object('subscription_id',s.id,'expires_at',s.current_period_ends_at)
    from public.subscriptions s where s.status in ('active','trialing','past_due','canceled')
      and s.current_period_ends_at>p_now and s.current_period_ends_at<=p_now+interval '3 days'
    on conflict(user_id,event_key) do nothing returning 1
  ) select count(*) into v_expiring from inserted;

  with inserted as (
    insert into public.account_notifications(user_id,event_key,kind,title,body,href,metadata)
    select s.user_id,'subscription:'||s.id||':grace-ending','documents','Saved documents are scheduled for deletion',
      'Your document grace period ends on '||to_char(s.grace_period_ends_at at time zone 'UTC','YYYY-MM-DD HH24:MI "UTC"')||'. Download anything you want to keep.','/dashboard/projects',
      jsonb_build_object('subscription_id',s.id,'grace_period_ends_at',s.grace_period_ends_at)
    from public.subscriptions s where s.status='expired' and s.grace_period_ends_at>p_now and s.grace_period_ends_at<=p_now+interval '1 day'
    on conflict(user_id,event_key) do nothing returning 1
  ) select count(*) into v_grace_notice from inserted;

  return jsonb_build_object('expired_subscriptions',v_expired,'expiration_notices',v_expiring,'grace_notices',v_grace_notice);
end;
$$;

create or replace function public.claim_expired_project_files(p_now timestamptz,p_limit integer default 100)
returns table(id uuid,storage_provider text,storage_path text,file_name text,billing_owner_user_id uuid,user_id uuid,size_bytes bigint)
language plpgsql security definer set search_path=public as $$
begin
  return query with candidates as (
    select f.id from public.project_files f where f.grace_period_ends_at<=p_now
      and (f.cleanup_locked_at is null or f.cleanup_locked_at<p_now-interval '15 minutes')
      order by f.grace_period_ends_at,f.id for update skip locked limit greatest(1,least(p_limit,500))
  ), claimed as (
    update public.project_files f set cleanup_locked_at=p_now from candidates c where f.id=c.id
    returning f.id,f.storage_provider,f.storage_path,f.file_name,f.billing_owner_user_id,f.user_id,f.size_bytes
  ) select * from claimed;
end;
$$;

create or replace function public.claim_expired_processing_history(p_now timestamptz,p_limit integer default 100)
returns table(id uuid,user_id uuid,output_storage_provider text,output_storage_path text,delete_output boolean)
language plpgsql security definer set search_path=public as $$
begin
  return query with candidates as (
    select h.id from public.processing_history h where h.retention_expires_at<=p_now
      and (h.cleanup_locked_at is null or h.cleanup_locked_at<p_now-interval '15 minutes')
      order by h.retention_expires_at,h.id for update skip locked limit greatest(1,least(p_limit,500))
  ), claimed as (
    update public.processing_history h set cleanup_locked_at=p_now from candidates c where h.id=c.id
    returning h.id,h.user_id,h.output_storage_provider,h.output_storage_path
  ) select c.id,c.user_id,c.output_storage_provider,c.output_storage_path,
      c.output_storage_path is not null and not exists(select 1 from public.project_files f where f.storage_path=c.output_storage_path) from claimed c;
end;
$$;

create or replace function public.admin_subscription_overview(p_now timestamptz default now())
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare v_storage jsonb; v_subscriptions jsonb;
begin
  with usage as (
    select coalesce(f.billing_owner_user_id,f.user_id) owner_id,sum(f.size_bytes)::bigint used_bytes,count(*)::bigint file_count
    from public.project_files f group by coalesce(f.billing_owner_user_id,f.user_id)
  ), accounts as (
    select u.*,p.plan_key,p.storage_limit_bytes from usage u
    left join lateral (
      select e.plan_key,e.storage_limit_bytes from public.subscriptions s join public.plan_entitlements e on e.plan_key=s.plan_key
      where s.user_id=u.owner_id and s.status in ('active','trialing','past_due','canceled')
        and (s.current_period_ends_at is null or s.current_period_ends_at>p_now)
      order by s.updated_at desc limit 1
    ) p on true
  ), ranked as (select a.*,row_number() over(order by used_bytes desc) rank from accounts a)
  select jsonb_build_object('total_used_bytes',coalesce(sum(used_bytes),0),'total_files',coalesce(sum(file_count),0),
    'top_accounts',coalesce(jsonb_agg(jsonb_build_object('user_id',owner_id,'used_bytes',used_bytes,'file_count',file_count,'plan_key',plan_key,
      'storage_limit_bytes',storage_limit_bytes,'remaining_bytes',case when storage_limit_bytes is null then null else greatest(0,storage_limit_bytes-used_bytes) end)
      order by used_bytes desc) filter(where rank<=50),'[]'::jsonb)) into v_storage from ranked;
  select jsonb_build_object('active',count(*) filter(where status in ('active','trialing','past_due','canceled') and current_period_ends_at>p_now),
    'expired',count(*) filter(where status='expired'),
    'expiring_7d',count(*) filter(where status in ('active','trialing','past_due','canceled') and current_period_ends_at>p_now and current_period_ends_at<=p_now+interval '7 days'))
    into v_subscriptions from public.subscriptions;
  return jsonb_build_object('subscriptions',v_subscriptions,'storage',v_storage,
    'documents_in_grace',(select count(*) from public.project_files where grace_period_ends_at>p_now),
    'documents_due_for_deletion',(select count(*) from public.project_files where grace_period_ends_at<=p_now),
    'failed_document_cleanups',(select count(*) from public.project_files where cleanup_attempts>0 and cleanup_error is not null),
    'failed_history_cleanups',(select count(*) from public.processing_history where cleanup_attempts>0 and cleanup_error is not null));
end;
$$;

revoke all on function public.run_subscription_maintenance(timestamptz) from public,anon,authenticated;
grant execute on function public.run_subscription_maintenance(timestamptz) to service_role;
revoke all on function public.claim_expired_project_files(timestamptz,integer) from public,anon,authenticated;
grant execute on function public.claim_expired_project_files(timestamptz,integer) to service_role;
revoke all on function public.claim_expired_processing_history(timestamptz,integer) from public,anon,authenticated;
grant execute on function public.claim_expired_processing_history(timestamptz,integer) to service_role;
revoke all on function public.admin_subscription_overview(timestamptz) from public,anon,authenticated;
grant execute on function public.admin_subscription_overview(timestamptz) to service_role;

