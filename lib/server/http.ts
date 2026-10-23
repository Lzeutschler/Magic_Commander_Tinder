import "server-only";

import type { NextRequest } from "next/server";

import type { Bracket } from "@/lib/edhrec/types";

/** Lets Vercel's CDN serve repeat requests for a day while refreshing in the background. */
export const CDN_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
};

/** For responses that are missing optional data and should be retried soon. */
export const SHORT_CACHE_HEADERS = { "Cache-Control": "public, max-age=60, s-maxage=300" };

export function parseBracket(value: string | null): Bracket {
  const n = Number(value);
  return n >= 1 && n <= 5 ? (n as Bracket) : 3;
}

export function badRequest(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

/**
 * Answers requests that other websites send from a visitor's browser with 403, so nobody can build on
 * our API as a free EDHREC or Spellbook proxy. Browsers mark them with `Sec-Fetch-Site: cross-site`;
 * scripts without the header pass here and meet the firewall's rate limit instead.
 */
export function rejectCrossSite(request: Request): Response | null {
  return request.headers.get("sec-fetch-site") === "cross-site" ? badRequest("Cross-site requests are not allowed", 403) : null;
}

/**
 * Redirects to the canonical form of the query (known parameters only, in a fixed order, normalized
 * values) when the request differs, so stray or reordered parameters cannot bypass the CDN cache and
 * reach EDHREC. Our own client always asks in the canonical form.
 */
export function redirectToCanonical(request: NextRequest, params: [string, string | null][]): Response | null {
  const canonical = new URLSearchParams();
  for (const [key, value] of params) if (value !== null) canonical.set(key, value);
  if (request.nextUrl.searchParams.toString() === canonical.toString()) return null;
  return new Response(null, {
    status: 308,
    headers: { Location: `${request.nextUrl.pathname}?${canonical}`, ...CDN_CACHE_HEADERS },
  });
}
