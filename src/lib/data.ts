import { getSupabase } from "./supabase";
import { clean, safeUrl } from "./sanitize";
import { demoCategories, demoProducts, demoSettings } from "./demo-data";
import type { Category, Product, Settings } from "./types";

type RawProduct = Record<string, unknown> & {
  categories?: { slug?: string; name?: string } | { slug?: string; name?: string }[] | null;
};

export function normalizeProduct(r: RawProduct): Product {
  const cat = Array.isArray(r.categories) ? r.categories[0] : r.categories;
  const sale = r.sale_price == null ? null : Number(r.sale_price);
  return {
    id: String(r.id),
    slug: clean(r.slug, 120),
    name: clean(r.name, 140),
    description: clean(r.description, 4000),
    price: Number(r.price) || 0,
    sale_price: sale,
    category_id: r.category_id ? String(r.category_id) : null,
    category_slug: clean(cat?.slug ?? "", 80),
    category_name: clean(cat?.name ?? "", 80),
    metal: clean(r.metal, 80),
    stone: clean(r.stone, 80),
    weight_grams: r.weight_grams == null ? null : Number(r.weight_grams),
    sizes: Array.isArray(r.sizes) ? (r.sizes as unknown[]).map((s) => clean(s, 20)).filter(Boolean) : [],
    stock: Number(r.stock) || 0,
    featured: Boolean(r.featured),
    published: Boolean(r.published),
    sort_order: Number(r.sort_order) || 0,
    images: localImagesForCategory(clean(cat?.slug ?? "", 80)).length > 0\n      ? localImagesForCategory(clean(cat?.slug ?? "", 80))\n      : (Array.isArray(r.images) ? (r.images as unknown[]).map(safeUrl).filter(Boolean) : []),
  };
}

export function normalizeCategory(r: Record<string, unknown>): Category {
  return {
    id: String(r.id),
    slug: clean(r.slug, 80),
    name: clean(r.name, 80),
    description: clean(r.description, 600),
    cover_image: r.cover_image ? safeUrl(r.cover_image) || null : null,
    sort_order: Number(r.sort_order) || 0,
    published: r.published !== false,
  };
}



// Local ZARISH product images uploaded to GitHub.
// These replace the old remote demo images by category.
const LOCAL_CATEGORY_IMAGES: Record<string, string[]> = {
  bridal: [
    "/images/Gemini_Generated_Image_5xjb2a5xjb2a5xjb.jpg",
    "/images/Gemini_Generated_Image_8uc9ab8uc9ab8uc9.jpg",
  ],
  rings: [
    "/images/Gemini_Generated_Image_b7bmp1b7bmp1b7bm.jpg",
    "/images/Gemini_Generated_Image_cy8ht6cy8ht6cy8h.jpg",
  ],
  necklaces: [
    "/images/Gemini_Generated_Image_hjsemehjsemehjse.jpg",
    "/images/Gemini_Generated_Image_hqi4jbhqi4jbhqi4.jpg",
  ],
  earrings: [
    "/images/Gemini_Generated_Image_iax9a1iax9a1iax9.jpg",
    "/images/Gemini_Generated_Image_rvwgggrvwgggrvwg.jpg",
  ],
};

function localImagesForCategory(slug: string): string[] {
  return LOCAL_CATEGORY_IMAGES[slug] ?? [];
}

export type Catalog = { products: Product[]; categories: Category[]; demo: boolean };

let catalogPromise: Promise<Catalog> | null = null;
let settingsPromise: Promise<Settings> | null = null;

// Without Supabase env vars the site runs on built-in demo data.
// With Supabase configured, the database is the single source of truth.
export function loadCatalog(force = false): Promise<Catalog> {
  if (force) catalogPromise = null;
  if (!catalogPromise) {
    catalogPromise = (async () => {
      const sb = getSupabase();
      if (!sb) return { products: demoProducts, categories: demoCategories, demo: true };
      const [p, c] = await Promise.all([
        sb.from("products").select("*, categories(slug, name)").eq("published", true).order("sort_order"),
        sb.from("categories").select("*").eq("published", true).order("sort_order"),
      ]);
      if (p.error || c.error) {
        catalogPromise = null;
        throw new Error(p.error?.message || c.error?.message || "Could not load catalogue");
      }
      return {
        products: (p.data as RawProduct[]).map(normalizeProduct),
        categories: (c.data as Record<string, unknown>[]).map(normalizeCategory),
        demo: false,
      };
    })();
  }
  return catalogPromise;
}

export function loadSettings(force = false): Promise<Settings> {
  if (force) settingsPromise = null;
  if (!settingsPromise) {
    settingsPromise = (async () => {
      const sb = getSupabase();
      if (!sb) return demoSettings;
      const { data, error } = await sb.from("site_settings").select("key, value");
      if (error || !data) {
        settingsPromise = null;
        return demoSettings;
      }
      const out: Settings = { ...demoSettings };
      for (const row of data as { key: string; value: string }[]) out[row.key] = clean(row.value, 1000);
      return out;
    })();
  }
  return settingsPromise;
}
