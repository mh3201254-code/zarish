# ZARISH

Premium jewellery showcase with a private admin panel. Next.js (static export) + Tailwind + Motion + Lenis + React Three Fiber, backed by Supabase, hosted on Cloudflare Pages. Everything runs on free tiers.

- Public site: Home, Shop (filters, sort, search), Product, Collections, About, Contact, Wishlist, Cart drawer, 404
- Admin at `/admin`: dashboard, products, categories, orders (CSV export), messages, site settings
- Ordering: WhatsApp message + Cash on Delivery, orders saved to Supabase
- Without Supabase keys the storefront runs on built-in demo data, so you can design first and connect later

## 1. Run locally

```bash
npm install
cp .env.example .env.local     # fill in the two Supabase values (optional at first)
npm run dev                    # http://localhost:3000
npm run build                  # static export to ./out
```

Check: the intro loader plays once, the 3D gem reacts to the mouse, the page pins while the story changes, products tilt on hover, the cart opens, and `/admin` shows "Supabase is not connected" until keys are set.

## 2. Supabase (free plan)

1. Create a project at supabase.com.
2. Open the SQL editor, paste and run `supabase/migrations/001_init.sql`, then `supabase/seed.sql` (12 sample products, 4 categories).
3. Authentication settings: turn **off** "Allow new users to sign up". Set the Site URL to your Cloudflare URL.
4. Authentication > Users > **Add user** with an email and password (this is your admin login).
5. Make that user an admin (SQL editor):
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'you@example.com';
   ```
6. Project settings > API: copy the **Project URL** and the **anon public** key into `.env.local`. Never use the `service_role` key anywhere in this project.

## 3. Test RLS

`supabase/tests/rls_test.sql` has 42 checks (anon, signed-in non-admin, admin). It was run against a local Postgres 16 with the stubs in `supabase/tests/local_stubs.sql` and all 42 passed.

Local run:
```bash
createdb zt
psql -d zt -f supabase/tests/local_stubs.sql -f supabase/migrations/001_init.sql -f supabase/seed.sql
psql -v ON_ERROR_STOP=1 -d zt -f supabase/tests/rls_test.sql    # prints PASS / FAIL per check
```
On a real Supabase project, run the test file in the SQL editor on a **staging** project (it creates and removes temporary rows). The stubs file is for local Postgres only.

Manual checks in the browser console of the live site: `from('products').insert(...)` as a visitor must fail; log in as a non-admin user and `from('orders').select()` must return nothing.

## 4. GitHub

```bash
git init -b main
git add . && git commit -m "feat: initial ZARISH site"
git remote add origin https://github.com/<you>/zarish.git
git push -u origin main
```
Workflow: `main` is production. Make changes on a branch (`git switch -c feat/new-hero`), use Conventional Commits (`feat:`, `fix:`, `chore:`), open a pull request, merge to `main` to deploy.

## 5. Cloudflare Pages

1. Workers & Pages > Create > Pages > Connect to Git > pick the repo.
2. Framework preset: Next.js (Static HTML Export). Build command `npm run build`. Output directory `out`.
3. Environment variables (Settings > Variables): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NODE_VERSION` = `22`.
4. Deploy. Every push to `main` redeploys.
5. After you know your real domain, update it in `src/app/layout.tsx` (`siteUrl`), `src/app/sitemap.ts` and `src/app/robots.ts`.

`public/_headers` ships the security headers (CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy) and long cache rules for `/_next/static`. No `_redirects` is needed: every route is a real static page and product pages use `/product/?slug=...`, so **new products appear without a rebuild** (they are fetched from Supabase in the browser).

## Notes and limits

- Product JSON-LD is injected in the browser after the product loads (static export cannot know products at build time). Google renders JavaScript, but it is less reliable than server-rendered markup.
- Static export has no server, so rate limiting is a client throttle plus database triggers (5 orders per phone and 5 messages per email/phone per hour).
- Order prices are recomputed by a database trigger from the `products` table. The browser's totals are only for display.
- `site_settings` is public by design. Do not put secrets in it.
- Page transitions animate on enter only (App Router has no exit hook without extra libraries).
