import "./globals.css";
import type { Metadata, Viewport } from "next";
import Nav from "@/components/Nav";
import Fx from "@/components/Fx";
import Boot from "@/components/Boot";
import { me } from "@/lib/api";

export const metadata: Metadata = { title: "Khidmatul Khadim", manifest: "/manifest.webmanifest", appleWebApp: { capable: true, title: "Khidmatul Khadim", statusBarStyle: "black-translucent" }, icons: { apple: "/icon-192.png" } };
export const viewport: Viewport = { themeColor: "#0C2E24", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const m = await me();
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700&family=Figtree:wght@400;600&family=Amiri:wght@700&family=Amiri+Quran&display=swap" />
      </head>
      <body>{children}{m?.isAdmin && <Nav />}<Fx /><Boot /></body>
    </html>
  );
}
