-- ZARISH placeholder data: 4 categories, 12 products (no images: the site
-- draws procedural artwork until you upload photos in /admin).
-- Safe to re-run: uses ON CONFLICT DO NOTHING.

insert into public.categories (id, slug, name, description, sort_order) values
  ('11111111-1111-4111-8111-111111111101', 'bridal', 'Bridal sets', 'Complete sets for the wedding day: necklace, earrings and tikka, made to be kept.', 1),
  ('11111111-1111-4111-8111-111111111102', 'rings', 'Rings', 'Solitaires, cocktail rings and stacking bands in gold.', 2),
  ('11111111-1111-4111-8111-111111111103', 'necklaces', 'Necklaces', 'Chains, chokers and pendants for every neckline.', 3),
  ('11111111-1111-4111-8111-111111111104', 'earrings', 'Earrings', 'Jhumkas, studs and drops, light enough to wear all day.', 4)
on conflict (slug) do nothing;

insert into public.products
  (slug, name, description, price, sale_price, category_id, metal, stone, weight_grams, sizes, stock, featured, published, sort_order) values
  ('noor-bridal-set', 'Noor bridal set', 'A full bridal set in 22k gold-plated brass with hand-set kundan and a matching tikka.', 185000, 165000, '11111111-1111-4111-8111-111111111101', '22k gold plated', 'Kundan, pearl', 96.50, '{}', 4, true, true, 1),
  ('mehr-bridal-set', 'Mehr bridal set', 'Layered necklace, jhumkas and maang tikka in a deep ruby palette.', 149000, null, '11111111-1111-4111-8111-111111111101', '22k gold plated', 'Ruby glass', 82.00, '{}', 3, true, true, 2),
  ('saba-choker-set', 'Saba choker set', 'A close-fitting choker with drop earrings, made for the nikah.', 98000, 89000, '11111111-1111-4111-8111-111111111101', '22k gold plated', 'Emerald glass', 58.20, '{}', 6, false, true, 3),
  ('zoya-solitaire-ring', 'Zoya solitaire ring', 'A single faceted stone in a four-claw gold setting.', 42000, null, '11111111-1111-4111-8111-111111111102', '18k gold', 'Cubic zirconia', 4.10, '{"6","7","8","9"}', 12, true, true, 4),
  ('laal-cocktail-ring', 'Laal cocktail ring', 'An oversized garnet-red stone framed in fine gold beading.', 36500, 32000, '11111111-1111-4111-8111-111111111102', '18k gold', 'Garnet glass', 6.80, '{"6","7","8","9"}', 8, false, true, 5),
  ('tara-stacking-bands', 'Tara stacking bands', 'Three slim bands that sit together or apart.', 28000, null, '11111111-1111-4111-8111-111111111102', '18k gold', 'None', 5.40, '{"6","7","8"}', 15, false, true, 6),
  ('hira-pendant-chain', 'Hira pendant chain', 'A fine chain with a hand-finished teardrop pendant.', 31000, null, '11111111-1111-4111-8111-111111111103', '18k gold', 'Cubic zirconia', 7.20, '{}', 10, true, true, 7),
  ('rani-haar', 'Rani haar', 'A long haar with temple motifs, worn over a dupatta or alone.', 76000, 68000, '11111111-1111-4111-8111-111111111103', '22k gold plated', 'Pearl', 44.00, '{}', 5, false, true, 8),
  ('ada-layered-chain', 'Ada layered chain', 'Two chains joined at the clasp for an effortless layered look.', 24500, null, '11111111-1111-4111-8111-111111111103', '18k gold', 'None', 9.00, '{}', 14, false, true, 9),
  ('jhilmil-jhumkay', 'Jhilmil jhumkay', 'Classic bell jhumkas with pearl drops and a lightweight hollow dome.', 38000, null, '11111111-1111-4111-8111-111111111104', '22k gold plated', 'Pearl', 14.60, '{}', 9, true, true, 10),
  ('chand-studs', 'Chand studs', 'Crescent studs with a small stone at the tip.', 15500, 13500, '11111111-1111-4111-8111-111111111104', '18k gold', 'Cubic zirconia', 2.30, '{}', 20, false, true, 11),
  ('gul-chandbali', 'Gul chandbali', 'Half-moon chandbalis with a floral centre and ruby drops.', 54000, null, '11111111-1111-4111-8111-111111111104', '22k gold plated', 'Ruby glass', 21.40, '{}', 7, false, true, 12)
on conflict (slug) do nothing;
