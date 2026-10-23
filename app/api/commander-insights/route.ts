import type { NextRequest } from "next/server";

import { findCard, getCardDb } from "@/lib/server/card-db";
import { getCommanderInsights } from "@/lib/server/candidates";
import { CDN_CACHE_HEADERS, SHORT_CACHE_HEADERS, badRequest, redirectToCanonical, rejectCrossSite } from "@/lib/server/http";

/** GET /api/commander-insights?commander=Krenko, Mob Boss → EDHREC themes and deck counts. */
export async function GET(request: NextRequest) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;

  const name = request.nextUrl.searchParams.get("commander");
  if (!name) return badRequest("commander is required");
  const commander = findCard(await getCardDb(), name);
  if (!commander) return badRequest(`Unknown commander: ${name}`, 404);
  const canonical = redirectToCanonical(request, [["commander", commander.name]]);
  if (canonical) return canonical;

  const insights = await getCommanderInsights(commander.name);
  if (!insights) return badRequest(`Unknown commander: ${name}`, 404);
  return Response.json(insights, { headers: insights.incomplete ? SHORT_CACHE_HEADERS : CDN_CACHE_HEADERS });
}
