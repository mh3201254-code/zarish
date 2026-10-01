import type { Metadata } from "next";
import CollectionsClient from "./CollectionsClient";

export const metadata: Metadata = {
  title: "Collections",
  description: "Bridal sets, rings, necklaces and earrings, each collection designed to be worn together or alone.",
};

export default function Page() {
  return <CollectionsClient />;
}
