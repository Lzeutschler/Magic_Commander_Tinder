/**
 * Public URL of the site, used for canonical URLs, Open Graph, robots.txt and the sitemap.
 * Set NEXT_PUBLIC_SITE_URL in production; on Vercel the production domain is the fallback.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const SITE = {
  name: "Commander Tinder",
  url: resolveSiteUrl(),
  description:
    "Find your commander, swipe your way to a deck and goldfish it — a free deckbuilding companion for Magic: The Gathering Commander.",
  themeColor: "#0a0705",
} as const;

/**
 * Provider of the site for the Impressum and the privacy policy. Commander Tinder is a private,
 * non-commercial hobby project, so Leonard runs it as a private person (not via 45level GmbH).
 */
export const OPERATOR = {
  name: "Leonard Zeutschler",
  street: "Hobirkheide 23",
  postalCode: "45149",
  city: "Essen",
  country: { de: "Deutschland", en: "Germany" },
  email: "info@45level.com",
  website: "https://www.leonard-zeutschler.de",
} as const;

export const LEGAL_LAST_UPDATED = { de: "Oktober 2026", en: "October 2026" } as const;
