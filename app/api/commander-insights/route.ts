import type { NextRequest } from "next/server";

import { getCommanderInsights } from "@/lib/server/candidates";
import { CDN_CACHE_HEADERS, badRequest } from "@/lib/server/http";

/** GET /api/commander-insights?commander=Krenko, Mob Boss → EDHREC themes and deck counts. */
export async function GET(request: NextRequest) {
  const commander = request.nextUrl.searchParams.get("commander");
  if (!commander) return badRequest("commander is required");

  const insights = await getCommanderInsights(commander);
  if (!insights) return badRequest(`Unknown commander: ${commander}`, 404);
  return Response.json(insights, { headers: CDN_CACHE_HEADERS });
}
