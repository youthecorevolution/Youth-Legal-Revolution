-- Apply after the existing 001_initial.sql schema is already present.
-- Reports remain private by default. Publication requires documented review.
alter table public.reports
  add column if not exists jurisdiction text not null default '',
  add column if not exists provision_citation text not null default '',
  add column if not exists reviewer text not null default '',
  add column if not exists reviewed_at date,
  add column if not exists sources jsonb not null default '[]'::jsonb;

alter table public.reports drop constraint if exists reports_publication_review_check;
alter table public.reports add constraint reports_publication_review_check check (
  review_status <> 'published' or (
    length(btrim(verified_findings)) > 0
    and length(btrim(jurisdiction)) > 0
    and length(btrim(provision_citation)) > 0
    and length(btrim(reviewer)) > 0
    and reviewed_at is not null
    and jsonb_typeof(sources) = 'array'
    and jsonb_array_length(sources) > 0
    and jsonb_typeof(evidence) = 'array'
    and jsonb_array_length(evidence) > 0
  )
);

drop policy if exists "Public reads reviewed reports" on public.reports;
create policy "Public reads reviewed reports" on public.reports
  for select to anon, authenticated
  using (review_status = 'published');

