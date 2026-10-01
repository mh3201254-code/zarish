-- ZARISH: initial schema, Row Level Security, storage.
-- Run in Supabase SQL editor (or `supabase db push`).
-- Prices are integer PKR. RLS is enabled on EVERY table.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- helpers
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------- tables
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Stable helper used by every admin policy.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '' check (char_length(description) <= 600),
  cover_image text check (cover_image is null or char_length(cover_image) <= 500),
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  name text not null check (char_length(name) between 1 and 140),
  description text not null default '' check (char_length(description) <= 4000),
  price integer not null check (price >= 0 and price <= 100000000),
  sale_price integer check (sale_price is null or (sale_price >= 0 and sale_price < price)),
  category_id uuid references public.categories (id) on delete set null,
  metal text not null default '' check (char_length(metal) <= 80),
  stone text not null default '' check (char_length(stone) <= 80),
  weight_grams numeric(8, 2) check (weight_grams is null or weight_grams >= 0),
  sizes text[] not null default '{}' check (cardinality(sizes) <= 20),
  stock integer not null default 0 check (stock >= 0 and stock <= 100000),
  featured boolean not null default false,
  published boolean not null default false,
  sort_order integer not null default 0,
  images text[] not null default '{}' check (cardinality(images) <= 12),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  ref text unique,
  customer_name text not null check (char_length(customer_name) between 2 and 120),
  phone text not null check (phone ~ '^[0-9+][0-9 +()-]{6,24}$'),
  address text not null check (char_length(address) between 6 and 400),
  city text not null default '' check (char_length(city) <= 80),
  notes text not null default '' check (char_length(notes) <= 600),
  payment_method text not null default 'cod' check (payment_method in ('cod', 'whatsapp')),
  items jsonb not null,
  subtotal integer not null default 0 check (subtotal >= 0),
  delivery_charge integer not null default 0 check (delivery_charge >= 0),
  total integer not null default 0 check (total >= 0),
  status text not null default 'new' check (status in ('new', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  admin_notes text not null default '' check (char_length(admin_notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null default '' check (char_length(email) <= 160 and (email = '' or email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  phone text not null default '' check (char_length(phone) <= 30),
  message text not null check (char_length(message) between 5 and 2000),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- key/value store. Everything here is PUBLIC (read by the storefront):
-- never store secrets in this table.
create table public.site_settings (
  key text primary key check (key ~ '^[a-z0-9_]+$' and char_length(key) <= 60),
  value text not null default '' check (char_length(value) <= 1000),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- indexes
create index products_category_idx on public.products (category_id);
create index products_published_idx on public.products (published, sort_order);
create index products_featured_idx on public.products (featured) where featured;
create index categories_sort_idx on public.categories (sort_order);
create index orders_status_idx on public.orders (status, created_at desc);
create index orders_phone_idx on public.orders (phone, created_at desc);
create index messages_read_idx on public.messages (is_read, created_at desc);
create index messages_email_idx on public.messages (email, created_at desc);

-- ---------------------------------------------------------------- triggers
create trigger categories_updated before update on public.categories
  for each row execute function public.set_updated_at();
create trigger products_updated before update on public.products
  for each row execute function public.set_updated_at();
create trigger orders_updated before update on public.orders
  for each row execute function public.set_updated_at();
create trigger settings_updated before update on public.site_settings
  for each row execute function public.set_updated_at();

-- Orders: never trust client prices. Rebuild items + totals from the
-- products table, add delivery from settings, set a short reference,
-- and rate limit (5 orders per phone per hour).
create or replace function public.orders_prepare()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  it jsonb;
  p record;
  qty integer;
  sub integer := 0;
  cleaned jsonb := '[]'::jsonb;
  dcharge integer := 0;
  free_above integer := 0;
  recent integer;
begin
  if jsonb_typeof(new.items) <> 'array'
     or jsonb_array_length(new.items) = 0
     or jsonb_array_length(new.items) > 50 then
    raise exception 'invalid items';
  end if;

  select count(*) into recent from public.orders
   where phone = new.phone and created_at > now() - interval '1 hour';
  if recent >= 5 then
    raise exception 'rate limit exceeded';
  end if;

  for it in select * from jsonb_array_elements(new.items) loop
    qty := (it ->> 'qty')::integer;
    if qty is null or qty < 1 or qty > 20 then
      raise exception 'invalid quantity';
    end if;
    select id, name, slug, price, sale_price into p
      from public.products
     where id = (it ->> 'id')::uuid and published;
    if not found then
      raise exception 'product unavailable';
    end if;
    sub := sub + coalesce(p.sale_price, p.price) * qty;
    cleaned := cleaned || jsonb_build_object(
      'id', p.id, 'name', p.name, 'slug', p.slug,
      'unit_price', coalesce(p.sale_price, p.price),
      'qty', qty,
      'size', left(coalesce(it ->> 'size', ''), 20)
    );
  end loop;

  select coalesce(nullif(regexp_replace(value, '\D', '', 'g'), '')::integer, 0)
    into dcharge from public.site_settings where key = 'delivery_charge';
  select coalesce(nullif(regexp_replace(value, '\D', '', 'g'), '')::integer, 0)
    into free_above from public.site_settings where key = 'free_delivery_above';
  dcharge := coalesce(dcharge, 0);
  free_above := coalesce(free_above, 0);
  if free_above > 0 and sub >= free_above then
    dcharge := 0;
  end if;

  new.items := cleaned;
  new.subtotal := sub;
  new.delivery_charge := dcharge;
  new.total := sub + dcharge;
  new.ref := 'ZR-' || upper(substr(replace(new.id::text, '-', ''), 1, 6));
  if not public.is_admin() then
    new.status := 'new';
    new.admin_notes := '';
  end if;
  return new;
end $$;

create trigger orders_prepare_ins before insert on public.orders
  for each row execute function public.orders_prepare();

-- Messages: rate limit (5 per email/phone per hour).
create or replace function public.messages_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare recent integer;
begin
  select count(*) into recent from public.messages
   where created_at > now() - interval '1 hour'
     and ((new.email <> '' and email = new.email) or (new.phone <> '' and phone = new.phone));
  if recent >= 5 then
    raise exception 'rate limit exceeded';
  end if;
  if not public.is_admin() then
    new.is_read := false;
  end if;
  return new;
end $$;

create trigger messages_guard_ins before insert on public.messages
  for each row execute function public.messages_guard();

-- ---------------------------------------------------------------- RLS
alter table public.admins enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.messages enable row level security;
alter table public.site_settings enable row level security;

-- admins: a signed-in user may read only their own row (used by the admin
-- login guard). Only existing admins may manage the list.
create policy admins_read_self on public.admins
  for select to authenticated using (user_id = auth.uid());
create policy admins_manage on public.admins
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- public storefront reads
create policy categories_public_read on public.categories
  for select to anon, authenticated using (published);
create policy products_public_read on public.products
  for select to anon, authenticated using (published);
create policy settings_public_read on public.site_settings
  for select to anon, authenticated using (true);

-- public inserts (validated by CHECK constraints + triggers above)
create policy orders_public_insert on public.orders
  for insert to anon, authenticated
  with check (status = 'new' and admin_notes = '');
create policy messages_public_insert on public.messages
  for insert to anon, authenticated
  with check (is_read = false);

-- admin: full access to everything
create policy categories_admin_all on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy products_admin_all on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy orders_admin_all on public.orders
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy messages_admin_all on public.messages
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy settings_admin_all on public.site_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Table privileges: anon gets the minimum, RLS does the rest.
revoke all on public.admins, public.categories, public.products,
  public.orders, public.messages, public.site_settings from anon, authenticated;
grant select on public.categories, public.products, public.site_settings to anon;
grant insert on public.orders, public.messages to anon;
grant select, insert, update, delete on public.admins, public.categories,
  public.products, public.orders, public.messages, public.site_settings to authenticated;

-- ---------------------------------------------------------------- storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880,
        array['image/webp', 'image/jpeg', 'image/png', 'image/avif'])
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/webp', 'image/jpeg', 'image/png', 'image/avif'];

create policy product_images_public_read on storage.objects
  for select to anon, authenticated using (bucket_id = 'product-images');
create policy product_images_admin_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
create policy product_images_admin_update on storage.objects
  for update to authenticated using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());
create policy product_images_admin_delete on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());

-- ---------------------------------------------------------------- defaults
insert into public.site_settings (key, value) values
  ('whatsapp_number', '923000000000'),
  ('announcement', 'Complimentary delivery on orders above PKR 25,000'),
  ('hero_title', 'Gold, worn for generations'),
  ('hero_subtitle', 'Bridal sets and everyday fine jewellery, finished by hand and delivered across Pakistan.'),
  ('instagram', 'https://instagram.com/'),
  ('facebook', 'https://facebook.com/'),
  ('phone', '+92 300 0000000'),
  ('delivery_charge', '500'),
  ('free_delivery_above', '25000'),
  ('stat_years', '12'),
  ('stat_customers', '4800'),
  ('stat_pieces', '1200')
on conflict (key) do nothing;
