import type { NextRequest } from "next/server";

import { isEdhrecSlug } from "@/lib/edhrec/types";
import { findCard, getCardDb } from "@/lib/server/card-db";
import { getCandidatePool } from "@/lib/server/candidates";
import {
  CDN_CACHE_HEADERS,
  SHORT_CACHE_HEADERS,
  badRequest,
  parseBracket,
  redirectToCanonical,
  rejectCrossSite,
} from "@/lib/server/http";

/** GET /api/candidates?commander=Krenko, Mob Boss&bracket=3&theme=tokens */
export async function GET(request: NextRequest) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;

  const params = request.nextUrl.searchParams;
  const name = params.get("commander");
  if (!name) return badRequest("commander is required");
  const theme = params.get("theme") || null;
  if (theme !== null && !isEdhrecSlug(theme)) return badRequest("theme must be an EDHREC theme slug, e.g. tokens");
  const bracket = parseBracket(params.get("bracket"));

  const commander = findCard(await getCardDb(), name);
  if (!commander) return badRequest(`Unknown commander: ${name}`, 404);
  const canonical = redirectToCanonical(request, [
    ["commander", commander.name],
    ["bracket", String(bracket)],
    ["theme", theme],
  ]);
  if (canonical) return canonical;

  const pool = await getCandidatePool(commander.name, bracket, theme);
  if (!pool) return badRequest(`Unknown commander: ${name}`, 404);
  // Without combos the bracket check is incomplete, and without EDHREC the pool is a stand-in: let the CDN
  // retry soon instead of keeping either for a day.
  return Response.json(pool, { headers: pool.combos && !pool.incomplete ? CDN_CACHE_HEADERS : SHORT_CACHE_HEADERS });
}
