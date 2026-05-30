-- Profile avatars: public `profile` bucket + storage RLS.
--
-- The bucket may already exist (created in the dashboard); this makes it public
-- so getPublicUrl() works, then scopes writes to each user's own folder
-- (`<auth.uid()>/...`). Reads are public. Avatar URLs are stored on
-- public.users.avatar_url by the app (see web/lib/avatar.ts).

-- 1. Ensure the bucket exists and is public.
insert into storage.buckets (id, name, public)
values ('profile', 'profile', true)
on conflict (id) do update set public = true;

-- 2. Policies on storage.objects for the `profile` bucket.
--    Dropped first so this migration is safe to re-run.

drop policy if exists "profile avatars are publicly readable" on storage.objects;
create policy "profile avatars are publicly readable"
  on storage.objects for select
  using (bucket_id = 'profile');

drop policy if exists "users upload their own avatar" on storage.objects;
create policy "users upload their own avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'profile'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users update their own avatar" on storage.objects;
create policy "users update their own avatar"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'profile'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'profile'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users delete their own avatar" on storage.objects;
create policy "users delete their own avatar"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'profile'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
