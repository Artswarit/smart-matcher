create table public.screening_results (
  id uuid primary key default gen_random_uuid(),
  job_description text not null,
  candidates jsonb not null,
  resume_count integer not null default 0,
  top_score integer,
  created_at timestamptz not null default now()
);

alter table public.screening_results enable row level security;

create policy "Anyone can insert screening results"
  on public.screening_results for insert
  to anon, authenticated
  with check (true);

create policy "Anyone can read screening results"
  on public.screening_results for select
  to anon, authenticated
  using (true);