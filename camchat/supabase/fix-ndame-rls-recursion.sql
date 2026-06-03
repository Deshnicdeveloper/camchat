-- Fix: infinite recursion in ndame_profiles RLS (Postgres 42P17)
-- ===============================================================
-- Symptom (camchat): every Supabase Storage upload failed with
--   "StorageApiError: The database schema is invalid or incompatible."
--
-- Root cause: ndame shares this Supabase project. ndame_profiles had RLS
-- policies that query ndame_profiles itself:
--
--   "ndame admins read all profiles" (SELECT) USING
--     EXISTS (SELECT 1 FROM ndame_profiles p
--             WHERE p.id = auth.uid() AND p.role = 'admin')
--
--   "ndame users update own profile" (UPDATE) WITH CHECK
--     ... role = (SELECT role FROM ndame_profiles WHERE id = auth.uid()) ...
--
-- Reading/updating ndame_profiles evaluates these policies, which read
-- ndame_profiles, which evaluate the policies again -> infinite recursion.
-- ndame_restaurants, ndame_meals, and ndame's storage.objects policies all
-- SELECT from ndame_profiles, so the recursion poisoned the shared
-- storage.objects table and broke camchat uploads too.
--
-- Fix: read the current user's profile via SECURITY DEFINER helper functions
-- (which bypass RLS), so the policies no longer self-reference.
--
-- Run in: Supabase Dashboard > SQL Editor (camchat project).

-- 1) RLS-bypassing helpers -----------------------------------------------------
create or replace function public.ndame_current_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.ndame_profiles where id = auth.uid();
$$;

create or replace function public.ndame_current_active()
returns boolean language sql stable security definer set search_path = public as $$
  select active from public.ndame_profiles where id = auth.uid();
$$;

revoke all on function public.ndame_current_role()   from public;
revoke all on function public.ndame_current_active() from public;
grant execute on function public.ndame_current_role()   to anon, authenticated;
grant execute on function public.ndame_current_active() to anon, authenticated;

-- 2) Non-recursive ndame_profiles policies ------------------------------------
drop policy if exists "ndame admins read all profiles" on public.ndame_profiles;
create policy "ndame admins read all profiles" on public.ndame_profiles
  for select using (public.ndame_current_role() = 'admin');

drop policy if exists "ndame users update own profile" on public.ndame_profiles;
create policy "ndame users update own profile" on public.ndame_profiles
  for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role   = public.ndame_current_role()
    and active = public.ndame_current_active()
  );

-- "ndame users read own profile" (auth.uid() = id) is already non-recursive; keep it.

-- 3) OPTIONAL: corrected ndame storage write policies -------------------------
-- The originals compared storage.foldername(ndame_restaurants.name) (the
-- restaurant's NAME column) and were uncorrelated, so Postgres evaluated them
-- as InitPlans on EVERY storage.objects insert (including camchat). These
-- correlate to the inserted object's `name` and only fire for ndame buckets.
-- Confirm your folder convention is <bucket>/<restaurant_id>/<file> first.
--
-- drop policy if exists "ndame owner uploads cover" on storage.objects;
-- create policy "ndame owner uploads cover" on storage.objects
--   for insert with check (
--     bucket_id = 'ndame-restaurant-covers'
--     and exists (select 1 from public.ndame_restaurants r
--                 where r.id::text = (storage.foldername(name))[1]
--                   and r.owner_id = auth.uid()));
-- (repeat for logos, meal photos, and the matching DELETE policies)

-- LONG TERM: move ndame to its own Supabase project so the two apps never
-- share the storage.objects table and its RLS again.
