import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Rostvyn — Specialty Coffee & Artisan Roastery",
    template: "%s | Rostvyn",
  },
  description:
    "Small-batch specialty coffee roasted to order. Single-origin micro-lots, signature espresso blends, and precision brewing equipment crafted for discerning palates.",
  keywords: [
    "specialty coffee",
    "artisan roastery",
    "single origin coffee",
    "micro-lot coffee",
    "fresh roasted coffee",
    "Rostvyn",
  ],
  openGraph: {
    title: "Rostvyn — Specialty Coffee & Artisan Roastery",
    description:
      "Small-batch specialty coffee roasted to order. Single-origin micro-lots and signature blends.",
    type: "website",
    siteName: "Rostvyn",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jakarta.variable}`}>
      <body className="bg-alabaster text-espresso font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
