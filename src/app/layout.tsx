import type { Metadata, Viewport } from "next";
import { Figtree, Instrument_Serif, Martian_Mono, Unbounded } from "next/font/google";
import "./globals.css";

const unbounded = Unbounded({ subsets: ["latin"], variable: "--font-unbounded", display: "swap" });
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree", display: "swap" });
const martian = Martian_Mono({ subsets: ["latin"], variable: "--font-martian", display: "swap" });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: "italic", variable: "--font-instrument", display: "swap" });

export const metadata: Metadata = {
  title: "FruitAnatomy 3D — slice open a fruit, layer by layer",
  description:
    "Explore the peel, flesh and core of eight fruits in 3D, with per-layer nutrients from USDA FoodData Central and evidence-graded food pairings.",
};

export const viewport: Viewport = {
  themeColor: "#120A14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${unbounded.variable} ${figtree.variable} ${martian.variable} ${instrument.variable}`}>
      <body>{children}</body>
    </html>
  );
}
