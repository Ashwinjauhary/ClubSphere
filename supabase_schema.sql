-- ==========================================
-- 0. CLEANUP (DROP EVERYTHING)
-- ==========================================
-- Use this section to reset the database. 
-- WARNING: This destroys all data.

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.is_dean() cascade;
drop function if exists public.is_club_admin(uuid) cascade;

drop table if exists public.notifications cascade;
drop table if exists public.club_applications cascade;
drop table if exists public.reports cascade;
drop table if exists public.events cascade;
drop table if exists public.club_members cascade;
drop table if exists public.clubs cascade;
drop table if exists public.profiles cascade;

drop type if exists public.notification_type;
drop type if exists public.application_status;
drop type if exists public.member_role;
drop type if exists public.event_status;
drop type if exists public.app_role;

-- ==========================================
-- 1. SETUP & EXTENSIONS
-- ==========================================
create extension if not exists "uuid-ossp";

-- ==========================================
-- 2. ENUMS & TYPES
-- ==========================================
create type app_role as enum ('student', 'admin', 'dean');
create type event_status as enum ('draft', 'pending', 'approved', 'rejected', 'completed');
create type member_role as enum ('member', 'lead');
create type application_status as enum ('pending', 'approved', 'rejected');
create type notification_type as enum ('info', 'success', 'warning', 'error');

-- ==========================================
-- 3. TABLES
-- ==========================================

-- PROFILES (Syncs with auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  role app_role default 'student'::app_role,
  avatar_url text,
  updated_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CLUBS
create table public.clubs (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  description text,
  logo_url text,
  banner_url text,
  category text,
  founded_year integer,
  admin_id uuid references public.profiles(id), -- The Club Lead
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CLUB MEMBERSHIPS
create table public.club_members (
  id uuid default uuid_generate_v4() primary key,
  club_id uuid references public.clubs(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role member_role default 'member'::member_role,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(club_id, user_id)
);

-- CLUB APPLICATIONS (New)
create table public.club_applications (
  id uuid default uuid_generate_v4() primary key,
  club_id uuid references public.clubs(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status application_status default 'pending'::application_status not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(club_id, user_id)
);

-- EVENTS
create table public.events (
  id uuid default uuid_generate_v4() primary key,
  club_id uuid references public.clubs(id) on delete cascade not null,
  title text not null,
  description text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  location text,
  poster_url text,
  status event_status default 'pending'::event_status not null,
  budget numeric default 0,
  expected_attendees integer,
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  rejection_reason text
);

-- REPORTS (For Analytics/AI)
create table public.reports (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  submitted_by uuid references public.profiles(id),
  content text not null,
  attendee_count integer,
  highlights text,
  challenges text,
  ai_feedback jsonb, -- Stores the AI analysis result
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- NOTIFICATIONS (New)
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  type notification_type default 'info'::notification_type,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 4. FUNCTIONS & TRIGGERS
-- ==========================================

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'student');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper to check if user is a Dean
create or replace function public.is_dean()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'dean'
  );
end;
$$ language plpgsql security definer;

-- Helper to check if user is Admin of a specific club
create or replace function public.is_club_admin(club_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.clubs
    where id = club_id and admin_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- ==========================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.club_applications enable row level security;
alter table public.events enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;

-- PROFILES
create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- CLUBS
create policy "Clubs are viewable by everyone"
  on public.clubs for select using (true);

create policy "Deans can insert clubs"
  on public.clubs for insert with check (public.is_dean());

create policy "Admins can update their own club"
  on public.clubs for update using (admin_id = auth.uid() or public.is_dean());

-- CLUB MEMBERS
create policy "Memberships viewable by everyone"
  on public.club_members for select using (true);

create policy "Users can join clubs"
  on public.club_members for insert with check (auth.uid() = user_id);

create policy "Users can leave clubs"
  on public.club_members for delete using (auth.uid() = user_id);

-- CLUB APPLICATIONS
create policy "Users can view their own applications"
  on public.club_applications for select using (auth.uid() = user_id);

create policy "Club Admins can view applications for their club"
  on public.club_applications for select using (public.is_club_admin(club_id));

create policy "Users can create applications"
  on public.club_applications for insert with check (auth.uid() = user_id);

create policy "Club Admins can update application status"
  on public.club_applications for update using (public.is_club_admin(club_id));

-- EVENTS
create policy "Approved events are viewable by everyone"
  on public.events for select using (status = 'approved' or status = 'completed');

create policy "Club Admins and Deans can view all events for their scope"
  on public.events for select using (
    auth.uid() = created_by 
    or public.is_club_admin(club_id) 
    or public.is_dean()
  );

create policy "Club Admins can create events"
  on public.events for insert with check (
    public.is_club_admin(club_id) or public.is_dean()
  );

create policy "Club Admins can update their pending events"
  on public.events for update using (
    (public.is_club_admin(club_id) and status = 'pending')
    or public.is_dean()
  );

-- REPORTS
create policy "Deans and Club Admins can view reports"
  on public.reports for select using (
    public.is_dean() 
    or exists (select 1 from public.events where events.id = reports.event_id and public.is_club_admin(events.club_id))
  );

create policy "Club Admins can create reports"
  on public.reports for insert with check (
    exists (select 1 from public.events where events.id = reports.event_id and public.is_club_admin(events.club_id))
  );

-- NOTIFICATIONS
create policy "Users can view their own notifications"
  on public.notifications for select using (auth.uid() = user_id);

create policy "System/admins can create notifications"
  on public.notifications for insert with check (true); -- Ideally restrict to triggers or admin roles, but keeping flexible for now

-- ==========================================
-- 6. REALTIME
-- ==========================================
-- Add tables to the publication to enable real-time subscriptions
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;

alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.clubs;
alter publication supabase_realtime add table public.reports;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.club_applications;


-- ==========================================
-- 7. STORAGE
-- ==========================================
insert into storage.buckets (id, name, public) 
values ('club-media', 'club-media', true)
on conflict (id) do nothing;

drop policy if exists "Public Access" on storage.objects;
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'club-media' );

drop policy if exists "Auth Upload" on storage.objects;
create policy "Auth Upload"
  on storage.objects for insert
  with check ( bucket_id = 'club-media' and auth.role() = 'authenticated' );

-- ==========================================
-- 8. QUERY PERFORMANCE (Indexes)
-- ==========================================
create index if not exists idx_events_club_id on public.events(club_id);
create index if not exists idx_events_status on public.events(status);
create index if not exists idx_clubs_admin_id on public.clubs(admin_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_applications_club_id on public.club_applications(club_id);
