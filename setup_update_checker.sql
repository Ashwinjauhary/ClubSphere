-- Create table for tracking app versions
create table if not exists public.app_versions (
  id uuid default gen_random_uuid() primary key,
  version text not null,
  download_url text not null,
  force_update boolean default false,
  release_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.app_versions enable row level security;

-- Allow read access to everyone (authenticated and anonymous)
create policy "Allow public read access"
  on public.app_versions for select
  using (true);

-- Allow write access only to admins (you can refine this based on your auth model)
-- For now, we'll assume manual insertion via Supabase Dashboard or authenticated admin
create policy "Allow admin insert"
  on public.app_versions for insert
  with check (auth.role() = 'authenticated'); 
