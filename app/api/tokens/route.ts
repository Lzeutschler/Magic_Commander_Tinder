import type { NextRequest } from "next/server";

import { nameKey } from "@/lib/cards/names";
import { getCardDb } from "@/lib/server/card-db";
import { CDN_CACHE_HEADERS, rejectCrossSite } from "@/lib/server/http";

const MAX_RESULTS = 24;
const COMMON_TOKENS = ["Treasure", "Soldier", "Goblin", "Zombie", "Saproling", "Spirit", "Clue", "Food", "Elf Warrior", "Beast"];

/** GET /api/tokens?q=goblin → token cards by name or type; without a query, the most common ones. */
export async function GET(request: NextRequest) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;

  const query = nameKey(request.nextUrl.searchParams.get("q") ?? "");
  const { tokens } = await getCardDb();

  const matches = query
    ? tokens.filter((t) => nameKey(t.name).includes(query) || nameKey(t.typeLine).includes(query))
    : COMMON_TOKENS.flatMap((name) => tokens.filter((t) => t.name === name).slice(0, 2));

  matches.sort((a, b) => Number(nameKey(b.name).startsWith(query)) - Number(nameKey(a.name).startsWith(query)));
  return Response.json({ tokens: matches.slice(0, MAX_RESULTS) }, { headers: CDN_CACHE_HEADERS });
}
