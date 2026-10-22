import { BASIC_FOR_COLOR } from "@/lib/cards/colors";
import type { Card, Color } from "@/lib/cards/types";
import { deckCount, deckStats } from "@/lib/decks/stats";
import { DECK_SIZE, type DeckEntry } from "@/lib/decks/types";

import { distribute } from "./template";

/**
 * Fills the deck up to 99 cards with basic lands, split by the colored pips of its spells.
 * Colorless commanders get Wastes.
 */
export function fillBasics(entries: readonly DeckEntry[], identity: readonly Color[], basics: readonly Card[]): DeckEntry[] {
  const needed = DECK_SIZE - deckCount(entries);
  if (needed <= 0) return [...entries];

  const byName = new Map(basics.map((b) => [b.name, b]));
  const pips = deckStats({ entries }).pips;
  const weights = identity.map((color) => pips[color]);
  const anyPips = weights.some((w) => w > 0);
  const quantities = identity.length
    ? distribute(needed, anyPips ? weights : identity.map(() => 1))
    : [needed];
  const names = identity.length ? identity.map((c) => BASIC_FOR_COLOR[c]) : ["Wastes"];

  const result = entries.map((e) => ({ ...e }));
  names.forEach((name, i) => {
    const card = byName.get(name);
    if (!card || quantities[i] === 0) return;
    const existing = result.find((e) => e.card.name === name);
    if (existing) existing.quantity += quantities[i];
    else result.push({ card, quantity: quantities[i] });
  });
  return result;
}
