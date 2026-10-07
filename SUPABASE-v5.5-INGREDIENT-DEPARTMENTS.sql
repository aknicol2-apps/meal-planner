-- Meal Planner v5.5: persistent shared department assignments for recipe ingredients
create table if not exists public.ingredient_departments (
  normalized_name text primary key,
  display_name text not null,
  category text not null,
  updated_at timestamptz not null default now()
);

alter table public.ingredient_departments enable row level security;
grant select, insert, update, delete on table public.ingredient_departments to anon;

drop policy if exists "Meal Planner ingredient departments read" on public.ingredient_departments;
drop policy if exists "Meal Planner ingredient departments insert" on public.ingredient_departments;
drop policy if exists "Meal Planner ingredient departments update" on public.ingredient_departments;
drop policy if exists "Meal Planner ingredient departments delete" on public.ingredient_departments;

create policy "Meal Planner ingredient departments read" on public.ingredient_departments
for select to anon using (public.meal_planner_access_ok());

create policy "Meal Planner ingredient departments insert" on public.ingredient_departments
for insert to anon with check (public.meal_planner_access_ok());

create policy "Meal Planner ingredient departments update" on public.ingredient_departments
for update to anon using (public.meal_planner_access_ok())
with check (public.meal_planner_access_ok());

create policy "Meal Planner ingredient departments delete" on public.ingredient_departments
for delete to anon using (public.meal_planner_access_ok());
