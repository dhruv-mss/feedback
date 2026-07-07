-- hoblie feedback form — Supabase schema
-- Run this in the Supabase SQL editor for your project.

create extension if not exists pgcrypto;

create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- kit feedback (Aesthetic Clay Mirror)
  made_kit text,               -- 'yes' | 'not_yet'
  not_yet_reason text,
  experience text,             -- 'loved' | 'fine' | 'not_for_me'
  liked_most text,
  anything_else text,

  -- deeper questions
  first_time_story text,       -- Q5
  process_or_output text,      -- Q6
  surrender_moment text,       -- Q7
  feeling text,                -- Q8
  wall_reaction text,          -- Q9a: 'definitely' | 'maybe' | 'not_really'
  wall_display text,           -- Q9b
  call_interest boolean,       -- Q10
  call_best_time text,         -- Q10

  -- contact / gift
  name text,
  phone text,
  email text,
  address text
);

alter table public.responses enable row level security;

-- Anyone (the public form, using the anon key) can submit a response.
create policy "Public can insert responses"
  on public.responses
  for insert
  to anon
  with check (true);

-- Only signed-in users (the admin) can read responses.
create policy "Authenticated users can read responses"
  on public.responses
  for select
  to authenticated
  using (true);

-- No update/delete policies are defined, so both are blocked by RLS by default.
