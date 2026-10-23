import { z } from "zod";

import { findCard, getCardDb } from "@/lib/server/card-db";
import { findCombos } from "@/lib/server/combos";
import { badRequest, rejectCrossSite } from "@/lib/server/http";

/** A deck has 99 cards besides the commander; a little headroom for decks still over the limit. */
const MAX_CARDS = 120;

const bodySchema = z.object({
  commander: z.string().min(1).max(200),
  cards: z.array(z.string().min(1).max(200)).max(MAX_CARDS),
});

/**
 * POST /api/combos { commander, cards } → the Commander Spellbook combos the deck contains. Only real
 * cards are sent on, by their database names, so made-up lists never reach Commander Spellbook.
 */
export async function POST(request: Request) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(`Expected { commander: string, cards: string[] } with at most ${MAX_CARDS} cards`);

  const db = await getCardDb();
  const commander = findCard(db, parsed.data.commander);
  if (!commander) return badRequest(`Unknown commander: ${parsed.data.commander}`, 404);
  const cards = [...new Set(parsed.data.cards.flatMap((name) => findCard(db, name)?.name ?? []))].sort();

  try {
    return Response.json({ combos: await findCombos(commander.name, cards) });
  } catch (err) {
    return badRequest(`Combo check unavailable: ${(err as Error).message}`, 502);
  }
}
