-- hoblie feedback form - Supabase schema
-- Run this in the Supabase SQL editor for your project.
-- The whole file is safe to run again in one go at any time: every
-- statement either uses IF NOT EXISTS or drops-then-recreates, so nothing
-- errors out partway through and silently skips the statements after it.

create extension if not exists pgcrypto;

create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- kit feedback (Aesthetic Clay Mirror)
  made_kit text,               -- 'yes' | 'not_yet'
  not_yet_reason text,         -- deprecated, replaced by not_yet_blocker/kit_location/not_yet_open_note
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

-- expanded question flow (tap-first, branched "not yet" path)
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

-- save-as-you-go (partial responses reach the database): the form writes
-- a row the moment someone answers their first question, and keeps
-- saving into the same row (matched by a client-generated id) as they
-- progress, so someone who closes the tab halfway still leaves real data
-- behind instead of nothing.
alter table public.responses add column if not exists completed boolean not null default false;
alter table public.responses add column if not exists last_screen text;
alter table public.responses add column if not exists updated_at timestamptz not null default now();

alter table public.responses enable row level security;

-- Anonymous visitors (the public form) get NO direct table access at all,
-- not even insert or select. The only thing they can do is call
-- save_response() below, a SECURITY DEFINER function that runs with
-- elevated privileges internally. This matters for a real reason: Postgres
-- needs SELECT-level visibility on a row to resolve "insert this, or
-- update it if it already exists" (an upsert) under RLS, and a broad
-- SELECT policy for anon would let anyone holding the public anon key
-- read every respondent's answers, contact details included. Routing
-- writes through this function avoids that entirely: anon can save a
-- response but can never read the table back.
revoke all on public.responses from anon;
grant select on public.responses to authenticated;

drop policy if exists "Public can insert responses" on public.responses;
drop policy if exists "Public can update their own in-progress response" on public.responses;

drop policy if exists "Authenticated users can read responses" on public.responses;
create policy "Authenticated users can read responses"
  on public.responses
  for select
  to authenticated
  using (true);

-- No delete policy is defined, so deletes stay blocked by RLS by default.

create or replace function public.save_response(payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.responses (
    id, completed, last_screen, updated_at,
    branch, made_kit, experience, liked_most,
    where_now, time_taken, alone_or_with,
    not_yet_blocker, kit_location, not_yet_open_note,
    point_of_entry, point_of_entry_detail, point_of_entry_order,
    process_or_output, process_or_output_detail,
    what_else_make, what_else_make_order,
    surrender_moment,
    how_it_felt, how_it_felt_order, feeling_detail,
    wall_reaction, wall_shows, wall_no_reason,
    call_interest, call_best_time,
    anything_else,
    age_band, city, occupation,
    name, phone, email, address,
    completion_seconds
  )
  values (
    (payload->>'id')::uuid,
    coalesce((payload->>'completed')::boolean, false),
    payload->>'last_screen',
    now(),
    payload->>'branch', payload->>'made_kit', payload->>'experience', payload->>'liked_most',
    payload->>'where_now', payload->>'time_taken', payload->>'alone_or_with',
    payload->>'not_yet_blocker', payload->>'kit_location', payload->>'not_yet_open_note',
    payload->>'point_of_entry', payload->>'point_of_entry_detail', payload->'point_of_entry_order',
    payload->>'process_or_output', payload->>'process_or_output_detail',
    payload->'what_else_make', payload->'what_else_make_order',
    payload->>'surrender_moment',
    payload->'how_it_felt', payload->'how_it_felt_order', payload->>'feeling_detail',
    payload->>'wall_reaction', payload->>'wall_shows', payload->>'wall_no_reason',
    (payload->>'call_interest')::boolean, payload->>'call_best_time',
    payload->>'anything_else',
    payload->>'age_band', payload->>'city', payload->>'occupation',
    payload->>'name', payload->>'phone', payload->>'email', payload->>'address',
    (payload->>'completion_seconds')::integer
  )
  on conflict (id) do update set
    completed              = excluded.completed,
    last_screen             = excluded.last_screen,
    updated_at              = now(),
    branch                  = excluded.branch,
    made_kit                = excluded.made_kit,
    experience              = excluded.experience,
    liked_most              = excluded.liked_most,
    where_now               = excluded.where_now,
    time_taken              = excluded.time_taken,
    alone_or_with           = excluded.alone_or_with,
    not_yet_blocker         = excluded.not_yet_blocker,
    kit_location            = excluded.kit_location,
    not_yet_open_note       = excluded.not_yet_open_note,
    point_of_entry          = excluded.point_of_entry,
    point_of_entry_detail   = excluded.point_of_entry_detail,
    point_of_entry_order    = excluded.point_of_entry_order,
    process_or_output       = excluded.process_or_output,
    process_or_output_detail = excluded.process_or_output_detail,
    what_else_make          = excluded.what_else_make,
    what_else_make_order    = excluded.what_else_make_order,
    surrender_moment        = excluded.surrender_moment,
    how_it_felt             = excluded.how_it_felt,
    how_it_felt_order       = excluded.how_it_felt_order,
    feeling_detail          = excluded.feeling_detail,
    wall_reaction           = excluded.wall_reaction,
    wall_shows              = excluded.wall_shows,
    wall_no_reason          = excluded.wall_no_reason,
    call_interest           = excluded.call_interest,
    call_best_time          = excluded.call_best_time,
    anything_else           = excluded.anything_else,
    age_band                = excluded.age_band,
    city                    = excluded.city,
    occupation              = excluded.occupation,
    name                    = excluded.name,
    phone                   = excluded.phone,
    email                   = excluded.email,
    address                 = excluded.address,
    completion_seconds      = excluded.completion_seconds
  where public.responses.completed = false; -- a completed row can never be edited again
end;
$$;

revoke all on function public.save_response(jsonb) from public;
grant execute on function public.save_response(jsonb) to anon;

-- Sanity check: should list exactly 1 row (the authenticated select policy).
select policyname, cmd, roles from pg_policies where tablename = 'responses';
