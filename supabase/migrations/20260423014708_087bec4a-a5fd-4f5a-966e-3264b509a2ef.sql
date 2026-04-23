-- Roles enum
create type public.app_role as enum ('manager','organizer','visitor');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Profiles viewable by owner" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "Profiles updatable by owner" on public.profiles
  for update to authenticated using (auth.uid() = id);
create policy "Profiles insertable by owner" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

-- User roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique(user_id, role)
);
alter table public.user_roles enable row level security;

-- Security definer role check
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.current_user_has_role(_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(auth.uid(), _role)
$$;

create policy "Users view own roles" on public.user_roles
  for select to authenticated using (user_id = auth.uid());
create policy "Managers view all roles" on public.user_roles
  for select to authenticated using (public.has_role(auth.uid(),'manager'));
create policy "Managers insert roles" on public.user_roles
  for insert to authenticated with check (public.has_role(auth.uid(),'manager'));
create policy "Managers update roles" on public.user_roles
  for update to authenticated using (public.has_role(auth.uid(),'manager'));
create policy "Managers delete roles" on public.user_roles
  for delete to authenticated using (public.has_role(auth.uid(),'manager'));

-- Events
create table public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  capacity integer,
  cover_url text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.events enable row level security;
create index events_organizer_idx on public.events(organizer_id);
create index events_starts_idx on public.events(starts_at);

-- Anyone (incl. anon) can view published events
create policy "Anyone views published events" on public.events
  for select using (published = true);
create policy "Organizer views own events" on public.events
  for select to authenticated using (organizer_id = auth.uid());
create policy "Managers view all events" on public.events
  for select to authenticated using (public.has_role(auth.uid(),'manager'));
create policy "Organizers create own events" on public.events
  for insert to authenticated
  with check (organizer_id = auth.uid() and public.has_role(auth.uid(),'organizer'));
create policy "Organizer updates own events" on public.events
  for update to authenticated using (organizer_id = auth.uid() and public.has_role(auth.uid(),'organizer'));
create policy "Managers update any event" on public.events
  for update to authenticated using (public.has_role(auth.uid(),'manager'));
create policy "Organizer deletes own events" on public.events
  for delete to authenticated using (organizer_id = auth.uid() and public.has_role(auth.uid(),'organizer'));
create policy "Managers delete any event" on public.events
  for delete to authenticated using (public.has_role(auth.uid(),'manager'));

-- Registrations
create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(event_id, user_id)
);
alter table public.registrations enable row level security;
create index registrations_event_idx on public.registrations(event_id);
create index registrations_user_idx on public.registrations(user_id);

create policy "User views own registrations" on public.registrations
  for select to authenticated using (user_id = auth.uid());
create policy "Organizer views regs for own events" on public.registrations
  for select to authenticated using (
    exists (select 1 from public.events e where e.id = event_id and e.organizer_id = auth.uid())
  );
create policy "Managers view all registrations" on public.registrations
  for select to authenticated using (public.has_role(auth.uid(),'manager'));
create policy "Users register themselves" on public.registrations
  for insert to authenticated with check (user_id = auth.uid());
create policy "Users unregister themselves" on public.registrations
  for delete to authenticated using (user_id = auth.uid());
create policy "Managers delete any registration" on public.registrations
  for delete to authenticated using (public.has_role(auth.uid(),'manager'));

-- Notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
create index notifications_user_idx on public.notifications(user_id);

create policy "Users view own notifications" on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy "Users update own notifications" on public.notifications
  for update to authenticated using (user_id = auth.uid());
create policy "Organizer of event sends notifications" on public.notifications
  for insert to authenticated with check (
    event_id is null or exists (
      select 1 from public.events e where e.id = event_id and (e.organizer_id = auth.uid() or public.has_role(auth.uid(),'manager'))
    )
  );

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_events_updated before update on public.events
  for each row execute function public.set_updated_at();

-- New user trigger: create profile + assign chosen role (default visitor)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen_role public.app_role;
  raw_role text;
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email
  );

  raw_role := new.raw_user_meta_data ->> 'role';
  if raw_role in ('organizer','visitor') then
    chosen_role := raw_role::public.app_role;
  else
    chosen_role := 'visitor';
  end if;

  insert into public.user_roles (user_id, role) values (new.id, chosen_role);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Realtime
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.registrations;
alter publication supabase_realtime add table public.notifications;