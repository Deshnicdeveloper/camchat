-- CamChat Supabase Storage RLS policies
-- =====================================
-- This app authenticates with FIREBASE, not Supabase Auth. Every request to
-- Supabase Storage uses the anon key and has NO Supabase user (auth.uid() is
-- null). CamChat's storage policies are therefore simple, bucket_id-based
-- rules with no cross-table lookups. They are correct and are NOT the bug.
--
-- ROOT CAUSE of "StorageApiError: The database schema is invalid or
-- incompatible." (Postgres 42P17):
-- ---------------------------------------------------------------------------
-- The ndame app shares THIS Supabase project. ndame added policies to the
-- shared storage.objects table, e.g.:
--
--   "ndame owner uploads cover" (INSERT) WITH CHECK
--     (bucket_id = 'ndame-restaurant-covers' AND EXISTS (
--        SELECT 1 FROM ndame_restaurants
--        WHERE owner_id = auth.uid()
--          AND (storage.foldername(ndame_restaurants.name))[1] = ndame_restaurants.id::text))
--
-- That EXISTS references only ndame_restaurants + auth.uid() and NOT the row
-- being inserted, so it is an UNCORRELATED subquery. Postgres evaluates it as
-- an InitPlan: ONCE per statement, for EVERY insert into storage.objects -
-- including CamChat's chat-media uploads. Evaluating it reads ndame_restaurants,
-- which triggers RLS on ndame_restaurants, which chains into ndame_profiles,
-- whose RLS policy is infinitely recursive -> 42P17 -> Storage reports the
-- schema as "invalid or incompatible". A chat-media upload thus fails because
-- of ndame's broken RLS, not anything in CamChat.
--
-- FIX (run in Supabase Dashboard > SQL Editor, camchat project):
--   1. Immediate unblock: drop ndame's WRITE policies from storage.objects
--      (see "ndame cleanup" below). This removes the InitPlan subqueries from
--      CamChat's upload path.
--   2. Proper fix: repair the recursive RLS policy on ndame_profiles (move the
--      self-lookup into a SECURITY DEFINER function), then recreate ndame's
--      storage policies CORRELATED to the inserted row so they don't run as
--      InitPlans for other buckets.
--   3. Best: give ndame its OWN Supabase project so the two apps never share
--      the storage.objects table and its RLS again.

-- ---------------------------------------------------------------------------
-- ndame cleanup (immediate unblock for CamChat uploads)
-- ---------------------------------------------------------------------------
drop policy if exists "ndame owner uploads cover"          on storage.objects;
drop policy if exists "ndame owner uploads logo"           on storage.objects;
drop policy if exists "ndame owner uploads meal photo"     on storage.objects;
drop policy if exists "ndame owner deletes own cover"      on storage.objects;
drop policy if exists "ndame owner deletes own logo"       on storage.objects;
drop policy if exists "ndame owner deletes own meal photo" on storage.objects;

-- ---------------------------------------------------------------------------
-- CamChat's clean, non-recursive policies (idempotent - safe to re-run).
-- These already exist in the project; included here as the source of truth.
-- ---------------------------------------------------------------------------
drop policy if exists "camchat public read"   on storage.objects;
drop policy if exists "camchat public insert" on storage.objects;
drop policy if exists "camchat public update" on storage.objects;
drop policy if exists "camchat public delete" on storage.objects;

create policy "camchat public read" on storage.objects
  for select
  using (bucket_id in ('avatars', 'chat-media', 'voice-notes', 'statuses'));

create policy "camchat public insert" on storage.objects
  for insert
  with check (bucket_id in ('avatars', 'chat-media', 'voice-notes', 'statuses'));

create policy "camchat public update" on storage.objects
  for update
  using (bucket_id in ('avatars', 'chat-media', 'voice-notes', 'statuses'));

create policy "camchat public delete" on storage.objects
  for delete
  using (bucket_id in ('avatars', 'chat-media', 'voice-notes', 'statuses'));

-- Note: creating buckets requires the service role, not the anon key, so the
-- app's ensureStorageBuckets() may log "new row violates row-level security
-- policy for table buckets" - harmless when the buckets already exist.
