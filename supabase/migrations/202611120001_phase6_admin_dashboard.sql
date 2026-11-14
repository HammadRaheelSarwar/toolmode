-- Phase 6 admin modules: canonical roles, operational logs, support ownership,
-- and a date-bounded analytics snapshot. Admin routes still authorize each
-- request against admin_users before using the service role client.

alter table public.admin_users drop constraint if exists admin_users_role_check;
update public.admin_users set role=case role
  when 'editor' then 'content_manager'
  when 'support' then 'support_manager'
  when 'super_admin' then 'super_admin'
  when 'content_manager' then 'content_manager'
  when 'support_manager' then 'support_manager'
  else 'admin' end;
alter table public.admin_users add constraint admin_users_role_check
  check (role in ('super_admin','admin','support_manager','content_manager'));

alter table public.support_tickets
  add column if not exists assigned_to uuid references public.admin_users(user_id) on delete set null;
create index if not exists support_tickets_assigned_updated_idx
  on public.support_tickets(assigned_to,updated_at desc);

create table if not exists public.support_ticket_notes (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_user_id uuid references auth.users(id) on delete set null,
  body text not null check (char_length(body) between 1 and 10000),
  created_at timestamptz not null default now()
);
create index if not exists support_ticket_notes_ticket_created_idx
  on public.support_ticket_notes(ticket_id,created_at);
alter table public.support_ticket_notes enable row level security;

create table if not exists public.ai_generation_logs (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  user_id uuid references auth.users(id) on delete set null,
  tool_slug text not null,
  provider text,
  model text,
  status text not null check (status in ('succeeded','failed')),
  error_code text,
  input_chars integer not null default 0 check (input_chars>=0),
  output_chars integer not null default 0 check (output_chars>=0),
  latency_ms integer check (latency_ms is null or latency_ms>=0),
  created_at timestamptz not null default now()
);
create index if not exists ai_generation_logs_created_idx on public.ai_generation_logs(created_at desc);
create index if not exists ai_generation_logs_tool_created_idx on public.ai_generation_logs(tool_slug,created_at desc);
alter table public.ai_generation_logs enable row level security;

-- Keep authenticated webhook replay attempts separate from the canonical event
-- ledger. The payload is deliberately omitted to avoid retaining duplicate PII.
create table if not exists public.payment_webhook_attempts (
  id uuid primary key default gen_random_uuid(),
  notification_id text not null,
  event_type text not null,
  outcome text not null check (outcome in ('processed','duplicate','failed')),
  received_at timestamptz not null default now()
);
create index if not exists payment_webhook_attempts_notification_idx
  on public.payment_webhook_attempts(notification_id,received_at desc);
alter table public.payment_webhook_attempts enable row level security;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('blog-media','blog-media',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email_snapshot text not null default '',
  reason text not null default '' check (char_length(reason)<=1000),
  status text not null default 'pending' check (status in ('pending','reviewing','completed','denied')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  updated_by uuid references auth.users(id) on delete set null,
  unique(user_id,id)
);
create unique index if not exists one_open_deletion_request_per_user_idx
  on public.account_deletion_requests(user_id) where status in ('pending','reviewing');
create index if not exists account_deletion_requests_status_created_idx
  on public.account_deletion_requests(status,requested_at desc);
alter table public.account_deletion_requests enable row level security;
drop policy if exists account_deletion_requests_select_own on public.account_deletion_requests;
create policy account_deletion_requests_select_own on public.account_deletion_requests
  for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists account_deletion_requests_insert_own on public.account_deletion_requests;
create policy account_deletion_requests_insert_own on public.account_deletion_requests
  for insert to authenticated with check(user_id=(select auth.uid()) and status='pending' and updated_by is null);

-- Auth email and last-login data are not stored on the user-editable profile.
-- This private directory supports scalable admin search without exposing the
-- auth schema or trusting a user's editable profile fields.
create table if not exists public.admin_user_directory (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  full_name text not null default '',
  created_at timestamptz not null,
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz
);
create index if not exists admin_user_directory_created_idx on public.admin_user_directory(created_at desc,user_id);
create index if not exists admin_user_directory_email_idx on public.admin_user_directory(lower(email));
alter table public.admin_user_directory enable row level security;
insert into public.admin_user_directory(user_id,email,full_name,created_at,last_sign_in_at,email_confirmed_at)
  select u.id,coalesce(u.email,''),coalesce(p.full_name,u.raw_user_meta_data->>'full_name',''),u.created_at,u.last_sign_in_at,u.email_confirmed_at
  from auth.users u left join public.profiles p on p.id=u.id
on conflict(user_id) do update set email=excluded.email,full_name=excluded.full_name,created_at=excluded.created_at,
  last_sign_in_at=excluded.last_sign_in_at,email_confirmed_at=excluded.email_confirmed_at;

create or replace function public.phase6_sync_admin_user_directory()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.admin_user_directory(user_id,email,full_name,created_at,last_sign_in_at,email_confirmed_at)
  values(new.id,coalesce(new.email,''),coalesce(new.raw_user_meta_data->>'full_name',''),new.created_at,new.last_sign_in_at,new.email_confirmed_at)
  on conflict(user_id) do update set email=excluded.email,full_name=excluded.full_name,
    last_sign_in_at=excluded.last_sign_in_at,email_confirmed_at=excluded.email_confirmed_at;
  return new;
end;
$$;
drop trigger if exists phase6_sync_admin_user_directory on auth.users;
create trigger phase6_sync_admin_user_directory after insert or update of email,last_sign_in_at,email_confirmed_at,raw_user_meta_data
  on auth.users for each row execute function public.phase6_sync_admin_user_directory();

create or replace function public.phase6_sync_admin_profile_directory()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  update public.admin_user_directory set full_name=coalesce(new.full_name,'') where user_id=new.id;
  return new;
end;
$$;
drop trigger if exists phase6_sync_admin_profile_directory on public.profiles;
create trigger phase6_sync_admin_profile_directory after insert or update of full_name on public.profiles
  for each row execute function public.phase6_sync_admin_profile_directory();

create or replace function public.admin_user_directory_page(p_query text,p_plan text,p_status text,p_page integer,p_per_page integer)
returns table(user_id uuid,email text,full_name text,created_at timestamptz,last_sign_in_at timestamptz,email_confirmed boolean,
  access_status text,access_reason text,plan_key text,subscription_status text,subscription_ends_at timestamptz,usage_30d bigint,storage_bytes bigint,total_count bigint)
language sql stable security definer set search_path=public as $$
  with current_subscriptions as (
    select distinct on(s.user_id) s.user_id,s.plan_key,s.status,s.current_period_ends_at
    from public.subscriptions s
    where s.status in ('active','trialing','past_due','canceled') and (s.current_period_ends_at is null or s.current_period_ends_at>now())
    order by s.user_id,s.updated_at desc
  ), accounts as (
    select d.user_id,d.email,d.full_name,d.created_at,d.last_sign_in_at,(d.email_confirmed_at is not null) email_confirmed,
      coalesce(a.status,'active') access_status,a.reason,coalesce(s.plan_key,'free') plan_key,coalesce(s.status,'free') subscription_status,
      s.current_period_ends_at subscription_ends_at,
      coalesce((select count(*) from public.usage_events u where u.user_id=d.user_id and u.created_at>=now()-interval '30 days'),0)::bigint usage_30d,
      coalesce((select sum(f.size_bytes) from public.project_files f where coalesce(f.billing_owner_user_id,f.user_id)=d.user_id),0)::bigint storage_bytes
    from public.admin_user_directory d left join public.user_access a on a.user_id=d.user_id
      left join current_subscriptions s on s.user_id=d.user_id
  ), filtered as (
    select a.* from accounts a
    where (nullif(trim(p_query),'') is null or a.email ilike '%'||trim(p_query)||'%' or a.full_name ilike '%'||trim(p_query)||'%')
      and (coalesce(p_plan,'all')='all' or a.plan_key=p_plan)
      and (coalesce(p_status,'all')='all' or a.access_status=p_status)
  )
  select f.user_id,f.email,f.full_name,f.created_at,f.last_sign_in_at,f.email_confirmed,f.access_status,f.reason,
    f.plan_key,f.subscription_status,f.subscription_ends_at,f.usage_30d,f.storage_bytes,count(*) over()::bigint
  from filtered f order by f.created_at desc,f.user_id
  offset greatest(0,(least(greatest(coalesce(p_page,1),1),100000)-1)*least(greatest(coalesce(p_per_page,50),1),100))
  limit least(greatest(coalesce(p_per_page,50),1),100)
$$;
revoke all on function public.admin_user_directory_page(text,text,text,integer,integer) from public,anon,authenticated;
grant execute on function public.admin_user_directory_page(text,text,text,integer,integer) to service_role;

create or replace function public.admin_ai_metrics(p_since timestamptz,p_until timestamptz)
returns jsonb language sql stable security definer set search_path=public as $$
  with selected as (
    select l.* from public.ai_generation_logs l where l.created_at>=p_since and l.created_at<p_until
  ), current_plans as (
    select distinct on(s.user_id) s.user_id,s.plan_key from public.subscriptions s
    where s.status in ('active','trialing') and (s.current_period_ends_at is null or s.current_period_ends_at>now())
    order by s.user_id,s.updated_at desc
  )
  select jsonb_build_object(
    'total',(select count(*) from selected),
    'succeeded',(select count(*) from selected where status='succeeded'),
    'failed',(select count(*) from selected where status='failed'),
    'estimated_cost',null,
    'by_tool',(select coalesce(jsonb_agg(jsonb_build_object('label',tool_slug,'value',total) order by total desc),'[]'::jsonb)
      from (select tool_slug,count(*)::bigint total from selected group by tool_slug) x),
    'by_plan',(select coalesce(jsonb_agg(jsonb_build_object('label',plan_key,'value',total) order by plan_key),'[]'::jsonb)
      from (select coalesce(cp.plan_key,'free') plan_key,count(*)::bigint total from selected s left join current_plans cp on cp.user_id=s.user_id group by 1) x),
    'recent_errors',(select coalesce(jsonb_agg(jsonb_build_object('tool_slug',tool_slug,'model',model,'error_code',error_code,'created_at',created_at) order by created_at desc),'[]'::jsonb)
      from (select tool_slug,model,error_code,created_at from selected where status='failed' order by created_at desc limit 50) x)
  )
$$;
revoke all on function public.admin_ai_metrics(timestamptz,timestamptz) from public,anon,authenticated;
grant execute on function public.admin_ai_metrics(timestamptz,timestamptz) to service_role;

create or replace function public.admin_storage_snapshot(p_now timestamptz default now())
returns jsonb language sql stable security definer set search_path=public as $$
  with usage as (
    select coalesce(f.billing_owner_user_id,f.user_id) owner_id,sum(f.size_bytes)::bigint used_bytes,count(*)::bigint file_count
    from public.project_files f group by coalesce(f.billing_owner_user_id,f.user_id)
  ), classified as (
    select u.owner_id,u.used_bytes,u.file_count,d.email,d.full_name,
      coalesce(plan.plan_key,'free') plan_key,plan.storage_limit_bytes
    from usage u left join public.admin_user_directory d on d.user_id=u.owner_id
    left join lateral (
      select e.plan_key,e.storage_limit_bytes from public.subscriptions s
      join public.plan_entitlements e on e.plan_key=s.plan_key and e.is_active
      where s.user_id=u.owner_id and s.status in ('active','trialing','past_due','canceled')
        and (s.current_period_ends_at is null or s.current_period_ends_at>p_now)
        and (s.status<>'trialing' or e.trials_enabled)
      order by s.updated_at desc limit 1
    ) plan on true
  ), by_plan as (
    select plan_key,sum(used_bytes)::bigint used_bytes,sum(file_count)::bigint file_count,count(*)::bigint users
    from classified group by plan_key
  ), ranked as (
    select *,row_number() over(order by used_bytes desc) rank from classified
  ), temporary as (
    select count(*)::bigint files,coalesce(sum(h.output_size_bytes),0)::bigint bytes,
      count(*) filter(where h.retention_expires_at<=p_now)::bigint expired,
      count(*) filter(where h.cleanup_error is not null)::bigint failed_cleanup
    from public.processing_history h where h.output_storage_path is not null
      and not exists(select 1 from public.project_files f where f.storage_path=h.output_storage_path)
  )
  select jsonb_build_object(
    'total_used_bytes',coalesce((select sum(used_bytes) from classified),0),
    'total_files',coalesce((select sum(file_count) from classified),0),
    'storage_by_plan',coalesce((select jsonb_agg(jsonb_build_object('plan_key',plan_key,'used_bytes',used_bytes,'file_count',file_count,'users',users) order by plan_key) from by_plan),'[]'::jsonb),
    'top_accounts',coalesce((select jsonb_agg(jsonb_build_object('user_id',owner_id,'email',email,'full_name',full_name,'plan_key',plan_key,
      'used_bytes',used_bytes,'file_count',file_count,'storage_limit_bytes',storage_limit_bytes,
      'remaining_bytes',case when storage_limit_bytes is null then null else greatest(0,storage_limit_bytes-used_bytes) end) order by used_bytes desc)
      from ranked where rank<=100),'[]'::jsonb),
    'documents_in_grace',(select count(*) from public.project_files where grace_period_ends_at>p_now),
    'documents_due_for_deletion',(select count(*) from public.project_files where grace_period_ends_at<=p_now),
    'failed_document_cleanups',(select count(*) from public.project_files where cleanup_error is not null),
    'temporary_files',(select files from temporary),'temporary_bytes',(select bytes from temporary),
    'expired_temporary_files',(select expired from temporary),'failed_history_cleanups',(select failed_cleanup from temporary)
  )
$$;
revoke all on function public.admin_storage_snapshot(timestamptz) from public,anon,authenticated;
grant execute on function public.admin_storage_snapshot(timestamptz) to service_role;

create or replace function public.admin_set_user_role(p_actor_id uuid,p_user_id uuid,p_role text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_current text; v_count bigint;
begin
  perform pg_advisory_xact_lock(hashtextextended('public.admin_users.role-change',0));
  if not exists(select 1 from public.admin_users where user_id=p_actor_id and role='super_admin') then
    return jsonb_build_object('ok',false,'reason','actor_not_super_admin');
  end if;
  if p_role is not null and p_role not in ('super_admin','admin','support_manager','content_manager') then
    return jsonb_build_object('ok',false,'reason','invalid_role');
  end if;
  if p_actor_id=p_user_id and p_role is distinct from 'super_admin' then
    return jsonb_build_object('ok',false,'reason','cannot_change_self');
  end if;
  select role into v_current from public.admin_users where user_id=p_user_id;
  if v_current='super_admin' and p_role is distinct from 'super_admin' then
    select count(*) into v_count from public.admin_users where role='super_admin';
    if v_count<=1 then return jsonb_build_object('ok',false,'reason','last_super_admin'); end if;
  end if;
  if p_role is null then
    delete from public.admin_users where user_id=p_user_id;
  else
    insert into public.admin_users(user_id,role) values(p_user_id,p_role)
    on conflict(user_id) do update set role=excluded.role;
  end if;
  insert into public.admin_audit_logs(actor_user_id,action,target_type,target_id,detail)
    values(p_actor_id,'admin.role_changed','admin_user',p_user_id::text,jsonb_build_object('previousRole',v_current,'role',p_role));
  return jsonb_build_object('ok',true,'previous_role',v_current,'role',p_role);
end;
$$;
revoke all on function public.admin_set_user_role(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.admin_set_user_role(uuid,uuid,text) to service_role;

create or replace function public.admin_dashboard_snapshot(p_since timestamptz,p_until timestamptz)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare v_result jsonb;
begin
  if p_since is null or p_until is null or p_until<=p_since or p_until>now()+interval '1 day' then
    raise exception 'Invalid analytics date range';
  end if;
  with latest_subscriptions as (
    select distinct on (s.user_id) s.user_id,s.plan_key,s.status,s.current_period_ends_at,s.billing_interval
    from public.subscriptions s
    order by s.user_id,s.updated_at desc
  ),
  points as (
    select generate_series(date_trunc('day',p_since),date_trunc('day',p_until),interval '1 day') as bucket
  ),
  registration_trend as (
    select p.bucket,count(pr.id)::bigint as value from points p left join public.profiles pr
      on pr.created_at>=p.bucket and pr.created_at<p.bucket+interval '1 day' and pr.created_at>=p_since and pr.created_at<p_until
    group by p.bucket order by p.bucket
  ),
  subscription_trend as (
    select p.bucket,count(s.id)::bigint as value from points p left join public.subscriptions s
      on s.created_at>=p.bucket and s.created_at<p.bucket+interval '1 day' and s.created_at>=p_since and s.created_at<p_until
    group by p.bucket order by p.bucket
  ),
  revenue_trend as (
    select p.bucket,coalesce(sum(greatest(0,pay.amount_cents-pay.refunded_amount_cents)),0)::bigint as value
    from points p left join public.payments pay on pay.occurred_at>=p.bucket and pay.occurred_at<p.bucket+interval '1 day'
      and pay.occurred_at>=p_since and pay.occurred_at<p_until and pay.status in ('completed','partially_refunded','refunded')
      and pay.currency='USD'
    group by p.bucket order by p.bucket
  ),
  tool_usage as (
    select tool_slug,count(*)::bigint as value from public.usage_events
    where event_type='tool_run' and created_at>=p_since and created_at<p_until group by tool_slug order by value desc limit 20
  ),
  ai_usage as (
    select tool_slug,count(*)::bigint as value from public.ai_generation_logs
    where created_at>=p_since and created_at<p_until group by tool_slug order by value desc limit 20
  ),
  plans as (
    select count(*) filter(where not(coalesce(l.plan_key,'') in ('pro','business') and l.status in ('active','trialing','past_due','canceled') and (l.current_period_ends_at is null or l.current_period_ends_at>now())))::bigint as free,
      count(*) filter(where l.plan_key='pro' and l.status in ('active','trialing','past_due','canceled') and (l.current_period_ends_at is null or l.current_period_ends_at>now()))::bigint as pro,
      count(*) filter(where l.plan_key='business' and l.status in ('active','trialing','past_due','canceled') and (l.current_period_ends_at is null or l.current_period_ends_at>now()))::bigint as business
    from public.profiles pr left join latest_subscriptions l on l.user_id=pr.id
  ),
  active_subscriptions as (
    select count(*)::bigint total,count(*) filter(where status='expired' or current_period_ends_at<=now())::bigint expired,
      count(*) filter(where status in ('active','trialing','past_due','canceled') and (current_period_ends_at is null or current_period_ends_at>now()))::bigint active,
      coalesce(sum(case when billing_interval='year' then round(e.yearly_price_cents::numeric/12) else e.monthly_price_cents end)
        filter(where status in ('active','trialing') and (current_period_ends_at is null or current_period_ends_at>now())),0)::bigint mrr
    from latest_subscriptions l left join public.plan_entitlements e on e.plan_key=l.plan_key
  ),
  payment_stats as (
    select count(*) filter(where status in ('completed','partially_refunded','refunded'))::bigint verified,
      coalesce(sum(greatest(0,amount_cents-refunded_amount_cents)) filter(where status in ('completed','partially_refunded','refunded') and currency='USD'),0)::bigint revenue
    from public.payments
  ),
  storage_stats as (
    select coalesce(sum(size_bytes),0)::bigint bytes,count(*)::bigint files,
      count(*) filter(where grace_period_ends_at>now())::bigint in_grace,
      count(*) filter(where grace_period_ends_at<=now())::bigint due_deletion,
      count(*) filter(where cleanup_error is not null)::bigint cleanup_failures
    from public.project_files
  ),
  support_stats as (select count(*)::bigint total,count(*) filter(where status in ('open','in_progress','waiting_on_user'))::bigint open
    from public.support_tickets),
  ai_stats as (select count(*)::bigint total,count(*) filter(where status='succeeded')::bigint succeeded,
      count(*) filter(where status='failed')::bigint failed
    from public.ai_generation_logs where created_at>=p_since and created_at<p_until),
  failed_jobs as (select count(*)::bigint total from public.processing_history where status='failed' and processed_at>=p_since and processed_at<p_until)
  select jsonb_build_object(
    'totals',jsonb_build_object(
      'users',(select count(*) from public.profiles),
      'newRegistrations',(select count(*) from public.profiles where created_at>=p_since and created_at<p_until),
      'activeUsers',(select count(distinct user_id) from (
        select user_id from public.usage_events where created_at>=p_since and created_at<p_until
        union select user_id from public.processing_history where processed_at>=p_since and processed_at<p_until
      ) active_accounts),
      'freeUsers',(select free from plans),'proSubscribers',(select pro from plans),'premiumSubscribers',(select business from plans),
      'activeSubscriptions',(select active from active_subscriptions),'expiredSubscriptions',(select expired from active_subscriptions),
      'verifiedPayments',(select verified from payment_stats),'verifiedRevenueUsdCents',(select revenue from payment_stats),
      'monthlyRecurringRevenueUsdCents',(select mrr from active_subscriptions),
      'aiRequests',(select total from ai_stats),'successfulAiGenerations',(select succeeded from ai_stats),'failedAiGenerations',(select failed from ai_stats),
      'toolJobs',(select count(*) from public.usage_events where event_type='tool_run' and created_at>=p_since and created_at<p_until),
      'failedProcessingJobs',(select total from failed_jobs),
      'storageBytes',(select bytes from storage_stats),'savedDocuments',(select files from storage_stats),
      'documentsInGrace',(select in_grace from storage_stats),'documentsDueForDeletion',(select due_deletion from storage_stats),
      'failedCleanupJobs',(select cleanup_failures from storage_stats),
      'supportTickets',(select total from support_stats),'openSupportTickets',(select open from support_stats)
    ),
    'trends',jsonb_build_object(
      'registrations',(select coalesce(jsonb_agg(jsonb_build_object('date',bucket::date,'value',value) order by bucket),'[]'::jsonb) from registration_trend),
      'subscriptions',(select coalesce(jsonb_agg(jsonb_build_object('date',bucket::date,'value',value) order by bucket),'[]'::jsonb) from subscription_trend),
      'revenueUsdCents',(select coalesce(jsonb_agg(jsonb_build_object('date',bucket::date,'value',value) order by bucket),'[]'::jsonb) from revenue_trend),
      'toolUsage',(select coalesce(jsonb_agg(jsonb_build_object('label',tool_slug,'value',value) order by value desc),'[]'::jsonb) from tool_usage),
      'aiUsage',(select coalesce(jsonb_agg(jsonb_build_object('label',tool_slug,'value',value) order by value desc),'[]'::jsonb) from ai_usage),
      'planDistribution',jsonb_build_array(jsonb_build_object('label','Free','value',(select free from plans)),
        jsonb_build_object('label','Pro','value',(select pro from plans)),jsonb_build_object('label','Premium','value',(select business from plans)))
    )
  ) into v_result;
  return v_result;
end;
$$;

revoke all on function public.admin_dashboard_snapshot(timestamptz,timestamptz) from public,anon,authenticated;
grant execute on function public.admin_dashboard_snapshot(timestamptz,timestamptz) to service_role;
