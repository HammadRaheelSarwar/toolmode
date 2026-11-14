-- Phase 4-8 platform tables. This adds to the Phase 3 account schema; no Phase 3 tables are recreated.

create table if not exists public.plan_entitlements (
  plan_key text primary key check (plan_key in ('free', 'pro', 'business')),
  name text not null,
  description text not null default '',
  monthly_price_cents integer not null default 0 check (monthly_price_cents >= 0),
  yearly_price_cents integer not null default 0 check (yearly_price_cents >= 0),
  monthly_paddle_price_id text,
  yearly_paddle_price_id text,
  monthly_tool_runs integer not null default 100 check (monthly_tool_runs >= 0),
  ai_credits integer not null default 5 check (ai_credits >= 0),
  max_file_bytes bigint not null default 10485760 check (max_file_bytes >= 0),
  max_batch_files integer not null default 1 check (max_batch_files >= 1),
  history_days integer not null default 7 check (history_days >= 0),
  api_requests integer not null default 0 check (api_requests >= 0),
  team_members integer not null default 0 check (team_members >= 0),
  ads_enabled boolean not null default true,
  priority text not null default 'standard',
  trials_enabled boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.plan_entitlements
  (plan_key,name,description,monthly_price_cents,yearly_price_cents,monthly_tool_runs,ai_credits,max_file_bytes,max_batch_files,history_days,api_requests,team_members,ads_enabled,priority,sort_order)
values
  ('free','Free','Useful tools for everyday tasks.',0,0,100,5,10485760,1,7,0,0,true,'standard',0),
  ('pro','Pro','More capacity and a personal cloud workspace.',599,4900,2000,100,104857600,20,365,0,0,false,'priority',1),
  ('business','Business','Shared workspaces and higher team allowances.',1499,14900,10000,500,524288000,50,730,10000,5,false,'priority',2)
on conflict (plan_key) do nothing;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_key text not null references public.plan_entitlements(plan_key),
  provider text not null default 'paddle' check (provider in ('paddle')),
  provider_customer_id text,
  provider_subscription_id text unique,
  provider_price_id text,
  billing_interval text check (billing_interval is null or billing_interval in ('month','year')),
  status text not null check (status in ('active','trialing','past_due','canceled','expired','paused')),
  current_period_starts_at timestamptz,
  current_period_ends_at timestamptz,
  next_billed_at timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  provider_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checkout_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_key text not null references public.plan_entitlements(plan_key),
  billing_interval text not null check (billing_interval in ('month','year')),
  provider_price_id text not null,
  status text not null default 'pending' check (status in ('pending','consumed','expired')),
  expires_at timestamptz not null default now() + interval '30 minutes',
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists checkout_intents_one_pending_per_user_idx
  on public.checkout_intents(user_id) where status='pending';

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  provider text not null default 'paddle' check (provider in ('paddle')),
  provider_transaction_id text not null unique,
  provider_subscription_id text,
  amount_cents bigint not null default 0 check (amount_cents >= 0),
  refunded_amount_cents bigint not null default 0 check (refunded_amount_cents >= 0),
  currency text not null default 'USD' check (char_length(currency) = 3),
  status text not null default 'completed' check (status in ('completed','refunded','partially_refunded','past_due','canceled')),
  invoice_number text,
  receipt_url text,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.payments add column if not exists refunded_amount_cents bigint not null default 0 check (refunded_amount_cents >= 0);

create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'paddle' check (provider in ('paddle')),
  notification_id text not null unique,
  event_type text not null,
  occurred_at timestamptz not null,
  payload jsonb not null,
  processed_at timestamptz not null default now()
);

-- A read-only customer ledger view keeps billing history as a projection of payments, not a duplicate store.
create or replace view public.billing_history with (security_invoker = true) as
  select id, user_id, subscription_id, provider, provider_transaction_id,
         provider_subscription_id, amount_cents, currency, status,
         invoice_number, receipt_url, occurred_at, created_at
  from public.payments;

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tool_slug text not null,
  event_type text not null check (event_type in ('tool_run','ai_request','api_request')),
  units integer not null default 1 check (units > 0),
  request_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, request_id, event_type)
);

create table if not exists public.user_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active','suspended')),
  reason text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin','editor','support')),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.tool_settings (
  tool_slug text primary key,
  enabled boolean not null default true,
  name_override text,
  description_override text,
  category_override text check (category_override is null or category_override in ('PDF','Image','Calculators','Text','AI')),
  required_plan text not null default 'free' references public.plan_entitlements(plan_key),
  max_file_bytes_override bigint check (max_file_bytes_override is null or max_file_bytes_override >= 0),
  batch_files_override integer check (batch_files_override is null or batch_files_override >= 1),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.tool_settings add column if not exists name_override text;
alter table public.tool_settings add column if not exists description_override text;
alter table public.tool_settings add column if not exists category_override text;

insert into public.tool_settings (tool_slug,required_plan) values
  ('pdf-merger','free'),('pdf-compressor','free'),('pdf-splitter','free'),('pdf-to-image','free'),('image-to-pdf','free'),
  ('image-compressor','free'),('image-resizer','free'),('jpg-to-png','free'),('png-to-webp','free'),('image-cropper','free'),
  ('age-calculator','free'),('percentage-calculator','free'),('bmi-calculator','free'),('loan-calculator','free'),('mortgage-calculator','free'),
  ('word-counter','free'),('character-counter','free'),('case-converter','free'),('remove-duplicate-lines','free'),('text-diff-checker','free'),
  ('ai-text-summarizer','free'),('ai-paragraph-rewriter','free'),('ai-email-generator','free'),('ai-blog-title-generator','free'),('seo-meta-description-generator','free')
on conflict (tool_slug) do nothing;

create table if not exists public.blog_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 180),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  excerpt text not null default '',
  content jsonb not null default '[]'::jsonb,
  category text not null default 'Guides',
  tags text[] not null default '{}',
  author text not null default 'ToolModeOn',
  featured_image_url text,
  featured_image_alt text,
  meta_title text,
  meta_description text,
  canonical_url text,
  status text not null default 'draft' check (status in ('draft','scheduled','published','archived')),
  scheduled_at timestamptz,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ad_slots (
  placement_key text primary key,
  enabled boolean not null default false,
  publisher_id text,
  ad_slot_id text,
  allowed_plans text[] not null default array['free'],
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.affiliate_links (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  label text not null,
  destination_url text not null,
  disclosure text not null default 'Affiliate link: ToolModeOn may earn a commission if you purchase through this link.',
  campaign text,
  enabled boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  affiliate_link_id uuid not null references public.affiliate_links(id) on delete cascade,
  campaign text,
  referrer_host text,
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null check (char_length(subject) between 3 and 160),
  category text not null default 'general',
  status text not null default 'open' check (status in ('open','in_progress','waiting_on_user','resolved','closed')),
  priority text not null default 'normal' check (priority in ('low','normal','high')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_user_id uuid references auth.users(id) on delete set null,
  is_admin boolean not null default false,
  body text not null check (char_length(body) between 1 and 10000),
  created_at timestamptz not null default now()
);

create table if not exists public.system_settings (
  setting_key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.rate_limit_buckets (
  bucket_key text primary key,
  window_started_at timestamptz not null,
  hits integer not null check (hits >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key_prefix text not null,
  key_hash text not null unique,
  label text not null default 'API key',
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.team_workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_members (
  workspace_id uuid not null references public.team_workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  joined_at timestamptz not null default now(),
  primary key (workspace_id,user_id)
);

create table if not exists public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.team_workspaces(id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('admin','member')),
  token_hash text not null unique,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (workspace_id,email)
);

alter table public.projects add column if not exists workspace_id uuid references public.team_workspaces(id) on delete cascade;
alter table public.project_files drop constraint if exists project_files_project_owner_fk;
alter table public.project_files drop constraint if exists project_files_project_fk;
alter table public.project_files add constraint project_files_project_fk foreign key (project_id) references public.projects(id) on delete cascade;

create index if not exists subscriptions_user_status_idx on public.subscriptions(user_id,status,updated_at desc);
create index if not exists payments_user_occurred_idx on public.payments(user_id,occurred_at desc);
create index if not exists usage_events_user_created_idx on public.usage_events(user_id,event_type,created_at desc);
create index if not exists blog_articles_published_idx on public.blog_articles(published_at desc) where status = 'published';
create index if not exists affiliate_clicks_link_created_idx on public.affiliate_clicks(affiliate_link_id,created_at desc);
create index if not exists support_tickets_user_created_idx on public.support_tickets(user_id,created_at desc);
create index if not exists support_messages_ticket_created_idx on public.support_messages(ticket_id,created_at);
create index if not exists admin_audit_logs_created_idx on public.admin_audit_logs(created_at desc);

create or replace function public.phase4_set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists plan_entitlements_set_updated_at on public.plan_entitlements;
create trigger plan_entitlements_set_updated_at before update on public.plan_entitlements for each row execute function public.phase4_set_updated_at();
drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at before update on public.subscriptions for each row execute function public.phase4_set_updated_at();
drop trigger if exists blog_articles_set_updated_at on public.blog_articles;
create trigger blog_articles_set_updated_at before update on public.blog_articles for each row execute function public.phase4_set_updated_at();
drop trigger if exists support_tickets_set_updated_at on public.support_tickets;
create trigger support_tickets_set_updated_at before update on public.support_tickets for each row execute function public.phase4_set_updated_at();

alter table public.plan_entitlements enable row level security;
alter table public.subscriptions enable row level security;
alter table public.checkout_intents enable row level security;
alter table public.payments enable row level security;
alter table public.payment_webhook_events enable row level security;
alter table public.usage_events enable row level security;
alter table public.user_access enable row level security;
alter table public.admin_users enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.tool_settings enable row level security;
alter table public.blog_articles enable row level security;
alter table public.ad_slots enable row level security;
alter table public.affiliate_links enable row level security;
alter table public.affiliate_clicks enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.system_settings enable row level security;
alter table public.rate_limit_buckets enable row level security;
alter table public.api_keys enable row level security;
alter table public.team_workspaces enable row level security;
alter table public.team_members enable row level security;
alter table public.team_invitations enable row level security;

drop policy if exists plan_entitlements_public_read on public.plan_entitlements;
create policy plan_entitlements_public_read on public.plan_entitlements for select to anon, authenticated using (is_active);
drop policy if exists subscriptions_select_own on public.subscriptions;
create policy subscriptions_select_own on public.subscriptions for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists payments_select_own on public.payments;
create policy payments_select_own on public.payments for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists usage_events_select_own on public.usage_events;
create policy usage_events_select_own on public.usage_events for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists user_access_select_own on public.user_access;
create policy user_access_select_own on public.user_access for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists tool_settings_public_read on public.tool_settings;
create policy tool_settings_public_read on public.tool_settings for select to anon, authenticated using (true);
drop policy if exists blog_articles_published_read on public.blog_articles;
create policy blog_articles_published_read on public.blog_articles for select to anon, authenticated using ((status = 'published' and published_at <= now()) or (status = 'scheduled' and scheduled_at <= now()));
create or replace view public.published_blog_articles with (security_invoker = true) as
  select * from public.blog_articles
  where (status = 'published' and published_at <= now()) or (status = 'scheduled' and scheduled_at <= now());
grant select on public.published_blog_articles to anon, authenticated;
drop policy if exists ad_slots_public_read on public.ad_slots;
create policy ad_slots_public_read on public.ad_slots for select to anon, authenticated using (enabled);
drop policy if exists affiliate_links_public_read on public.affiliate_links;
create policy affiliate_links_public_read on public.affiliate_links for select to anon, authenticated using (enabled);
grant select on public.plan_entitlements, public.tool_settings, public.blog_articles, public.published_blog_articles, public.ad_slots, public.affiliate_links to anon, authenticated;
drop policy if exists support_tickets_select_own on public.support_tickets;
create policy support_tickets_select_own on public.support_tickets for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists support_tickets_insert_own on public.support_tickets;
create policy support_tickets_insert_own on public.support_tickets for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists support_messages_select_own_ticket on public.support_messages;
create policy support_messages_select_own_ticket on public.support_messages for select to authenticated using (
  exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = (select auth.uid()))
);
drop policy if exists projects_all_own on public.projects;
drop policy if exists projects_select_own_or_team on public.projects;
create policy projects_select_own_or_team on public.projects for select to authenticated using (
  user_id=(select auth.uid()) or exists (
    select 1 from public.team_members m where m.workspace_id=projects.workspace_id and m.user_id=(select auth.uid())
  )
);
drop policy if exists projects_insert_own_or_team on public.projects;
create policy projects_insert_own_or_team on public.projects for insert to authenticated with check (
  user_id=(select auth.uid()) and (workspace_id is null or exists (
    select 1 from public.team_members m where m.workspace_id=projects.workspace_id and m.user_id=(select auth.uid())
  ))
);
drop policy if exists projects_update_owner on public.projects;
create policy projects_update_owner on public.projects for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
drop policy if exists projects_delete_owner on public.projects;
create policy projects_delete_owner on public.projects for delete to authenticated using (user_id=(select auth.uid()));

drop policy if exists project_files_all_own on public.project_files;
drop policy if exists project_files_select_own_or_team on public.project_files;
create policy project_files_select_own_or_team on public.project_files for select to authenticated using (
  user_id=(select auth.uid()) or exists (
    select 1 from public.projects p join public.team_members m on m.workspace_id=p.workspace_id
    where p.id=project_files.project_id and m.user_id=(select auth.uid())
  )
);
drop policy if exists project_files_insert_own_or_team on public.project_files;
create policy project_files_insert_own_or_team on public.project_files for insert to authenticated with check (
  user_id=(select auth.uid()) and
  (processing_history_id is null or exists (
    select 1 from public.processing_history h where h.id=processing_history_id and h.user_id=(select auth.uid())
  )) and
  exists (
    select 1 from public.projects p where p.id=project_files.project_id and
      (p.user_id=(select auth.uid()) or exists (
        select 1 from public.team_members m where m.workspace_id=p.workspace_id and m.user_id=(select auth.uid())
      ))
  )
);
drop policy if exists project_files_delete_own_or_team_admin on public.project_files;
create policy project_files_delete_own_or_team_admin on public.project_files for delete to authenticated using (
  user_id=(select auth.uid()) or exists (
    select 1 from public.projects p join public.team_members m on m.workspace_id=p.workspace_id
    where p.id=project_files.project_id and m.user_id=(select auth.uid()) and m.role in ('owner','admin')
  )
);
drop policy if exists team_workspaces_select_members on public.team_workspaces;
create policy team_workspaces_select_members on public.team_workspaces for select to authenticated using (
  owner_user_id=(select auth.uid()) or exists (
    select 1 from public.team_members m where m.workspace_id=team_workspaces.id and m.user_id=(select auth.uid())
  )
);
drop policy if exists team_members_select_self on public.team_members;
create policy team_members_select_self on public.team_members for select to authenticated using (user_id=(select auth.uid()));
-- All other new tables are server-managed and have no anon/authenticated policies.

create or replace function public.reserve_tool_usage(p_user_id uuid, p_request_id uuid, p_tool_slug text, p_event_type text)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  v_plan text;
  v_limit integer;
  v_ai_limit integer;
  v_used integer;
  v_ai_used integer;
  v_required text;
  v_enabled boolean;
  v_rank integer;
  v_required_rank integer;
  v_month_start timestamptz := date_trunc('month', now());
begin
  if p_event_type not in ('tool_run','ai_request','api_request') then return jsonb_build_object('allowed',false,'reason','invalid_event'); end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  if exists (select 1 from public.user_access where user_id=p_user_id and status='suspended') then
    return jsonb_build_object('allowed',false,'reason','account_suspended');
  end if;
  if exists (select 1 from public.usage_events where user_id=p_user_id and request_id=p_request_id and event_type=p_event_type) then
    return jsonb_build_object('allowed',true,'duplicate',true,'plan_key',coalesce((select plan_key from public.subscriptions where user_id=p_user_id and status in ('active','trialing') and (current_period_ends_at is null or current_period_ends_at > now()) order by updated_at desc limit 1),'free'));
  end if;
  select s.plan_key into v_plan from public.subscriptions s join public.plan_entitlements p on p.plan_key=s.plan_key and p.is_active
  where s.user_id=p_user_id and s.status='active' and (s.current_period_ends_at is null or s.current_period_ends_at > now())
  order by s.updated_at desc limit 1;
  if v_plan is null then
    select s.plan_key into v_plan from public.subscriptions s join public.plan_entitlements p on p.plan_key=s.plan_key and p.is_active and p.trials_enabled
    where s.user_id=p_user_id and s.status='trialing' and (s.current_period_ends_at is null or s.current_period_ends_at > now())
    order by s.updated_at desc limit 1;
  end if;
  v_plan := coalesce(v_plan,'free');
  select monthly_tool_runs, ai_credits into v_limit,v_ai_limit from public.plan_entitlements where plan_key=v_plan;
  select enabled,required_plan into v_enabled,v_required from public.tool_settings where tool_slug=p_tool_slug;
  if coalesce(v_enabled,false)=false then return jsonb_build_object('allowed',false,'reason','tool_unavailable','plan_key',v_plan); end if;
  v_rank := case v_plan when 'business' then 2 when 'pro' then 1 else 0 end;
  v_required_rank := case v_required when 'business' then 2 when 'pro' then 1 else 0 end;
  if v_rank < v_required_rank then return jsonb_build_object('allowed',false,'reason','plan_required','required_plan',v_required,'plan_key',v_plan); end if;
  select coalesce(sum(units),0) into v_used from public.usage_events where user_id=p_user_id and event_type='tool_run' and created_at >= v_month_start;
  if v_used >= v_limit then return jsonb_build_object('allowed',false,'reason','monthly_limit','limit',v_limit,'used',v_used,'plan_key',v_plan); end if;
  if p_event_type='ai_request' then
    select coalesce(sum(units),0) into v_ai_used from public.usage_events where user_id=p_user_id and event_type='ai_request' and created_at >= v_month_start;
    if v_ai_used >= v_ai_limit then return jsonb_build_object('allowed',false,'reason','ai_credit_limit','limit',v_ai_limit,'used',v_ai_used,'plan_key',v_plan); end if;
    insert into public.usage_events(user_id,tool_slug,event_type,request_id) values (p_user_id,p_tool_slug,'tool_run',p_request_id);
    insert into public.usage_events(user_id,tool_slug,event_type,request_id) values (p_user_id,p_tool_slug,'ai_request',p_request_id);
  elsif p_event_type='api_request' then
    select api_requests into v_limit from public.plan_entitlements where plan_key=v_plan;
    select coalesce(sum(units),0) into v_used from public.usage_events where user_id=p_user_id and event_type='api_request' and created_at >= v_month_start;
    if v_used >= v_limit then return jsonb_build_object('allowed',false,'reason','api_limit','limit',v_limit,'used',v_used,'plan_key',v_plan); end if;
    insert into public.usage_events(user_id,tool_slug,event_type,request_id) values (p_user_id,p_tool_slug,'api_request',p_request_id);
  else
    insert into public.usage_events(user_id,tool_slug,event_type,request_id) values (p_user_id,p_tool_slug,'tool_run',p_request_id);
  end if;
  return jsonb_build_object('allowed',true,'plan_key',v_plan,'monthly_tool_runs',v_limit,'ai_credits',v_ai_limit,'used',v_used+1);
end;
$$;

create or replace function public.take_rate_limit(p_bucket_key text, p_limit integer, p_window_seconds integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_now timestamptz := clock_timestamp();
  v_start timestamptz;
  v_hits integer;
begin
  if p_limit < 1 or p_window_seconds < 1 then return jsonb_build_object('allowed',false,'remaining',0); end if;
  perform pg_advisory_xact_lock(hashtextextended(p_bucket_key, 0));
  select window_started_at,hits into v_start,v_hits from public.rate_limit_buckets where bucket_key=p_bucket_key for update;
  if v_start is null or v_start + make_interval(secs => p_window_seconds) <= v_now then
    insert into public.rate_limit_buckets(bucket_key,window_started_at,hits,updated_at) values (p_bucket_key,v_now,1,v_now)
    on conflict (bucket_key) do update set window_started_at=excluded.window_started_at,hits=1,updated_at=v_now;
    return jsonb_build_object('allowed',true,'remaining',p_limit-1,'reset_at',v_now+make_interval(secs=>p_window_seconds));
  end if;
  if v_hits >= p_limit then return jsonb_build_object('allowed',false,'remaining',0,'reset_at',v_start+make_interval(secs=>p_window_seconds)); end if;
  update public.rate_limit_buckets set hits=hits+1,updated_at=v_now where bucket_key=p_bucket_key;
  return jsonb_build_object('allowed',true,'remaining',p_limit-v_hits-1,'reset_at',v_start+make_interval(secs=>p_window_seconds));
end;
$$;

create or replace function public.process_paddle_webhook(p_notification_id text, p_event_type text, p_occurred_at timestamptz, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  v_event_id uuid;
  v_data jsonb := p_payload->'data';
  v_custom jsonb := p_payload->'data'->'custom_data';
  v_intent_id uuid;
  v_intent public.checkout_intents%rowtype;
  v_user_id uuid;
  v_plan text;
  v_mapped_plan text;
  v_interval text;
  v_mapped_interval text;
  v_price_id text;
  v_provider_sub_id text;
  v_provider_customer_id text;
  v_status text;
  v_cancel boolean := false;
  v_period_start timestamptz;
  v_period_end timestamptz;
  v_next_bill timestamptz;
  v_sub_row uuid;
  v_txn_id text;
  v_amount bigint;
  v_refunded bigint;
  v_currency text;
  v_existing public.subscriptions%rowtype;
begin
  insert into public.payment_webhook_events(notification_id,event_type,occurred_at,payload)
  values (p_notification_id,p_event_type,p_occurred_at,p_payload)
  on conflict (notification_id) do nothing returning id into v_event_id;
  if v_event_id is null then return jsonb_build_object('ok',true,'duplicate',true); end if;

  if coalesce(v_custom->>'toolmodeon_intent_id','') ~* '^[0-9a-f-]{36}$' then v_intent_id := (v_custom->>'toolmodeon_intent_id')::uuid; end if;
  v_provider_sub_id := coalesce(v_data->>'subscription_id', case when p_event_type like 'subscription.%' then v_data->>'id' end);
  v_price_id := coalesce(v_data #>> '{items,0,price,id}',v_data #>> '{items,0,price_id}');
  v_provider_customer_id := v_data->>'customer_id';

  if v_intent_id is not null then
    select * into v_intent from public.checkout_intents where id=v_intent_id for update;
  end if;
  if v_intent.id is not null then
    v_user_id := v_intent.user_id; v_plan := v_intent.plan_key; v_interval := v_intent.billing_interval;
    if v_price_id is null or v_intent.provider_price_id <> v_price_id then raise exception 'Paddle price does not match checkout intent'; end if;
    if v_intent.status='pending' and v_intent.expires_at < p_occurred_at then raise exception 'Paddle checkout intent expired'; end if;
  elsif v_provider_sub_id is not null then
    select * into v_existing from public.subscriptions where provider_subscription_id=v_provider_sub_id for update;
    if v_existing.id is not null then v_user_id := v_existing.user_id; v_plan := v_existing.plan_key; v_interval := v_existing.billing_interval; end if;
  end if;

  if v_price_id is not null then
    select plan_key,case when monthly_paddle_price_id=v_price_id then 'month' else 'year' end
      into v_mapped_plan,v_mapped_interval from public.plan_entitlements
      where is_active and (monthly_paddle_price_id=v_price_id or yearly_paddle_price_id=v_price_id);
    if v_mapped_plan is not null then
      if v_intent.id is not null and v_mapped_plan <> v_intent.plan_key then raise exception 'Paddle plan does not match checkout intent'; end if;
      v_plan:=v_mapped_plan; v_interval:=v_mapped_interval;
    elsif v_intent.id is null and v_existing.id is not null and v_existing.provider_price_id is distinct from v_price_id then
      raise exception 'Paddle price does not match the stored subscription';
    end if;
  end if;

  if p_event_type='transaction.completed' then
    v_txn_id := v_data->>'id';
    if v_user_id is null or v_plan is null or v_txn_id is null then raise exception 'Completed transaction has no valid checkout intent'; end if;
    v_amount := coalesce((v_data #>> '{details,totals,total}')::bigint,0);
    v_currency := coalesce(v_data->>'currency_code','USD');
    insert into public.payments(user_id,provider_transaction_id,provider_subscription_id,amount_cents,currency,status,invoice_number,occurred_at)
      values (v_user_id,v_txn_id,v_provider_sub_id,v_amount,v_currency,'completed',v_data->>'invoice_number',p_occurred_at)
      on conflict (provider_transaction_id) do update set
        user_id=excluded.user_id,provider_subscription_id=coalesce(excluded.provider_subscription_id,payments.provider_subscription_id),
        amount_cents=excluded.amount_cents,currency=excluded.currency,status=case when payments.status in ('refunded','partially_refunded') then payments.status else 'completed' end,
        invoice_number=coalesce(excluded.invoice_number,payments.invoice_number),occurred_at=greatest(payments.occurred_at,excluded.occurred_at)
      where payments.occurred_at<=excluded.occurred_at;
    select coalesce(sum(nullif(latest.payload #>> '{data,totals,total}','')::bigint),0) into v_refunded
      from (select distinct on (payload #>> '{data,id}') payload
        from public.payment_webhook_events
        where event_type in ('adjustment.created','adjustment.updated')
          and payload #>> '{data,transaction_id}'=v_txn_id
          and payload #>> '{data,action}'='refund'
        order by payload #>> '{data,id}',occurred_at desc) latest
      where latest.payload #>> '{data,status}'='approved';
    update public.payments set refunded_amount_cents=least(amount_cents,v_refunded),
      status=case when v_refunded=0 then 'completed' when v_refunded>=amount_cents then 'refunded' else 'partially_refunded' end
      where provider_transaction_id=v_txn_id;
    if v_provider_sub_id is not null then
      insert into public.subscriptions(user_id,plan_key,provider_customer_id,provider_subscription_id,provider_price_id,billing_interval,status,provider_updated_at)
      values (v_user_id,v_plan,v_provider_customer_id,v_provider_sub_id,v_price_id,v_interval,'active',p_occurred_at)
      on conflict (provider_subscription_id) do update set
        plan_key=excluded.plan_key,provider_customer_id=coalesce(excluded.provider_customer_id,subscriptions.provider_customer_id),
        provider_price_id=coalesce(excluded.provider_price_id,subscriptions.provider_price_id),billing_interval=coalesce(excluded.billing_interval,subscriptions.billing_interval),
        status=case when subscriptions.status='trialing' then 'active' else subscriptions.status end,
        provider_updated_at=greatest(subscriptions.provider_updated_at,excluded.provider_updated_at),updated_at=now()
      returning id into v_sub_row;
      update public.payments set subscription_id=v_sub_row where provider_transaction_id=v_txn_id;
    end if;
    update public.checkout_intents set status='consumed',consumed_at=coalesce(consumed_at,now()) where id=v_intent_id;
  elsif p_event_type like 'subscription.%' then
    if v_data->>'status' in ('active','trialing','past_due','canceled','paused') then v_status := v_data->>'status';
    elsif p_event_type='subscription.activated' then v_status := 'active';
    elsif p_event_type='subscription.trialing' then v_status := 'trialing';
    elsif p_event_type='subscription.past_due' then v_status := 'past_due';
    elsif p_event_type='subscription.canceled' then v_status := 'canceled';
    elsif p_event_type='subscription.paused' then v_status := 'paused';
    else v_status := 'active'; end if;
    v_cancel := v_data #>> '{scheduled_change,action}' = 'cancel';
    v_period_start := nullif(v_data #>> '{current_billing_period,starts_at}','')::timestamptz;
    v_period_end := nullif(v_data #>> '{current_billing_period,ends_at}','')::timestamptz;
    v_next_bill := nullif(v_data->>'next_billed_at','')::timestamptz;
    if v_user_id is null or v_plan is null or v_provider_sub_id is null then raise exception 'Subscription event has no valid checkout intent or known subscription'; end if;
    insert into public.subscriptions(user_id,plan_key,provider_customer_id,provider_subscription_id,provider_price_id,billing_interval,status,current_period_starts_at,current_period_ends_at,next_billed_at,cancel_at_period_end,canceled_at,provider_updated_at)
    values (v_user_id,v_plan,v_provider_customer_id,v_provider_sub_id,v_price_id,v_interval,v_status,v_period_start,v_period_end,v_next_bill,v_cancel,nullif(v_data->>'canceled_at','')::timestamptz,p_occurred_at)
    on conflict (provider_subscription_id) do update set
      plan_key=excluded.plan_key,provider_customer_id=coalesce(excluded.provider_customer_id,subscriptions.provider_customer_id),
      provider_price_id=coalesce(excluded.provider_price_id,subscriptions.provider_price_id),billing_interval=coalesce(excluded.billing_interval,subscriptions.billing_interval),
      status=excluded.status,current_period_starts_at=excluded.current_period_starts_at,current_period_ends_at=excluded.current_period_ends_at,
      next_billed_at=excluded.next_billed_at,cancel_at_period_end=excluded.cancel_at_period_end,canceled_at=excluded.canceled_at,
      provider_updated_at=excluded.provider_updated_at,updated_at=now()
    where subscriptions.provider_updated_at <= excluded.provider_updated_at;
    update public.checkout_intents set status='consumed',consumed_at=coalesce(consumed_at,now()) where id=v_intent_id;
  elsif p_event_type in ('transaction.past_due','transaction.payment_failed','transaction.canceled') then
    v_txn_id:=v_data->>'id';
    if v_user_id is not null and v_txn_id is not null then
      v_amount:=coalesce((v_data #>> '{details,totals,total}')::bigint,0);
      v_currency:=coalesce(v_data->>'currency_code','USD');
      insert into public.payments(user_id,provider_transaction_id,provider_subscription_id,amount_cents,currency,status,invoice_number,occurred_at)
        values(v_user_id,v_txn_id,v_provider_sub_id,v_amount,v_currency,case when p_event_type='transaction.canceled' then 'canceled' else 'past_due' end,v_data->>'invoice_number',p_occurred_at)
        on conflict(provider_transaction_id) do update set
          status=case when payments.status in ('completed','refunded','partially_refunded') then payments.status else excluded.status end,
          occurred_at=greatest(payments.occurred_at,excluded.occurred_at);
    end if;
  elsif p_event_type in ('adjustment.created','adjustment.updated') then
    v_txn_id := v_data->>'transaction_id';
    if v_txn_id is not null and v_data->>'action'='refund' then
      select coalesce(sum(nullif(latest.payload #>> '{data,totals,total}','')::bigint),0) into v_amount
      from (
        select distinct on (payload #>> '{data,id}') payload
        from public.payment_webhook_events
        where event_type in ('adjustment.created','adjustment.updated')
          and payload #>> '{data,transaction_id}'=v_txn_id
          and payload #>> '{data,action}'='refund'
        order by payload #>> '{data,id}',occurred_at desc
      ) latest
      where latest.payload #>> '{data,status}'='approved';
      update public.payments set refunded_amount_cents=least(amount_cents,v_amount),status=case when v_amount=0 then 'completed' when v_amount>=amount_cents then 'refunded' else 'partially_refunded' end where provider_transaction_id=v_txn_id;
    end if;
  end if;
  return jsonb_build_object('ok',true,'event_id',v_event_id);
end;
$$;

create or replace function public.admin_overview_metrics(p_since timestamptz)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_users bigint;
  v_active_users bigint;
  v_free_users bigint;
  v_pro bigint;
  v_business bigint;
  v_subscriptions bigint;
  v_tool_runs bigint;
  v_ai_requests bigint;
  v_failed bigint;
  v_mrr bigint;
  v_payments jsonb;
begin
  select count(*) into v_users from public.profiles;
  select count(distinct user_id) into v_active_users from public.usage_events where created_at>=p_since;
  select count(*) filter (where latest.plan_key='pro'),count(*) filter (where latest.plan_key='business'),count(*),coalesce(sum(case when latest.billing_interval='year' then round(latest.yearly_price_cents::numeric/12) else latest.monthly_price_cents end),0)::bigint
    into v_pro,v_business,v_subscriptions,v_mrr
    from (select distinct on(s.user_id) s.user_id,s.plan_key,s.billing_interval,p.monthly_price_cents,p.yearly_price_cents
          from public.subscriptions s join public.plan_entitlements p on p.plan_key=s.plan_key
          where s.status in ('active','trialing') and (s.current_period_ends_at is null or s.current_period_ends_at>now()) and (s.status<>'trialing' or p.trials_enabled)
          order by s.user_id,s.updated_at desc) latest;
  select greatest(0,v_users-coalesce((select count(distinct s.user_id)
    from public.subscriptions s join public.plan_entitlements p on p.plan_key=s.plan_key
    where s.status in ('active','trialing') and (s.current_period_ends_at is null or s.current_period_ends_at>now()) and (s.status<>'trialing' or p.trials_enabled)),0)) into v_free_users;
  select count(*) into v_tool_runs from public.usage_events where event_type='tool_run' and created_at>=p_since;
  select count(*) into v_ai_requests from public.usage_events where event_type='ai_request' and created_at>=p_since;
  select count(*) into v_failed from public.processing_history where status='failed';
  select coalesce(jsonb_agg(jsonb_build_object('currency',currency,'amount_cents',amount_cents,'transaction_count',transaction_count) order by currency),'[]'::jsonb) into v_payments
    from (select currency,sum(greatest(0,amount_cents-refunded_amount_cents))::bigint amount_cents,count(*)::bigint transaction_count
          from public.payments where status in ('completed','partially_refunded','refunded') group by currency) totals;
  return jsonb_build_object('users',v_users,'activeUsers30d',v_active_users,'freeUsers',v_free_users,'proSubscribers',v_pro,'businessSubscribers',v_business,
    'activeSubscriptions',v_subscriptions,'toolUsage30d',v_tool_runs,'aiRequests30d',v_ai_requests,'monthlyRecurringRevenueCents',v_mrr,'failedProcessing',v_failed,'paymentsByCurrency',v_payments);
end;
$$;

create or replace function public.admin_affiliate_click_metrics()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('affiliate_link_id',stats.id,'clicks_30d',stats.clicks_30d,'clicks_90d',stats.clicks_90d) order by stats.created_at desc),'[]'::jsonb)
  from (select a.id,a.created_at,count(c.id) filter (where c.created_at>=now()-interval '30 days') clicks_30d,
          count(c.id) filter (where c.created_at>=now()-interval '90 days') clicks_90d
        from public.affiliate_links a left join public.affiliate_clicks c on c.affiliate_link_id=a.id group by a.id) stats
$$;

create or replace function public.team_usage_metrics(p_workspace_id uuid,p_since timestamptz)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'byTool',coalesce((select jsonb_agg(jsonb_build_object('tool_slug',usage_stats.tool_slug,'count',usage_stats.total) order by usage_stats.total desc)
      from (select e.tool_slug,count(*) total from public.usage_events e join public.team_members m on m.user_id=e.user_id
        where m.workspace_id=p_workspace_id and e.created_at>=p_since group by e.tool_slug) usage_stats),'[]'::jsonb),
    'byMember',coalesce((select jsonb_agg(jsonb_build_object('user_id',usage_stats.user_id,'count',usage_stats.total) order by usage_stats.total desc)
      from (select e.user_id,count(*) total from public.usage_events e join public.team_members m on m.user_id=e.user_id
        where m.workspace_id=p_workspace_id and e.created_at>=p_since group by e.user_id) usage_stats),'[]'::jsonb)
  )
$$;

create or replace function public.accept_team_invitation(p_user_id uuid,p_token_hash text)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  v_invitation public.team_invitations%rowtype;
  v_email text;
  v_owner uuid;
  v_cap integer;
  v_members integer;
begin
  select * into v_invitation from public.team_invitations where token_hash=p_token_hash for update;
  if v_invitation.id is null or v_invitation.accepted_at is not null or v_invitation.expires_at<=now() then return jsonb_build_object('ok',false,'reason','invitation_expired'); end if;
  select lower(email) into v_email from auth.users where id=p_user_id;
  if v_email is null or v_email<>lower(v_invitation.email) then return jsonb_build_object('ok',false,'reason','email_mismatch'); end if;
  perform pg_advisory_xact_lock(hashtextextended(v_invitation.workspace_id::text,1));
  select owner_user_id into v_owner from public.team_workspaces where id=v_invitation.workspace_id;
  select p.team_members into v_cap from public.subscriptions s join public.plan_entitlements p on p.plan_key=s.plan_key and p.is_active
    where s.user_id=v_owner and s.status in ('active','trialing') and (s.current_period_ends_at is null or s.current_period_ends_at>now()) and (s.status<>'trialing' or p.trials_enabled)
    order by s.updated_at desc limit 1;
  if v_cap is null or v_cap<2 then return jsonb_build_object('ok',false,'reason','business_plan_required'); end if;
  select count(*) into v_members from public.team_members where workspace_id=v_invitation.workspace_id;
  if v_members>=v_cap then return jsonb_build_object('ok',false,'reason','workspace_full'); end if;
  if exists(select 1 from public.team_members where user_id=p_user_id) then return jsonb_build_object('ok',false,'reason','already_in_workspace'); end if;
  insert into public.team_members(workspace_id,user_id,role) values(v_invitation.workspace_id,p_user_id,v_invitation.role);
  update public.team_invitations set accepted_at=now() where id=v_invitation.id;
  return jsonb_build_object('ok',true,'workspace_id',v_invitation.workspace_id);
end;
$$;

revoke all on function public.reserve_tool_usage(uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function public.reserve_tool_usage(uuid,uuid,text,text) to service_role;
revoke all on function public.take_rate_limit(text,integer,integer) from public, anon, authenticated;
grant execute on function public.take_rate_limit(text,integer,integer) to service_role;
revoke all on function public.process_paddle_webhook(text,text,timestamptz,jsonb) from public, anon, authenticated;
grant execute on function public.process_paddle_webhook(text,text,timestamptz,jsonb) to service_role;
revoke all on function public.accept_team_invitation(uuid,text) from public, anon, authenticated;
grant execute on function public.accept_team_invitation(uuid,text) to service_role;
revoke all on function public.admin_overview_metrics(timestamptz) from public, anon, authenticated;
grant execute on function public.admin_overview_metrics(timestamptz) to service_role;
revoke all on function public.admin_affiliate_click_metrics() from public, anon, authenticated;
grant execute on function public.admin_affiliate_click_metrics() to service_role;
revoke all on function public.team_usage_metrics(uuid,timestamptz) from public, anon, authenticated;
grant execute on function public.team_usage_metrics(uuid,timestamptz) to service_role;

grant select on public.billing_history to authenticated;
