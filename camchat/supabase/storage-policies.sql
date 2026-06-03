-- CamChat Supabase Storage RLS policies
-- =====================================
-- This app authenticates with FIREBASE, not Supabase Auth. That means every
-- request to Supabase Storage uses the anon key and has NO Supabase user
-- (auth.uid() is null). Therefore storage policies MUST be simple, bucket_id
-- based rules. They must NEVER look up a user/profile table.
--
-- Why this file exists:
-- A storage.objects policy that sub-queried another table (ndame_profiles,
-- which itself had a recursive RLS policy) caused every upload to fail with:
--   StorageApiError: The database schema is invalid or incompatible.
--   (Postgres 42P17 / "infinite recursion detected in policy")
-- These policies have zero cross-table references, so they cannot recurse.
--
-- Run this in: Supabase Dashboard > SQL Editor (against the camchat project).

-- 1) Inspect current policies first (find any that reference a user/profile table):
--    select policyname, cmd, qual, with_check
--    from pg_policies where schemaname = 'storage' and tablename = 'objects';

-- 2) Drop any pre-existing custom policies on storage.objects before recreating.
--    Replace the names below with whatever Step 1 returned.
-- drop policy if exists "<old policy name>" on storage.objects;

-- 3) Clean, non-recursive public policies for the four CamChat buckets.
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

-- Note: buckets are expected to already exist (avatars, chat-media,
-- voice-notes, statuses) and be marked public. Creating buckets requires the
-- service role, not the anon key, so the app's ensureStorageBuckets() call may
-- log "new row violates row-level security policy for table buckets" - that is
-- harmless when the buckets already exist.
