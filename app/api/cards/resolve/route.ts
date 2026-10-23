import { z } from "zod";

import type { Card } from "@/lib/cards/types";
import { findCard, getCardDb } from "@/lib/server/card-db";
import { badRequest, rejectCrossSite } from "@/lib/server/http";

const bodySchema = z.object({ names: z.array(z.string().min(1).max(200)).max(300) });

/** POST /api/cards/resolve { names } → the matching cards plus names that were not found. */
export async function POST(request: Request) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest("Expected { names: string[] } with at most 300 names");

  const db = await getCardDb();
  const cards: Record<string, Card> = {};
  const missing: string[] = [];
  for (const name of new Set(parsed.data.names)) {
    const card = findCard(db, name);
    if (card) cards[name] = card;
    else missing.push(name);
  }
  return Response.json({ cards, missing });
}
