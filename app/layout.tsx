import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Avyaan's Little World",
  description: "A private, playful learning world for curious little explorers.",
  icons: { icon: "/favicon.svg" },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Little World", statusBarStyle: "default" },
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
