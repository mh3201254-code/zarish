# Admin guide

Open `/admin` on your site and sign in with the email and password created in Supabase. There is no sign-up page. Only users listed in the `admins` table can enter; anyone else sees "This account is not an admin".

## Add a product
1. Products > **New product**.
2. Fill name (the slug fills itself), price in PKR, optional sale price (must be lower), stock, category, metal, stone, weight in grams, sizes (comma separated, for example `6, 7, 8`).
3. Add images. They are converted to WebP in your browser (about 300KB or less). Drag to reorder or use the arrow buttons; the first image is the cover and the second is shown on hover.
4. Tick **Published in the shop** when ready (leave unticked to keep a draft). Tick **Featured** to show it on the home page.
5. Check the live preview on the right, then **Save product**.

Edit, duplicate (creates an unpublished copy) and delete from the Products list. Deleting also removes the product's image files.

## Collections
Categories > **New collection**: name, description, cover image, sort order. Hide a collection with "Visible in the shop". Deleting one keeps its products but removes their category.

## Orders
Orders appear when customers check out. Statuses: new, confirmed, shipped, delivered, cancelled. Open a row to see address, items, totals and to write internal notes. **Message on WhatsApp** opens a chat with the customer. **Export CSV** downloads the rows currently filtered. Stock is not reduced automatically (orders are cash on delivery and confirmed by you), so update stock on the product when you confirm.

## Messages
Contact-form messages. Unread ones are highlighted; toggle read/unread or delete.

## Site settings
WhatsApp number, phone, announcement bar (empty hides it), hero headline and subtitle, social links, delivery charge, free-delivery threshold, and the three home-page counters. Changes show on the next page load.

## Add another admin
Create the user in Supabase (Authentication > Users), then in the SQL editor:
```sql
insert into public.admins (user_id)
select id from auth.users where email = 'new.admin@example.com';
```
