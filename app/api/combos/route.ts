import { z } from "zod";

import { findCombos } from "@/lib/server/combos";
import { badRequest } from "@/lib/server/http";

const bodySchema = z.object({
  commander: z.string().min(1).max(200),
  cards: z.array(z.string().min(1).max(200)).max(300),
});

/** POST /api/combos { commander, cards } → the Commander Spellbook combos the deck contains. */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest("Expected { commander: string, cards: string[] } with at most 300 cards");

  try {
    const cards = [...new Set(parsed.data.cards)].sort();
    return Response.json({ combos: await findCombos(parsed.data.commander, cards) });
  } catch (err) {
    return badRequest(`Combo check unavailable: ${(err as Error).message}`, 502);
  }
}
