import type { Metadata, Viewport } from "next";
import { Alegreya, Archivo } from "next/font/google";
import localFont from "next/font/local";

import { Providers } from "@/components/providers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SITE } from "@/lib/site";

import "./globals.css";

const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"] });
const alegreya = Alegreya({ variable: "--font-alegreya", subsets: ["latin"], weight: ["500", "700", "800"] });
// Mana symbol font by Andrew Gioia (SIL OFL 1.1), used for tap and card type symbols.
const mana = localFont({ variable: "--font-mana-symbols", src: "./fonts/mana.woff2", display: "block", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.name, template: `%s · ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: ["Magic: The Gathering", "MTG", "Commander", "EDH", "deckbuilding", "goldfish", "EDHREC"],
  authors: [{ name: "Leonard Zeutschler", url: "https://www.leonard-zeutschler.de/" }],
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: SITE.name,
    description: SITE.description,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: SITE.name, description: SITE.description },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: SITE.themeColor,
  colorScheme: "dark",
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
