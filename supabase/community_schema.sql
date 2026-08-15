-- hoblie community form - Supabase schema
-- Run this in the Supabase SQL editor for your project, as one query,
-- top to bottom. This is a separate table from the Aesthetic Clay Mirror
-- feedback form (public.responses) - the two forms never share data.
-- The whole file is safe to run again at any time: every statement either
-- uses IF NOT EXISTS or drops-then-recreates, so nothing errors out
-- partway through and silently skips the statements after it.

create extension if not exists pgcrypto;

create table if not exists public.community_responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  completed boolean not null default false,
  last_screen text,
  updated_at timestamptz not null default now(),

  -- identifies who was sent this link (appended to the URL, e.g. ?key=...)
  -- so a completed or partial response can be matched back to a customer
  -- even though the form itself never asks for name, phone or email.
  source_key text,

  identity_type text,          -- 'artist_craftsperson' | 'arts_crafts_enthusiast' | 'hobbyist' | 'just_like_making' | 'none_of_these'
  brand_recall text,           -- 'yes_know_it' | 'vaguely' | 'no_just_bought'
  product_tried text,          -- 'craft_materials' | 'diy_kits' | 'dont_remember'

  use_case jsonb,              -- multi-select

  buy_channel text,
  value_pref text,

  proxy_hobbies jsonb,         -- multi-select, randomised order shown
  proxy_hobbies_order jsonb,

  keep_or_give text,
  alone_or_with2 text,
  point_of_entry2 text,
  why_make text,
  tell_people text,

  traits2 jsonb,               -- multi-select, randomised order shown
  traits2_order jsonb,

  difficulty_pref text,

  projective_ideas jsonb,      -- multi-select
  projective_ideas_detail text,

  age_band text,
  occupation text,
  occupation_detail text,

  community_opt_in text,       -- 'yes_im_in' | 'maybe_later' | 'keep_me_posted'

  completion_seconds integer
);

alter table public.community_responses enable row level security;

-- Anonymous visitors (the public form) get NO direct table access at all,
-- not even insert or select. The only thing they can do is call
-- save_community_response() below, a SECURITY DEFINER function that runs
-- with elevated privileges internally, for the same reason as the other
-- form's schema: Postgres needs SELECT-level visibility to resolve an
-- upsert's conflict check, and a public SELECT policy for anon would let
-- anyone holding the public key read every respondent's answers.
revoke all on public.community_responses from anon;
grant select on public.community_responses to authenticated;

drop policy if exists "Authenticated users can read community responses" on public.community_responses;
create policy "Authenticated users can read community responses"
  on public.community_responses
  for select
  to authenticated
  using (true);

-- No delete policy is defined, so deletes stay blocked by RLS by default.

create or replace function public.save_community_response(payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.community_responses (
    id, completed, last_screen, updated_at, source_key,
    identity_type, brand_recall, product_tried,
    use_case,
    buy_channel, value_pref,
    proxy_hobbies, proxy_hobbies_order,
    keep_or_give, alone_or_with2, point_of_entry2, why_make, tell_people,
    traits2, traits2_order,
    difficulty_pref,
    projective_ideas, projective_ideas_detail,
    age_band, occupation, occupation_detail,
    community_opt_in,
    completion_seconds
  )
  values (
    (payload->>'id')::uuid,
    coalesce((payload->>'completed')::boolean, false),
    payload->>'last_screen',
    now(),
    payload->>'source_key',
    payload->>'identity_type', payload->>'brand_recall', payload->>'product_tried',
    payload->'use_case',
    payload->>'buy_channel', payload->>'value_pref',
    payload->'proxy_hobbies', payload->'proxy_hobbies_order',
    payload->>'keep_or_give', payload->>'alone_or_with2', payload->>'point_of_entry2', payload->>'why_make', payload->>'tell_people',
    payload->'traits2', payload->'traits2_order',
    payload->>'difficulty_pref',
    payload->'projective_ideas', payload->>'projective_ideas_detail',
    payload->>'age_band', payload->>'occupation', payload->>'occupation_detail',
    payload->>'community_opt_in',
    (payload->>'completion_seconds')::integer
  )
  on conflict (id) do update set
    completed                = excluded.completed,
    last_screen               = excluded.last_screen,
    updated_at                = now(),
    source_key                = excluded.source_key,
    identity_type              = excluded.identity_type,
    brand_recall                = excluded.brand_recall,
    product_tried               = excluded.product_tried,
    use_case                    = excluded.use_case,
    buy_channel                 = excluded.buy_channel,
    value_pref                  = excluded.value_pref,
    proxy_hobbies                = excluded.proxy_hobbies,
    proxy_hobbies_order           = excluded.proxy_hobbies_order,
    keep_or_give                  = excluded.keep_or_give,
    alone_or_with2                = excluded.alone_or_with2,
    point_of_entry2               = excluded.point_of_entry2,
    why_make                      = excluded.why_make,
    tell_people                   = excluded.tell_people,
    traits2                       = excluded.traits2,
    traits2_order                 = excluded.traits2_order,
    difficulty_pref               = excluded.difficulty_pref,
    projective_ideas              = excluded.projective_ideas,
    projective_ideas_detail       = excluded.projective_ideas_detail,
    age_band                      = excluded.age_band,
    occupation                    = excluded.occupation,
    occupation_detail             = excluded.occupation_detail,
    community_opt_in              = excluded.community_opt_in,
    completion_seconds            = excluded.completion_seconds
  where public.community_responses.completed = false; -- a completed row can never be edited again
end;
$$;

revoke all on function public.save_community_response(jsonb) from public;
grant execute on function public.save_community_response(jsonb) to anon;

-- Sanity check: should list exactly 1 row (the authenticated select policy).
select policyname, cmd, roles from pg_policies where tablename = 'community_responses';
