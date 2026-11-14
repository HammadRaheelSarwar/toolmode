-- Local repo inspection found no existing Supabase migrations/schema. All DDL is additive/idempotent.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  tool_slug text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, tool_slug)
);

create table if not exists public.processing_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tool_slug text not null,
  status text not null check (status in ('completed', 'failed')),
  original_filename text,
  output_filename text,
  output_mime_type text,
  output_size_bytes bigint check (output_size_bytes is null or output_size_bytes >= 0),
  output_storage_path text,
  output_expires_at timestamptz,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  processing_history_id uuid references public.processing_history(id) on delete set null,
  file_name text not null check (char_length(file_name) between 1 and 255),
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  storage_path text,
  text_content text,
  created_at timestamptz not null default now(),
  constraint project_files_project_owner_fk foreign key (project_id, user_id)
    references public.projects(id, user_id) on delete cascade,
  constraint project_files_content_source_ck check (
    (storage_path is not null and text_content is null) or
    (storage_path is null and text_content is not null)
  ),
  unique (storage_path)
);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists processing_history_user_processed_idx
  on public.processing_history(user_id, processed_at desc);
create index if not exists projects_user_updated_idx
  on public.projects(user_id, updated_at desc);
create index if not exists project_files_project_created_idx
  on public.project_files(project_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_toolmodeon_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  insert into public.user_preferences (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at before update on public.projects
for each row execute function public.set_updated_at();
drop trigger if exists user_preferences_set_updated_at on public.user_preferences;
create trigger user_preferences_set_updated_at before update on public.user_preferences
for each row execute function public.set_updated_at();
drop trigger if exists on_auth_user_created_toolmodeon on auth.users;
create trigger on_auth_user_created_toolmodeon after insert on auth.users
for each row execute function public.handle_new_toolmodeon_user();

alter table public.profiles enable row level security;
alter table public.favorites enable row level security;
alter table public.processing_history enable row level security;
alter table public.projects enable row level security;
alter table public.project_files enable row level security;
alter table public.user_preferences enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert to authenticated with check (id = (select auth.uid()));
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists favorites_select_own on public.favorites;
create policy favorites_select_own on public.favorites for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists favorites_insert_own on public.favorites;
create policy favorites_insert_own on public.favorites for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists favorites_delete_own on public.favorites;
create policy favorites_delete_own on public.favorites for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists processing_history_select_own on public.processing_history;
create policy processing_history_select_own on public.processing_history for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists processing_history_insert_own on public.processing_history;
create policy processing_history_insert_own on public.processing_history for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists processing_history_update_own on public.processing_history;
create policy processing_history_update_own on public.processing_history for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists processing_history_delete_own on public.processing_history;
create policy processing_history_delete_own on public.processing_history for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists projects_all_own on public.projects;
create policy projects_all_own on public.projects for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists project_files_all_own on public.project_files;
create policy project_files_all_own on public.project_files for all to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid()) and
  (processing_history_id is null or exists (
    select 1 from public.processing_history h
    where h.id = processing_history_id and h.user_id = (select auth.uid())
  ))
);
drop policy if exists user_preferences_all_own on public.user_preferences;
create policy user_preferences_all_own on public.user_preferences for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Private bucket: object names always begin with the authenticated user's UUID.
insert into storage.buckets (id, name, public, file_size_limit)
values ('project-outputs', 'project-outputs', false, 26214400)
on conflict (id) do nothing;
drop policy if exists project_outputs_select_own on storage.objects;
create policy project_outputs_select_own on storage.objects for select to authenticated
using (bucket_id = 'project-outputs' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists project_outputs_insert_own on storage.objects;
create policy project_outputs_insert_own on storage.objects for insert to authenticated
with check (bucket_id = 'project-outputs' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists project_outputs_delete_own on storage.objects;
create policy project_outputs_delete_own on storage.objects for delete to authenticated
using (bucket_id = 'project-outputs' and (storage.foldername(name))[1] = (select auth.uid())::text);
