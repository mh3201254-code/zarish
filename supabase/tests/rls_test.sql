-- ZARISH RLS test suite. Run AFTER 001_init.sql and seed.sql.
--
-- Local Postgres (with Supabase-style auth/storage stubs): see README "Test RLS".
-- On a real Supabase project you can paste this into the SQL editor; it creates
-- two throw-away users' ids (no auth.users rows needed for the checks below,
-- except the admins FK, so it inserts a temporary row when the table is writable).
--
-- Every check prints PASS or FAIL. Any FAIL means a policy is wrong.

create or replace function public.t_try(sql text) returns text language plpgsql as $$
begin
  execute sql;
  return 'ok';
exception when others then
  return 'fail: ' || sqlerrm;
end $$;

create or replace function public.t_count(sql text) returns bigint language plpgsql as $$
declare n bigint;
begin
  execute 'select count(*) from (' || sql || ') s' into n;
  return n;
exception when others then
  return -1; -- error (for example permission denied)
end $$;

create or replace function public.t_check(name text, passed boolean) returns void language plpgsql as $$
begin
  raise notice '% : %', case when passed then 'PASS' else 'FAIL' end, name;
  if not passed then raise exception 'RLS test failed: %', name; end if;
end $$;

grant execute on function public.t_try(text), public.t_count(text), public.t_check(text, boolean) to anon, authenticated;

-- fixtures (run as table owner, bypassing RLS)
-- clear leftovers from any earlier interrupted run
delete from public.orders where customer_name in ('Test Buyer', 'Spam');
delete from public.messages where email = 'v@example.com';
delete from public.products where slug in ('t-hidden-draft', 't-admin-made');
delete from storage.objects where name in ('ok.webp');
delete from public.admins;
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'admin@example.com'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'customer@example.com')
on conflict do nothing;
insert into public.admins (user_id) values ('aaaaaaaa-0000-4000-8000-000000000001');

insert into public.products (slug, name, price, published, stock)
values ('t-hidden-draft', 'Hidden draft', 1000, false, 1) on conflict do nothing;

-- ---------------------------------------------------------------- ANON
set role anon;
select set_config('request.jwt.claims', '', false);

select public.t_check('anon sees published products only',
  (select public.t_count('select 1 from public.products where published = false') = 0
      and public.t_count('select 1 from public.products where published') > 0));
select public.t_check('anon can read published categories', public.t_count('select 1 from public.categories') > 0);
select public.t_check('anon can read site_settings', public.t_count('select 1 from public.site_settings') > 0);
select public.t_check('anon cannot insert products', public.t_try($$insert into public.products (slug,name,price) values ('x','x',1)$$) like 'fail%');
select public.t_check('anon cannot update products', public.t_try($$update public.products set price = 1$$) like 'fail%');
select public.t_check('anon cannot delete products', public.t_try($$delete from public.products$$) like 'fail%');
select public.t_check('anon cannot write categories', public.t_try($$insert into public.categories (slug,name) values ('x','x')$$) like 'fail%');
select public.t_check('anon cannot write settings', public.t_try($$update public.site_settings set value = 'hacked'$$) like 'fail%');
select public.t_check('anon cannot read orders', public.t_count('select 1 from public.orders') = -1);
select public.t_check('anon cannot read messages', public.t_count('select 1 from public.messages') = -1);
select public.t_check('anon cannot read admins', public.t_count('select 1 from public.admins') = -1);

select public.t_check('anon can place an order (prices come from the database)',
  public.t_try(format($$insert into public.orders (customer_name, phone, address, items, total, subtotal)
    values ('Test Buyer', '03001234567', '12 Test Street, Karachi',
            '[{"id":"%s","qty":2,"unit_price":1}]'::jsonb, 1, 1)$$,
    (select id from public.products where slug = 'chand-studs'))) = 'ok');
-- A client may try to send status 'confirmed'. The BEFORE INSERT trigger forces it
-- back to 'new' (and clears admin_notes); the stored row is verified after reset role.
select public.t_try(format($$insert into public.orders (customer_name, phone, address, items, status, admin_notes)
  values ('Test Buyer', '03007654321', '12 Test Street, Karachi', '[{"id":"%s","qty":1}]'::jsonb, 'confirmed', 'sneaky')$$,
  (select id from public.products where slug = 'chand-studs')));
select public.t_check('anon cannot order an unpublished product',
  public.t_try(format($$insert into public.orders (customer_name, phone, address, items)
    values ('Test Buyer', '03007654322', '12 Test Street, Karachi', '[{"id":"%s","qty":1}]'::jsonb)$$,
    (select id from public.products where slug = 't-hidden-draft'))) like 'fail%');
select public.t_check('anon cannot order with empty items',
  public.t_try($$insert into public.orders (customer_name, phone, address, items) values ('Test Buyer','03007654323','12 Test Street','[]'::jsonb)$$) like 'fail%');
select public.t_check('anon cannot order a silly quantity',
  public.t_try(format($$insert into public.orders (customer_name, phone, address, items)
    values ('Test Buyer', '03007654324', '12 Test Street, Karachi', '[{"id":"%s","qty":999}]'::jsonb)$$,
    (select id from public.products where slug = 'chand-studs'))) like 'fail%');

-- rate limit: 5 orders per phone per hour (1 already placed above)
select public.t_try(format($$insert into public.orders (customer_name, phone, address, items)
  values ('Spam', '03009999999', '12 Test Street, Karachi', '[{"id":"%s","qty":1}]'::jsonb)$$,
  (select id from public.products where slug = 'chand-studs'))) from generate_series(1, 5);
select public.t_check('order rate limit blocks the 6th order from one phone',
  public.t_try(format($$insert into public.orders (customer_name, phone, address, items)
    values ('Spam', '03009999999', '12 Test Street, Karachi', '[{"id":"%s","qty":1}]'::jsonb)$$,
    (select id from public.products where slug = 'chand-studs'))) like '%rate limit%');

select public.t_check('anon can send a message',
  public.t_try($$insert into public.messages (name, email, message) values ('Visitor','v@example.com','Hello, do you ship to Multan?')$$) = 'ok');
-- A pre-read message is accepted but the trigger forces is_read = false (verified below).
select public.t_try($$insert into public.messages (name, email, message, is_read) values ('Visitor','v@example.com','Hello again there', true)$$);
select public.t_check('message length constraint holds',
  public.t_try($$insert into public.messages (name, message) values ('V','x')$$) like 'fail%');
select public.t_check('anon cannot upload to product-images',
  public.t_try($$insert into storage.objects (bucket_id, name) values ('product-images','evil.webp')$$) like 'fail%');
reset role;

select public.t_check('anon-supplied status/admin_notes are overwritten on insert',
  (select status = 'new' and admin_notes = '' from public.orders where phone = '03007654321'));

-- order totals were recomputed server side
select public.t_check('order total ignores client-sent price',
  (select subtotal = 27000 and total >= 27000 and ref like 'ZR-%' from public.orders where phone = '03001234567'));

select public.t_check('anon-supplied is_read is overwritten on insert',
  (select bool_and(not is_read) from public.messages where email = 'v@example.com'));

-- ---------------------------------------------------------------- SIGNED-IN NON-ADMIN
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-4000-8000-000000000002","role":"authenticated"}', false);

select public.t_check('non-admin sees no orders', public.t_count('select 1 from public.orders') = 0);
select public.t_check('non-admin sees no messages', public.t_count('select 1 from public.messages') = 0);
select public.t_check('non-admin sees no admins rows', public.t_count('select 1 from public.admins') = 0);
select public.t_check('non-admin cannot insert products', public.t_try($$insert into public.products (slug,name,price) values ('y','y',1)$$) like 'fail%');
select public.t_check('non-admin cannot update orders',
  (public.t_try($$update public.orders set status = 'cancelled'$$) like 'fail%')
  or (select count(*) from public.orders where status = 'cancelled') = 0);
select public.t_check('non-admin cannot add themselves as admin',
  public.t_try($$insert into public.admins (user_id) values ('bbbbbbbb-0000-4000-8000-000000000002')$$) like 'fail%');
select public.t_check('non-admin cannot upload to product-images',
  public.t_try($$insert into storage.objects (bucket_id, name) values ('product-images','evil2.webp')$$) like 'fail%');
select public.t_check('is_admin() is false for non-admin', public.is_admin() = false);
reset role;

-- ---------------------------------------------------------------- ADMIN
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}', false);

select public.t_check('is_admin() is true for admin', public.is_admin());
select public.t_check('admin reads orders', public.t_count('select 1 from public.orders') >= 1);
select public.t_check('admin reads messages', public.t_count('select 1 from public.messages') >= 1);
select public.t_check('admin sees unpublished products', public.t_count($$select 1 from public.products where slug = 't-hidden-draft'$$) = 1);
select public.t_check('admin creates a product',
  public.t_try($$insert into public.products (slug,name,price,published) values ('t-admin-made','Admin made',5000,true)$$) = 'ok');
select public.t_check('admin updates an order status',
  public.t_try($$update public.orders set status = 'confirmed' where phone = '03001234567'$$) = 'ok');
select public.t_check('admin status change was stored',
  (select status from public.orders where phone = '03001234567') = 'confirmed');
select public.t_check('admin marks a message read',
  public.t_try($$update public.messages set is_read = true$$) = 'ok');
select public.t_check('admin edits settings',
  public.t_try($$update public.site_settings set value = '923001112222' where key = 'whatsapp_number'$$) = 'ok');
select public.t_check('admin uploads to product-images',
  public.t_try($$insert into storage.objects (bucket_id, name) values ('product-images','ok.webp')$$) = 'ok');
select public.t_check('admin deletes a product',
  public.t_try($$delete from public.products where slug = 't-admin-made'$$) = 'ok');
select public.t_check('price above sale price is rejected',
  public.t_try($$insert into public.products (slug,name,price,sale_price) values ('bad-sale','Bad',100,200)$$) like 'fail%');
reset role;

-- cleanup
delete from public.orders where customer_name in ('Test Buyer', 'Spam');
delete from public.messages where email = 'v@example.com';
delete from public.products where slug in ('t-hidden-draft','t-admin-made');
delete from storage.objects where name in ('ok.webp');
delete from public.admins where user_id = 'aaaaaaaa-0000-4000-8000-000000000001';
delete from auth.users where id in ('aaaaaaaa-0000-4000-8000-000000000001','bbbbbbbb-0000-4000-8000-000000000002');
drop function public.t_try(text), public.t_count(text), public.t_check(text, boolean);
