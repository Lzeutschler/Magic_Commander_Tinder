import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";

import { Providers } from "@/components/providers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const cinzel = Cinzel({ variable: "--font-cinzel", subsets: ["latin"], weight: ["500", "700"] });

export const metadata: Metadata = {
  title: { default: "Commander Tinder", template: "%s · Commander Tinder" },
  description: "Find your commander, swipe your way to a deck and goldfish it — for Magic: The Gathering Commander.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${cinzel.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>
          <SiteHeader />
          <main className="flex flex-1 flex-col">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
