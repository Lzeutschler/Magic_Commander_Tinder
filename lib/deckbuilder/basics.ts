import { BASIC_FOR_COLOR } from "@/lib/cards/colors";
import type { Card, Color } from "@/lib/cards/types";
import { deckCount, deckStats } from "@/lib/decks/stats";
import { DECK_SIZE, type DeckEntry } from "@/lib/decks/types";

/**
 * Fills the deck up to 99 cards with basic lands, giving them to the colors whose mana sources fall
 * furthest short of their target. Each color the spells need aims for a quarter of the lands plus its
 * share of the colored pips, so a light splash still gets enough sources while nonbasic lands that
 * already make a color reduce its basics. Colorless commanders get Wastes.
 */
export function fillBasics(entries: readonly DeckEntry[], identity: readonly Color[], basics: readonly Card[]): DeckEntry[] {
  const needed = DECK_SIZE - deckCount(entries);
  if (needed <= 0) return [...entries];

  const byName = new Map(basics.map((b) => [b.name, b]));
  const stats = deckStats({ entries, commander: { colorIdentity: [...identity] } });
  const pips = identity.map((color) => stats.pips[color]);
  const totalPips = pips.reduce((a, b) => a + b, 0);
  const totalLands = stats.lands + needed;
  const targets = identity.map((_, i) =>
    totalPips > 0 ? (pips[i] > 0 ? totalLands * (0.25 + (0.75 * pips[i]) / totalPips) : 0) : totalLands / identity.length,
  );
  // One basic at a time to the color furthest below its target, relative to that target.
  const sources = identity.map((color) => stats.sources[color]);
  const quantities = identity.map(() => 0);
  for (let n = 0; identity.length && n < needed; n++) {
    let best = 0;
    for (let i = 1; i < identity.length; i++) {
      if (shortfall(targets[i], sources[i]) > shortfall(targets[best], sources[best])) best = i;
    }
    sources[best] += 1;
    quantities[best] += 1;
  }
  if (!identity.length) quantities.push(needed);
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

function shortfall(target: number, sources: number): number {
  return target > 0 ? (target - sources) / target : -Infinity;
}
