import "server-only";

import type { Bracket } from "@/lib/edhrec/types";

/** Lets Vercel's CDN serve repeat requests for a day while refreshing in the background. */
export const CDN_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
};

export function parseBracket(value: string | null): Bracket {
  const n = Number(value);
  return n >= 1 && n <= 5 ? (n as Bracket) : 3;
}

export function badRequest(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
