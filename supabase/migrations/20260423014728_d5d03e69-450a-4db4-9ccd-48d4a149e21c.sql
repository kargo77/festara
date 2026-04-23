create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin new.updated_at = now(); return new; end;
$$;

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