-- Meal Planner v5.3.2: share selected meals and meal-ingredient choices across devices
create table if not exists public.shopping_state (
  id integer primary key check (id = 1),
  selected_meals jsonb not null default '[]'::jsonb,
  buy_items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.shopping_state enable row level security;

grant select, insert, update on table public.shopping_state to anon;

drop policy if exists "Meal Planner shopping state read" on public.shopping_state;
drop policy if exists "Meal Planner shopping state insert" on public.shopping_state;
drop policy if exists "Meal Planner shopping state update" on public.shopping_state;

create policy "Meal Planner shopping state read" on public.shopping_state
for select to anon using (public.meal_planner_access_ok());

create policy "Meal Planner shopping state insert" on public.shopping_state
for insert to anon with check (public.meal_planner_access_ok());

create policy "Meal Planner shopping state update" on public.shopping_state
for update to anon using (public.meal_planner_access_ok()) with check (public.meal_planner_access_ok());
