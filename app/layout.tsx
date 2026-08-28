import type { Metadata, Viewport } from "next";
import { Noto_Sans, Noto_Sans_Kannada, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";

const sans = Noto_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const kannada = Noto_Sans_Kannada({ subsets: ["kannada"], variable: "--font-kn", display: "swap" });
const devanagari = Noto_Sans_Devanagari({ subsets: ["devanagari"], variable: "--font-hi", display: "swap" });

export const metadata: Metadata = {
  title: "RollGuard — check and restore your family's voter names",
  description:
    "Prototype: diff your household across two SIR electoral roll snapshots, draft Form 6/8 claims, and track them. Not an official ECI product.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#fbf8f2" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${kannada.variable} ${devanagari.variable}`}>
      <body>{children}</body>
    </html>
  );
}
