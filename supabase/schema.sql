-- hoblie feedback form - Supabase schema
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
  first_time_story text,       -- deprecated, replaced by point_of_entry
  process_or_output text,
  surrender_moment text,
  feeling text,                -- deprecated, replaced by how_it_felt
  wall_reaction text,          -- 'definitely' | 'maybe' | 'not_really'
  wall_display text,           -- deprecated, replaced by wall_shows
  call_interest boolean,
  call_best_time text,

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

-- ---------------------------------------------------------------------
-- Migration: expanded question flow (tap-first, branched "not yet" path)
-- Safe to run on the existing live project: only adds nullable columns,
-- does not touch or drop any existing rows. Also safe to run on a brand
-- new project (the create table above already ran first in that case).
-- ---------------------------------------------------------------------

alter table public.responses add column if not exists branch text;                    -- 'made' | 'not_yet'
alter table public.responses add column if not exists where_now text;
alter table public.responses add column if not exists time_taken text;
alter table public.responses add column if not exists alone_or_with text;

alter table public.responses add column if not exists not_yet_blocker text;
alter table public.responses add column if not exists kit_location text;
alter table public.responses add column if not exists not_yet_open_note text;

alter table public.responses add column if not exists point_of_entry text;
alter table public.responses add column if not exists point_of_entry_detail text;
alter table public.responses add column if not exists point_of_entry_order jsonb;

alter table public.responses add column if not exists process_or_output_detail text;

alter table public.responses add column if not exists what_else_make jsonb;
alter table public.responses add column if not exists what_else_make_order jsonb;

alter table public.responses add column if not exists how_it_felt jsonb;
alter table public.responses add column if not exists how_it_felt_order jsonb;
alter table public.responses add column if not exists feeling_detail text;

alter table public.responses add column if not exists wall_shows text;
alter table public.responses add column if not exists wall_no_reason text;

alter table public.responses add column if not exists age_band text;
alter table public.responses add column if not exists city text;
alter table public.responses add column if not exists occupation text;

alter table public.responses add column if not exists completion_seconds integer;

-- ---------------------------------------------------------------------
-- Migration: save-as-you-go (partial responses reach the database)
-- The form now writes a row the moment someone answers their first
-- question, and keeps upserting the same row (matched by a client-
-- generated id) as they progress, so someone who closes the tab
-- halfway still leaves real data behind instead of nothing.
-- ---------------------------------------------------------------------

alter table public.responses add column if not exists completed boolean not null default false;
alter table public.responses add column if not exists last_screen text;
alter table public.responses add column if not exists updated_at timestamptz not null default now();

-- The client sets its own id (a random UUID generated in the browser) so
-- repeated upserts land on the same row instead of creating duplicates.
-- Anon can only update rows that are still in progress: once a row is
-- marked completed it becomes read-only to anon (the same insert/update
-- call that finishes the form is what sets completed = true, so this
-- never blocks a legitimate submission, only re-editing after the fact).
-- Anon has no select access (see policy above), so in practice a row's id
-- can't be discovered or targeted by anyone other than the browser that
-- created it.
create policy "Public can update their own in-progress response"
  on public.responses
  for update
  to anon
  using (completed = false)
  with check (true);
