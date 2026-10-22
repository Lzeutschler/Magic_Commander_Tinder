import "server-only";

import { cacheLife } from "next/cache";
import { z } from "zod";

import type { Combo } from "@/lib/deckbuilder/combos";

import { findCard, getCardDb } from "./card-db";

const SPELLBOOK_URL = "https://backend.commanderspellbook.com/find-my-combos";
const TIMEOUT_MS = 10_000;

const variantSchema = z.object({
  id: z.string(),
  uses: z.array(z.object({ card: z.object({ name: z.string() }) })),
  produces: z.array(z.object({ feature: z.object({ name: z.string() }) })),
  bracketTag: z.string().nullish(),
  legalities: z.object({ commander: z.boolean().optional() }).partial().optional(),
});

const responseSchema = z.object({
  results: z.object({ included: z.array(variantSchema) }),
});

/**
 * All Commander Spellbook combos made only of the commander and `cards`, cached for a day.
 * Throws when Commander Spellbook is unreachable; callers treat that as "unknown", not "none".
 */
export async function findCombos(commander: string, cards: string[]): Promise<Combo[]> {
  "use cache";
  cacheLife("days");

  const res = await fetch(SPELLBOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "CommanderTinder/0.1" },
    body: JSON.stringify({ commanders: [{ card: commander }], main: cards.map((card) => ({ card })) }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Commander Spellbook: HTTP ${res.status}`);
  const parsed = responseSchema.safeParse(await res.json());
  if (!parsed.success) throw new Error("Commander Spellbook: unexpected format");

  const db = await getCardDb();
  const combos: Combo[] = [];
  for (const variant of parsed.data.results.included) {
    if (variant.legalities?.commander === false) continue;
    const pieces = variant.uses.map((use) => findCard(db, use.card.name));
    if (pieces.some((card) => !card)) continue;
    combos.push({
      id: variant.id,
      cards: [...new Set(pieces.map((card) => card!.name))],
      results: variant.produces.slice(0, 3).map((p) => p.feature.name),
      bracketTag: variant.bracketTag ?? null,
      manaValue: pieces.reduce((sum, card) => sum + card!.cmc, 0),
    });
  }
  return combos;
}
