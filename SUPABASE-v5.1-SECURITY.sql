-- Meal Planner v5.1 household access security
-- BEFORE RUNNING: replace CHANGE-THIS-TO-YOUR-OWN-CODE below with a private code
-- known only to A and J. Do not send that code to ChatGPT or commit it to GitHub.

create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;

create table if not exists private.meal_planner_access (
  id integer primary key check (id = 1),
  key_hash text not null
);

insert into private.meal_planner_access (id, key_hash)
values (1, encode(extensions.digest('CHANGE-THIS-TO-YOUR-OWN-CODE', 'sha256'), 'hex'))
on conflict (id) do update set key_hash = excluded.key_hash;

create or replace function public.meal_planner_access_ok()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.meal_planner_access
    where key_hash = encode(
      extensions.digest(
        coalesce((current_setting('request.headers', true)::json ->> 'x-household-key'), ''),
        'sha256'
      ),
      'hex'
    )
  );
$$;

revoke all on function public.meal_planner_access_ok() from public;
grant execute on function public.meal_planner_access_ok() to anon;

drop policy if exists "Meal Planner read" on public.meal_preferences;
drop policy if exists "Meal Planner insert" on public.meal_preferences;
drop policy if exists "Meal Planner update" on public.meal_preferences;

create policy "Meal Planner read"
on public.meal_preferences for select to anon
using (public.meal_planner_access_ok());

create policy "Meal Planner insert"
on public.meal_preferences for insert to anon
with check (public.meal_planner_access_ok());

create policy "Meal Planner update"
on public.meal_preferences for update to anon
using (public.meal_planner_access_ok())
with check (public.meal_planner_access_ok());
