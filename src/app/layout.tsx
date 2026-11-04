import type { Metadata, Viewport } from "next";
import { Playfair_Display, Lato, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "700"], style: ["normal", "italic"], variable: "--f-display", display: "swap" });
const body = Lato({ subsets: ["latin"], weight: ["300", "400", "700"], variable: "--f-body", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--f-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: { default: "BLUNA Graphisme — Antoine ANANI", template: "%s · BLUNA Graphisme" },
  description: "Antoine ANANI, web designer et graphiste à Lomé. Identité visuelle, sites et applications web, photographie.",
  openGraph: { type: "website", locale: "fr_FR", siteName: "BLUNA Graphisme", images: ["/img/antoine-studio.webp"] },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = { themeColor: "#0d0d0e", viewportFit: "cover", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
