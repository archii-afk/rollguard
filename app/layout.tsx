import type { Metadata, Viewport } from "next";
import {
  Atkinson_Hyperlegible,
  IBM_Plex_Mono,
  IBM_Plex_Sans_Devanagari,
  Newsreader,
  Noto_Sans_Kannada,
} from "next/font/google";
import "./globals.css";

// Body: Atkinson Hyperlegible — designed for low-vision readers; its I/l/1 and 0/O are unambiguous,
// which matters when a citizen reads an EPIC number or a roll serial off a phone.
const sans = Atkinson_Hyperlegible({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-sans", display: "swap" });
const display = Newsreader({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-display", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });
const devanagari = IBM_Plex_Sans_Devanagari({ subsets: ["devanagari"], weight: ["400", "500"], variable: "--font-hi", display: "swap" });
const kannada = Noto_Sans_Kannada({ subsets: ["kannada"], weight: ["400", "500"], variable: "--font-kn", display: "swap" });

export const metadata: Metadata = {
  title: "RollGuard — is your family still on the voter list?",
  description:
    "Prototype: check your whole household across two SIR electoral roll snapshots, draft Form 6/8 claims, and track them. Not an official ECI product.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f2f2ef" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${mono.variable} ${devanagari.variable} ${kannada.variable}`}>
      <body>{children}</body>
    </html>
  );
}
