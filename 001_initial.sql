-- Apply with Supabase SQL editor or Supabase CLI. RLS is enabled on every table.
create extension if not exists pgcrypto;
create table public.admin_users(user_id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz not null default now());
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.admin_users where user_id=auth.uid());
$$;
alter table public.admin_users enable row level security;
create policy "Admins see admin list" on public.admin_users for select to authenticated using (public.is_admin());
create table public.categories(id uuid primary key default gen_random_uuid(), name text not null unique, slug text not null unique, created_at timestamptz not null default now());
alter table public.categories enable row level security;
create policy "Public reads categories" on public.categories for select using (true);
create policy "Admins manage categories" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create table public.articles(id uuid primary key default gen_random_uuid(), title text not null, slug text not null unique, category text, excerpt text not null default '', body text not null default '', seo_title text, seo_description text, status text not null default 'draft' check(status in ('draft','published','archived')), published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.articles enable row level security;
create policy "Public reads published articles" on public.articles for select using(status='published');
create policy "Admins manage articles" on public.articles for all to authenticated using(public.is_admin()) with check(public.is_admin());
create table public.pages(id uuid primary key default gen_random_uuid(), title text not null, slug text not null unique, body text not null default '', seo_title text, seo_description text, status text not null default 'draft' check(status in ('draft','published','archived')), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.pages enable row level security;
create policy "Public reads published pages" on public.pages for select using(status='published');
create policy "Admins manage pages" on public.pages for all to authenticated using(public.is_admin()) with check(public.is_admin());
create table public.reports(id uuid primary key default gen_random_uuid(), title text not null, slug text unique, summary text not null default '', allegation text not null default '', evidence jsonb not null default '[]', legal_analysis text not null default '', obligation text not null default '', responsible_authority text not null default '', review_status text not null default 'unreviewed' check(review_status in ('unreviewed','in_review','response_requested','verified','not_substantiated','published','withdrawn')), verified_findings text not null default '', response text not null default '', disclaimer text not null default 'Allegations are unverified unless explicitly identified as verified findings.', seo_title text, seo_description text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.reports enable row level security;
-- Reports are private until a reviewed publication flow is deliberately implemented.
create policy "Admins manage reports" on public.reports for all to authenticated using(public.is_admin()) with check(public.is_admin());
create table public.media_assets(id uuid primary key default gen_random_uuid(), object_path text not null, alt_text text not null default '', created_at timestamptz not null default now());
alter table public.media_assets enable row level security;
create policy "Admins manage media records" on public.media_assets for all to authenticated using(public.is_admin()) with check(public.is_admin());
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('media','media',true,5242880,array['image/jpeg','image/png','image/webp','image/avif']) on conflict(id) do nothing;
create policy "Public read media" on storage.objects for select using(bucket_id='media');
create policy "Admin upload media" on storage.objects for insert to authenticated with check(bucket_id='media' and public.is_admin());
create policy "Admin update media" on storage.objects for update to authenticated using(bucket_id='media' and public.is_admin()) with check(bucket_id='media' and public.is_admin());
create policy "Admin delete media" on storage.objects for delete to authenticated using(bucket_id='media' and public.is_admin());
