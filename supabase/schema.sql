-- Ember & Salt — Complete Supabase SQL Script
-- Run this once in your Supabase Dashboard -> SQL Editor -> New query.

-- 1. Categories Table
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- 2. Food Items Table
create table if not exists public.food_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text not null default '',
  price numeric(10, 2) not null check (price >= 0),
  image_url text not null default '',
  prep_time_minutes integer not null default 15 check (prep_time_minutes > 0),
  dietary_note text default '',
  is_available boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Orders Table (WhatsApp Checkout Logs)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  customer_name text not null,
  customer_phone text not null,
  delivery_type text not null check (delivery_type in ('delivery', 'pickup')),
  delivery_address text default '',
  notes text default '',
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(10, 2) not null default 0,
  delivery_fee numeric(10, 2) not null default 0,
  total_amount numeric(10, 2) not null default 0,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'preparing', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

-- 4. Contact & Catering Messages Table
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text default '',
  subject text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- 5. Store Settings Table (Single Row Configuration)
create table if not exists public.store_settings (
  id integer primary key default 1 check (id = 1),
  kitchen_name text not null default 'Ember & Salt',
  whatsapp_number text not null default '09027481035',
  address text not null default 'Ako Palace Express, No. 2 Ojiaka Street, Lagos',
  opening_hours text not null default 'Monday - Friday · 7:00am - 10:00pm',
  delivery_fee numeric(10, 2) not null default 1500.00,
  free_delivery_threshold numeric(10, 2) not null default 25000.00,
  updated_at timestamptz not null default now()
);

-- 6. Automatic updated_at Triggers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_food_items_updated_at on public.food_items;
create trigger trg_food_items_updated_at
before update on public.food_items
for each row execute function public.set_updated_at();

drop trigger if exists trg_store_settings_updated_at on public.store_settings;
create trigger trg_store_settings_updated_at
before update on public.store_settings
for each row execute function public.set_updated_at();

-- 7. Enable Row Level Security (RLS)
alter table public.categories enable row level security;
alter table public.food_items enable row level security;
alter table public.orders enable row level security;
alter table public.contact_messages enable row level security;
alter table public.store_settings enable row level security;

-- Public Read Policies
drop policy if exists "Public can view categories" on public.categories;
create policy "Public can view categories"
on public.categories for select
to anon, authenticated
using (true);

drop policy if exists "Public can view food items" on public.food_items;
create policy "Public can view food items"
on public.food_items for select
to anon, authenticated
using (true);

drop policy if exists "Public can view store settings" on public.store_settings;
create policy "Public can view store settings"
on public.store_settings for select
to anon, authenticated
using (true);

-- Public Insert Policies (Customer Orders & Contact Form)
drop policy if exists "Public can submit orders" on public.orders;
create policy "Public can submit orders"
on public.orders for insert
to anon, authenticated
with check (true);

drop policy if exists "Public can submit contact messages" on public.contact_messages;
create policy "Public can submit contact messages"
on public.contact_messages for insert
to anon, authenticated
with check (true);

-- Authenticated Admin Full Access Policies (when using Supabase Auth)
drop policy if exists "Authenticated admins manage categories" on public.categories;
create policy "Authenticated admins manage categories"
on public.categories for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated admins manage food items" on public.food_items;
create policy "Authenticated admins manage food items"
on public.food_items for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated admins manage orders" on public.orders;
create policy "Authenticated admins manage orders"
on public.orders for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated admins view messages" on public.contact_messages;
create policy "Authenticated admins view messages"
on public.contact_messages for select
to authenticated
using (true);

drop policy if exists "Authenticated admins manage store settings" on public.store_settings;
create policy "Authenticated admins manage store settings"
on public.store_settings for all
to authenticated
using (true)
with check (true);

-- 8. Password-Only Admin RPC Functions (Password: Mamaputnigeria)
create or replace function public.assert_admin_password(p_password text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(p_password, '') <> 'Mamaputnigeria' then
    raise exception 'Invalid admin password';
  end if;
end;
$$;

create or replace function public.verify_admin_password(p_password text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(p_password, '') = 'Mamaputnigeria';
$$;

-- Categories CRUD RPCs
create or replace function public.admin_upsert_category(
  p_password text,
  p_id uuid default null,
  p_name text default '',
  p_slug text default '',
  p_description text default '',
  p_sort_order integer default 0
)
returns public.categories
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.categories;
begin
  perform public.assert_admin_password(p_password);

  if p_id is null then
    insert into public.categories (name, slug, description, sort_order)
    values (trim(p_name), trim(p_slug), coalesce(trim(p_description), ''), coalesce(p_sort_order, 0))
    returning * into v_row;
  else
    update public.categories
    set
      name = trim(p_name),
      slug = trim(p_slug),
      description = coalesce(trim(p_description), ''),
      sort_order = coalesce(p_sort_order, 0)
    where id = p_id
    returning * into v_row;
  end if;

  return v_row;
end;
$$;

create or replace function public.admin_delete_category(p_password text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin_password(p_password);
  delete from public.categories where id = p_id;
end;
$$;

-- Food Items CRUD RPCs
create or replace function public.admin_upsert_food_item(
  p_password text,
  p_id uuid default null,
  p_category_id uuid default null,
  p_name text default '',
  p_slug text default '',
  p_description text default '',
  p_price numeric default 0,
  p_image_url text default '',
  p_prep_time_minutes integer default 15,
  p_dietary_note text default '',
  p_is_available boolean default true,
  p_is_featured boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.food_items;
  v_cat_name text;
begin
  perform public.assert_admin_password(p_password);

  if p_id is null then
    insert into public.food_items (
      category_id, name, slug, description, price, image_url,
      prep_time_minutes, dietary_note, is_available, is_featured
    )
    values (
      p_category_id, trim(p_name), trim(p_slug), coalesce(trim(p_description), ''),
      p_price, coalesce(trim(p_image_url), ''), greatest(1, coalesce(p_prep_time_minutes, 15)),
      coalesce(trim(p_dietary_note), ''), coalesce(p_is_available, true), coalesce(p_is_featured, false)
    )
    returning * into v_row;
  else
    update public.food_items
    set
      category_id = p_category_id,
      name = coalesce(nullif(trim(p_name), ''), name),
      description = coalesce(p_description, description),
      price = coalesce(p_price, price),
      image_url = coalesce(p_image_url, image_url),
      prep_time_minutes = greatest(1, coalesce(p_prep_time_minutes, prep_time_minutes)),
      dietary_note = coalesce(p_dietary_note, dietary_note),
      is_available = coalesce(p_is_available, is_available),
      is_featured = coalesce(p_is_featured, is_featured)
    where id = p_id
    returning * into v_row;
  end if;

  select name into v_cat_name from public.categories where id = v_row.category_id;

  return to_jsonb(v_row) || jsonb_build_object('categories', jsonb_build_object('name', v_cat_name));
end;
$$;

create or replace function public.admin_toggle_food_availability(
  p_password text,
  p_id uuid,
  p_is_available boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.food_items;
  v_cat_name text;
begin
  perform public.assert_admin_password(p_password);

  update public.food_items
  set is_available = p_is_available
  where id = p_id
  returning * into v_row;

  select name into v_cat_name from public.categories where id = v_row.category_id;

  return to_jsonb(v_row) || jsonb_build_object('categories', jsonb_build_object('name', v_cat_name));
end;
$$;

create or replace function public.admin_delete_food_item(p_password text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin_password(p_password);
  delete from public.food_items where id = p_id;
end;
$$;

-- Orders & Messages Admin RPCs
create or replace function public.admin_get_orders(p_password text)
returns setof public.orders
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin_password(p_password);
  return query select * from public.orders order by created_at desc;
end;
$$;

create or replace function public.admin_update_order_status(
  p_password text,
  p_id uuid,
  p_status text
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.orders;
begin
  perform public.assert_admin_password(p_password);
  update public.orders set status = p_status where id = p_id returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.admin_get_contact_messages(p_password text)
returns setof public.contact_messages
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin_password(p_password);
  return query select * from public.contact_messages order by created_at desc;
end;
$$;

-- Store Settings Admin RPC
create or replace function public.admin_update_store_settings(
  p_password text,
  p_kitchen_name text,
  p_whatsapp_number text,
  p_address text,
  p_opening_hours text,
  p_delivery_fee numeric,
  p_free_delivery_threshold numeric
)
returns public.store_settings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.store_settings;
begin
  perform public.assert_admin_password(p_password);

  insert into public.store_settings (
    id, kitchen_name, whatsapp_number, address, opening_hours, delivery_fee, free_delivery_threshold
  )
  values (
    1, trim(p_kitchen_name), trim(p_whatsapp_number), trim(p_address),
    trim(p_opening_hours), p_delivery_fee, p_free_delivery_threshold
  )
  on conflict (id) do update set
    kitchen_name = excluded.kitchen_name,
    whatsapp_number = excluded.whatsapp_number,
    address = excluded.address,
    opening_hours = excluded.opening_hours,
    delivery_fee = excluded.delivery_fee,
    free_delivery_threshold = excluded.free_delivery_threshold
  returning * into v_row;

  return v_row;
end;
$$;

-- Grant execute permissions on RPCs to anon and authenticated roles
grant execute on function public.verify_admin_password(text) to anon, authenticated;
grant execute on function public.admin_upsert_category(text, uuid, text, text, text, integer) to anon, authenticated;
grant execute on function public.admin_delete_category(text, uuid) to anon, authenticated;
grant execute on function public.admin_upsert_food_item(text, uuid, uuid, text, text, text, numeric, text, integer, text, boolean, boolean) to anon, authenticated;
grant execute on function public.admin_toggle_food_availability(text, uuid, boolean) to anon, authenticated;
grant execute on function public.admin_delete_food_item(text, uuid) to anon, authenticated;
grant execute on function public.admin_get_orders(text) to anon, authenticated;
grant execute on function public.admin_update_order_status(text, uuid, text) to anon, authenticated;
grant execute on function public.admin_get_contact_messages(text) to anon, authenticated;
grant execute on function public.admin_update_store_settings(text, text, text, text, text, numeric, numeric) to anon, authenticated;

-- 9. Storage Bucket for Dish Photography
insert into storage.buckets (id, name, public)
values ('food-images', 'food-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can read food images" on storage.objects;
create policy "Public can read food images"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'food-images');

drop policy if exists "Authenticated admins upload food images" on storage.objects;
create policy "Authenticated admins upload food images"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'food-images');

drop policy if exists "Authenticated admins update food images" on storage.objects;
create policy "Authenticated admins update food images"
on storage.objects for update
to anon, authenticated
using (bucket_id = 'food-images');

drop policy if exists "Authenticated admins delete food images" on storage.objects;
create policy "Authenticated admins delete food images"
on storage.objects for delete
to anon, authenticated
using (bucket_id = 'food-images');

-- 10. Default Store Settings & Categories Seed
insert into public.store_settings (id, kitchen_name, whatsapp_number, address, opening_hours, delivery_fee, free_delivery_threshold)
values (
  1,
  'Ember & Salt',
  '09027481035',
  'Ako Palace Express, No. 2 Ojiaka Street, Lagos',
  'Monday - Friday · 7:00am - 10:00pm',
  1500.00,
  25000.00
)
on conflict (id) do nothing;

insert into public.categories (name, slug, description, sort_order)
values
  ('Wood-Fired Mains', 'wood-fired-mains', 'Oak-ember roasted cuts, wild seafood, and hearth specialties.', 1),
  ('Handmade Pasta', 'handmade-pasta', 'Fresh daily extruded and hand-cut pasta with seasonal sauces.', 2),
  ('Harvest Bowls', 'harvest-bowls', 'Charred seasonal vegetables, heirloom grains, and vibrant dressings.', 3),
  ('Hearth Burgers', 'hearth-burgers', 'Dry-aged grass-fed patties on house-baked toasted brioche.', 4),
  ('Patisserie & Desserts', 'patisserie-desserts', 'Small-batch sweet finishes crafted in our pastry kitchen.', 5)
on conflict (slug) do nothing;

-- Reload PostgREST schema cache immediately
notify pgrst, 'reload schema';

