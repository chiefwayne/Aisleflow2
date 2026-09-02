import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AisleFlow — Boutique Wedding Guest-Experience Platform",
  description: "The guest operating system for intimate weddings, destination celebrations, and high-touch private events. Zero-login guest portals, live RSVPs, VIP timelines, and shared photo stream.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth">
      <body className="bg-aisle-cream text-aisle-ink antialiased min-h-screen selection:bg-aisle-terracotta selection:text-white">
        {children}
      </body>
    </html>
  );
}
