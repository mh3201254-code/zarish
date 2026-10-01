# What to tweak

| I want to change | Where |
| --- | --- |
| Colours (background, gold, ruby) | `:root` tokens in `src/app/globals.css` |
| Fonts | the Google Fonts `<link>` in `src/app/layout.tsx` and `--font-display` / `--font-body` in `globals.css` |
| Hero headline, subtitle, announcement, WhatsApp, socials, delivery, counters | `/admin` > Site settings (defaults in `src/lib/demo-data.ts` and the migration) |
| Brand name in the header, footer, loader | `SiteShell.tsx`, `Loader.tsx` |
| Story section text (craft, materials, bridal) | `Story.tsx` |
| Gem look and camera moves per section | `POSES` and the materials in `GemCanvas.tsx` |
| Gem on phones / weak devices | `useCapability()` in `Story.tsx` (thresholds), `StaticGem` (fallback art) |
| Marquee words | `MarqueeBand` in `HomeSections.tsx` |
| Testimonials (sample text, replace before launch) | `testimonials` in `HomeSections.tsx` |
| FAQ (delivery times, returns, care) | `src/components/Faq.tsx` |
| About page copy (sample, replace) | `src/app/about/page.tsx` |
| Categories (for example add Bangles) | `/admin` > Categories; update `ProductArt.tsx` if you want a bangle drawing |
| Real photos instead of drawn artwork | upload images on each product; the drawings are only a fallback |
| Product card tilt strength | `rx` / `ry` multiplier (10) in `ProductCard.tsx` |
| Domain for SEO | `siteUrl` in `layout.tsx`, `sitemap.ts`, `robots.ts` |
| Security headers / CSP | `public/_headers` (add any new external host there) |
| Low-stock threshold on the dashboard | `.lte("stock", 3)` in `src/app/admin/page.tsx` |
| Order rate limit | `orders_prepare()` in the migration (5 per phone per hour) |
