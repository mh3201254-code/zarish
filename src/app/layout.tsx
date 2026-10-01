import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import SiteShell from "@/components/SiteShell";

const siteUrl = "https://zarish.pages.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "ZARISH | Heritage jewellery and bridal sets", template: "%s | ZARISH" },
  description:
    "Bridal sets, rings, necklaces and earrings finished by hand. Order on WhatsApp and pay cash on delivery anywhere in Pakistan.",
  openGraph: {
    type: "website",
    siteName: "ZARISH",
    title: "ZARISH | Heritage jewellery and bridal sets",
    description: "Gold, worn for generations. Bridal sets and fine jewellery, delivered across Pakistan.",
    locale: "en_PK",
  },
  twitter: { card: "summary_large_image", title: "ZARISH", description: "Heritage jewellery and bridal sets." },
};

export const viewport: Viewport = {
  themeColor: "#140a0d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Montserrat:wght@300;400;500;600&display=swap"
        />
      </head>
      <body>
        <Providers>
          <SiteShell>{children}</SiteShell>
        </Providers>
      </body>
    </html>
  );
}
