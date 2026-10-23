import type { NextRequest } from "next/server";

import { findCommandZone, getCardDb } from "@/lib/server/card-db";
import { getCommanderInsights } from "@/lib/server/candidates";
import { CDN_CACHE_HEADERS, SHORT_CACHE_HEADERS, badRequest, redirectToCanonical, rejectCrossSite } from "@/lib/server/http";

/**
 * GET /api/commander-insights?commander=Krenko, Mob Boss → EDHREC themes and deck counts, with &partner=…
 * for a pair. A lone commander that can take a partner also gets the pairings decks play.
 */
export async function GET(request: NextRequest) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;

  const params = request.nextUrl.searchParams;
  const name = params.get("commander");
  if (!name) return badRequest("commander is required");
  const zone = findCommandZone(await getCardDb(), name, params.get("partner") || null);
  if ("error" in zone) return badRequest(zone.error, zone.status);
  const canonical = redirectToCanonical(request, [
    ["commander", zone[0].name],
    ["partner", zone[1]?.name ?? null],
  ]);
  if (canonical) return canonical;

  const insights = await getCommanderInsights(zone);
  return Response.json(insights, { headers: insights.incomplete ? SHORT_CACHE_HEADERS : CDN_CACHE_HEADERS });
}
