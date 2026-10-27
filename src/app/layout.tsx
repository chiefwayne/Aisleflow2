import type { Metadata } from "next";
import { Cinzel, Corinthia, Cormorant_Garamond, Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const playfair = Playfair_Display({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-playfair", display: "swap" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], style: ["normal", "italic"], weight: ["300", "400", "500", "600"], variable: "--font-cormorant", display: "swap" });
const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-cinzel", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
// Script face for couples' names on the invitation
const corinthia = Corinthia({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-script", display: "swap" });
// Name faces owned by single presets: Modern Minimal (Bodoni), Indian Marigold (Rozha), Boho Botanical (La Belle Aurore).
// Bundled (latin, SIL Open Font Licence from Google Fonts) so they load wherever the app runs.
const bodoni = localFont({ src: "./fonts/BodoniModa-latin.woff2", weight: "400 500", variable: "--font-bodoni", display: "swap" });
const rozha = localFont({ src: "./fonts/RozhaOne-latin.woff2", weight: "400", variable: "--font-rozha", display: "swap" });
const belleAurore = localFont({ src: "./fonts/LaBelleAurore-latin.woff2", weight: "400", variable: "--font-belle-aurore", display: "swap" });

export const metadata: Metadata = {
  title: "AisleFlow — Beautiful Wedding Invitations & Effortless RSVPs",
  openGraph: {
    title: "AisleFlow — Beautiful Wedding Invitations & Effortless RSVPs",
    description: "One beautiful link for your wedding invitation, schedule, RSVPs and photos.",
    type: "website",
  },
  description: "One beautiful link for your wedding invitation, schedule, RSVPs and photos. Guests open it with a tap — no accounts, no apps.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`scroll-smooth ${playfair.variable} ${cormorant.variable} ${cinzel.variable} ${jakarta.variable} ${corinthia.variable} ${bodoni.variable} ${rozha.variable} ${belleAurore.variable}`} data-scroll-behavior="smooth">
      <body className="bg-aisle-cream text-aisle-ink antialiased min-h-screen selection:bg-aisle-terracotta selection:text-white">
        {children}
      </body>
    </html>
  );
}
