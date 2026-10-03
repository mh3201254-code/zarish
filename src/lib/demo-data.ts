import type { Category, Product, Settings } from "./types";

export const demoSettings: Settings = {
  whatsapp_number: "923000000000",
  announcement: "Complimentary delivery on orders above PKR 25,000",
  hero_title: "Gold, worn for generations",
  hero_subtitle: "Bridal sets and everyday fine jewellery, finished by hand and delivered across Pakistan.",
  instagram: "https://instagram.com/",
  facebook: "https://facebook.com/",
  phone: "+92 300 0000000",
  delivery_charge: "500",
  free_delivery_above: "25000",
  stat_years: "12",
  stat_customers: "4800",
  stat_pieces: "1200",
};

export const demoCategories: Category[] = [
  { id: "c1", slug: "bridal", name: "Bridal sets", description: "Complete sets for the wedding day: necklace, earrings and tikka, made to be kept.", cover_image: "/products/bridal-flatlay.webp", sort_order: 1, published: true },
  { id: "c2", slug: "rings", name: "Rings", description: "Solitaires, cocktail rings and stacking bands in gold.", cover_image: "/products/rings-stack.webp", sort_order: 2, published: true },
  { id: "c3", slug: "necklaces", name: "Necklaces", description: "Chains, chokers and pendants for every neckline.", cover_image: "/products/necklace-lifestyle.webp", sort_order: 3, published: true },
  { id: "c4", slug: "earrings", name: "Earrings", description: "Jhumkas, studs and drops, light enough to wear all day.", cover_image: "/products/jhumka-lifestyle.webp", sort_order: 4, published: true },
];

type Row = [string, string, string, number, number | null, string, string, string, number, string[], number, boolean];

const rows: Row[] = [
  ["noor-bridal-set", "Noor bridal set", "A full bridal set in 22k gold-plated brass with hand-set kundan and a matching tikka.", 185000, 165000, "c1", "22k gold plated", "Kundan, pearl", 96.5, [], 4, true],
  ["mehr-bridal-set", "Mehr bridal set", "Layered necklace, jhumkas and maang tikka in a deep ruby palette.", 149000, null, "c1", "22k gold plated", "Ruby glass", 82, [], 3, true],
  ["saba-choker-set", "Saba choker set", "A close-fitting choker with drop earrings, made for the nikah.", 98000, 89000, "c1", "22k gold plated", "Emerald glass", 58.2, [], 6, false],
  ["zoya-solitaire-ring", "Zoya solitaire ring", "A single faceted stone in a four-claw gold setting.", 42000, null, "c2", "18k gold", "Cubic zirconia", 4.1, ["6", "7", "8", "9"], 12, true],
  ["laal-cocktail-ring", "Laal cocktail ring", "An oversized garnet-red stone framed in fine gold beading.", 36500, 32000, "c2", "18k gold", "Garnet glass", 6.8, ["6", "7", "8", "9"], 8, false],
  ["tara-stacking-bands", "Tara stacking bands", "Three slim bands that sit together or apart.", 28000, null, "c2", "18k gold", "None", 5.4, ["6", "7", "8"], 15, false],
  ["hira-pendant-chain", "Hira pendant chain", "A fine chain with a hand-finished teardrop pendant.", 31000, null, "c3", "18k gold", "Cubic zirconia", 7.2, [], 10, true],
  ["rani-haar", "Rani haar", "A long haar with temple motifs, worn over a dupatta or alone.", 76000, 68000, "c3", "22k gold plated", "Pearl", 44, [], 5, false],
  ["ada-layered-chain", "Ada layered chain", "Two chains joined at the clasp for an effortless layered look.", 24500, null, "c3", "18k gold", "None", 9, [], 14, false],
  ["jhilmil-jhumkay", "Jhilmil jhumkay", "Classic bell jhumkas with pearl drops and a lightweight hollow dome.", 38000, null, "c4", "22k gold plated", "Pearl", 14.6, [], 9, true],
  ["chand-studs", "Chand studs", "Crescent studs with a small stone at the tip.", 15500, 13500, "c4", "18k gold", "Cubic zirconia", 2.3, [], 20, false],
  ["gul-chandbali", "Gul chandbali", "Half-moon chandbalis with a floral centre and ruby drops.", 54000, null, "c4", "22k gold plated", "Ruby glass", 21.4, [], 7, false],
];

// Real product photos live in /public/products. Products not listed here
// fall back to the generated studio artwork (ProductArt) until photos exist.
const PRODUCT_IMAGES: Record<string, string[]> = {
  "mehr-bridal-set": ["https://raw.githubusercontent.com/mh3201254-code/zarish/main/noor-bridal-set.webp/Gemini_Generated_Image_4feqe44feqe44feq.jpg"],
  "zoya-solitaire-ring": ["https://raw.githubusercontent.com/mh3201254-code/zarish/main/noor-bridal-set.webp/Gemini_Generated_Image_xcpe4fxcpe4fxcpe.jpg"],
  "tara-stacking-bands": ["/products/rings-stack.webp"],
  "hira-pendant-chain": ["/products/pendant-pear.webp"],
  "rani-haar": ["/products/necklace-lifestyle.webp"],
  "jhilmil-jhumkay": ["/products/jhumka-studio.webp", "/products/jhumka-lifestyle.webp"],
};

export const demoProducts: Product[] = rows.map((r, i) => {
  const cat = demoCategories.find((c) => c.id === r[5])!;
  return {
    id: `demo-${i + 1}`,
    slug: r[0],
    name: r[1],
    description: r[2],
    price: r[3],
    sale_price: r[4],
    category_id: cat.id,
    category_slug: cat.slug,
    category_name: cat.name,
    metal: r[6],
    stone: r[7],
    weight_grams: r[8],
    sizes: r[9],
    stock: r[10],
    featured: r[11],
    published: true,
    sort_order: i + 1,
    images: PRODUCT_IMAGES[r[0]] ?? [],
  };
});
