import type { NextRequest } from "next/server";

import { fitsIdentity, sortColors } from "@/lib/cards/colors";
import { nameKey } from "@/lib/cards/names";
import type { Card } from "@/lib/cards/types";
import { getCardDb } from "@/lib/server/card-db";
import { CDN_CACHE_HEADERS, rejectCrossSite } from "@/lib/server/http";

const MAX_RESULTS = 20;

/** GET /api/cards/search?q=sol&identity=WUB → name matches, prefix matches first, then by popularity. */
export async function GET(request: NextRequest) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;

  const params = request.nextUrl.searchParams;
  const query = nameKey(params.get("q") ?? "");
  if (query.length < 2) return Response.json({ cards: [] });

  const identityParam = params.get("identity");
  const identity = identityParam === null ? null : sortColors(identityParam.toUpperCase().split(""));

  const { cards } = await getCardDb();
  const matches: { card: Card; prefix: boolean }[] = [];
  for (const card of cards) {
    const key = nameKey(card.name);
    const index = key.indexOf(query);
    if (index === -1) continue;
    if (identity && !fitsIdentity(card.colorIdentity, identity)) continue;
    matches.push({ card, prefix: index === 0 });
  }

  matches.sort(
    (a, b) =>
      Number(b.prefix) - Number(a.prefix) ||
      (a.card.edhrecRank ?? Infinity) - (b.card.edhrecRank ?? Infinity) ||
      a.card.name.localeCompare(b.card.name),
  );
  return Response.json({ cards: matches.slice(0, MAX_RESULTS).map((m) => m.card) }, { headers: CDN_CACHE_HEADERS });
}
