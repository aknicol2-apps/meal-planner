-- Meal Planner v5.4.1: shared order for grocery items within each department
alter table public.grocery_items
add column if not exists item_sort_order integer;

-- Give existing items a stable alphabetical starting order inside each department.
with ranked as (
  select id, row_number() over (partition by category order by name, id) * 10 as new_order
  from public.grocery_items
  where item_sort_order is null
)
update public.grocery_items g
set item_sort_order = ranked.new_order
from ranked
where g.id = ranked.id;

alter table public.grocery_items
alter column item_sort_order set default 1000;
