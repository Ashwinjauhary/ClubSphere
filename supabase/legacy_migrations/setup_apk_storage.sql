-- 1. Create the 'apk-releases' bucket (Public)
insert into storage.buckets (id, name, public)
values ('apk-releases', 'apk-releases', true)
on conflict (id) do nothing;

-- 2. Allow Public Read Access
-- (Using unique name to avoid "policy already exists" error)
drop policy if exists "Public Access apk-releases" on storage.objects;
create policy "Public Access apk-releases"
  on storage.objects for select
  using ( bucket_id = 'apk-releases' );

-- 3. Allow Authenticated Users (Admins) to Upload
drop policy if exists "Authenticated Upload apk-releases" on storage.objects;
create policy "Authenticated Upload apk-releases"
  on storage.objects for insert
  with check ( auth.role() = 'authenticated' AND bucket_id = 'apk-releases' );

-- 4. Allow Authenticated Users (Admins) to Update/Delete
drop policy if exists "Authenticated Update/Delete apk-releases" on storage.objects;
create policy "Authenticated Update/Delete apk-releases"
  on storage.objects for update
  using ( auth.role() = 'authenticated' AND bucket_id = 'apk-releases' );

drop policy if exists "Authenticated Delete apk-releases" on storage.objects;
create policy "Authenticated Delete apk-releases"
  on storage.objects for delete
  using ( auth.role() = 'authenticated' AND bucket_id = 'apk-releases' );
