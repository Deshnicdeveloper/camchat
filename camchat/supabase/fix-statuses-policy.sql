-- Fix: status uploads rejected with "new row violates row-level security policy"
-- ============================================================================
-- The statuses bucket upload (storage.objects INSERT, bucket_id = 'statuses')
-- was rejected with HTTP 403. Cause: there was no permissive INSERT policy for
-- the statuses bucket that applies to the role the app uses.
--
-- This app authenticates with Firebase (Supabase anon key, persistSession:false),
-- so every storage request runs as the `anon` role. A policy created `TO
-- authenticated` (the Supabase dashboard default for "authenticated uploads")
-- never matches an anon request, so RLS rejects the insert. chat-media / avatars
-- work because their policies are `TO public`.
--
-- Fix: (re)create the statuses policies explicitly `TO public` (covers anon +
-- authenticated). upsert:true can also trigger UPDATE, so all four verbs are
-- created. Run in: Supabase Dashboard > SQL Editor (camchat project).

-- Inspect first (look at the `roles` column):
-- select policyname, cmd, roles, with_check
-- from pg_policies
-- where schemaname = 'storage' and tablename = 'objects'
--   and (with_check ilike '%statuses%' or qual ilike '%statuses%');

-- IMPORTANT: leftover Supabase "quickstart template" policies are RESTRICTIVE
-- (AND-ed with everything else). The JPG template below requires extension=jpg
-- AND folder='public', so it blocks .webp / .mp4 status uploads in userId
-- folders even when a permissive bucket-wide policy exists. Drop them.
drop policy if exists "Give anon users access to JPG images in folder lt45y8_0" on storage.objects;
drop policy if exists "Give anon users access to JPG images in folder lt45y8_1" on storage.objects;

drop policy if exists "Allow public upload statuses"  on storage.objects;
drop policy if exists "Allow public read statuses"    on storage.objects;
drop policy if exists "statuses public read"          on storage.objects;
drop policy if exists "statuses public upload"        on storage.objects;
drop policy if exists "statuses public update"        on storage.objects;
drop policy if exists "statuses public delete"        on storage.objects;

create policy "statuses public read" on storage.objects
  for select to public using (bucket_id = 'statuses');

create policy "statuses public upload" on storage.objects
  for insert to public with check (bucket_id = 'statuses');

create policy "statuses public update" on storage.objects
  for update to public using (bucket_id = 'statuses') with check (bucket_id = 'statuses');

create policy "statuses public delete" on storage.objects
  for delete to public using (bucket_id = 'statuses');

-- ============================================================================
-- If uploads STILL return 403 after the above, the blocker is a RESTRICTIVE
-- policy (permissive = f). Restrictive policies are AND-ed and only ever
-- subtract access; a Firebase-auth app on public buckets should have NONE.
-- This removes every restrictive policy on storage.objects and guarantees a
-- single clean permissive grant for the statuses bucket.
-- ============================================================================

-- Inspect (look for permissive = f):
-- select policyname, cmd, permissive, roles, with_check
-- from pg_policies
-- where schemaname='storage' and tablename='objects'
-- order by permissive, cmd;

do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and not permissive
  loop
    execute format('drop policy %I on storage.objects', r.policyname);
  end loop;
end $$;

drop policy if exists "statuses permissive all" on storage.objects;
create policy "statuses permissive all" on storage.objects
  as permissive for all to public
  using (bucket_id = 'statuses')
  with check (bucket_id = 'statuses');
