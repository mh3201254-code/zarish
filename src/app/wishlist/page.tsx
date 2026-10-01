import type { Metadata } from "next";
import WishlistClient from "./WishlistClient";

export const metadata: Metadata = { title: "Wishlist", description: "Pieces you have saved.", robots: { index: false } };

export default function Page() {
  return <WishlistClient />;
}
