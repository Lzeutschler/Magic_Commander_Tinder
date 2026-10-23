import { z } from "zod";

import { findCard, findCommandZone, getCardDb } from "@/lib/server/card-db";
import { findCombos } from "@/lib/server/combos";
import { badRequest, rejectCrossSite } from "@/lib/server/http";

/** A deck has 99 cards besides the commanders; a little headroom for decks still over the limit. */
const MAX_CARDS = 120;

const bodySchema = z.object({
  commanders: z.array(z.string().min(1).max(200)).min(1).max(2),
  cards: z.array(z.string().min(1).max(200)).max(MAX_CARDS),
});

/**
 * POST /api/combos { commanders, cards } → the Commander Spellbook combos the deck contains. Only real
 * cards are sent on, by their database names, so made-up lists never reach Commander Spellbook.
 */
export async function POST(request: Request) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(`Expected { commanders: string[], cards: string[] } with at most ${MAX_CARDS} cards`);

  const db = await getCardDb();
  const [name, partnerName = null] = parsed.data.commanders;
  const zone = findCommandZone(db, name, partnerName);
  if ("error" in zone) return badRequest(zone.error, zone.status);
  const cards = [...new Set(parsed.data.cards.flatMap((name) => findCard(db, name)?.name ?? []))].sort();

  try {
    return Response.json({ combos: await findCombos(zone.map((c) => c.name), cards) });
  } catch (err) {
    return badRequest(`Combo check unavailable: ${(err as Error).message}`, 502);
  }
}
