import type { NextRequest } from "next/server";

import { getCandidatePool } from "@/lib/server/candidates";
import { CDN_CACHE_HEADERS, SHORT_CACHE_HEADERS, badRequest, parseBracket } from "@/lib/server/http";

/** GET /api/candidates?commander=Krenko, Mob Boss&bracket=3&theme=tokens */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const commander = params.get("commander");
  if (!commander) return badRequest("commander is required");

  const pool = await getCandidatePool(commander, parseBracket(params.get("bracket")), params.get("theme") || null);
  if (!pool) return badRequest(`Unknown commander: ${commander}`, 404);
  // Without combos the bracket check is incomplete, so let the CDN retry soon instead of keeping it a day.
  return Response.json(pool, { headers: pool.combos ? CDN_CACHE_HEADERS : SHORT_CACHE_HEADERS });
}
