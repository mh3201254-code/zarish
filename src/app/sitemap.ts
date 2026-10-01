import type { MetadataRoute } from "next";
export const dynamic = "force-static";

// /admin is intentionally absent. Product URLs use ?slug= and are discovered via
// the shop page; add static URLs here if you want them listed explicitly.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://zarish.pages.dev";
  return ["", "/shop/", "/collections/", "/about/", "/contact/"].map((p) => ({
    url: base + p,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.7,
  }));
}
