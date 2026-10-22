import type { Metadata } from "next";
import { Alegreya, Archivo } from "next/font/google";
import localFont from "next/font/local";

import { Providers } from "@/components/providers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"] });
const alegreya = Alegreya({ variable: "--font-alegreya", subsets: ["latin"], weight: ["500", "700", "800"] });
// Mana symbol font by Andrew Gioia (SIL OFL 1.1), used for tap and card type symbols.
const mana = localFont({ variable: "--font-mana-symbols", src: "./fonts/mana.woff2", display: "block", preload: false });

export const metadata: Metadata = {
  title: { default: "Commander Tinder", template: "%s · Commander Tinder" },
  description: "Find your commander, swipe your way to a deck and goldfish it — for Magic: The Gathering Commander.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${archivo.variable} ${alegreya.variable} ${mana.variable} h-full antialiased`}>
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
