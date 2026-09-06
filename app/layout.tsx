import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = "https://avyaans-little-world.pages.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Avyaan's Little World",
  description: "A private, playful learning world for curious little explorers.",
  icons: { icon: "/favicon.svg" },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Little World", statusBarStyle: "default" },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Avyaan's Little World",
    title: "Avyaan's Little World",
    description: "A private, playful learning world for curious little explorers.",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "Avyaan's Little World — Play, Learn, Discover" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Avyaan's Little World",
    description: "A private, playful learning world for curious little explorers.",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#7563c7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
