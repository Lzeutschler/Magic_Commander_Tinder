import { BASIC_FOR_COLOR } from "@/lib/cards/colors";
import type { Card, Color } from "@/lib/cards/types";
import { deckCount, deckStats } from "@/lib/decks/stats";
import { DECK_SIZE, type DeckEntry } from "@/lib/decks/types";

/**
 * Adds basic lands until the deck reaches `landTarget` lands (never past `size` cards), giving them to the
 * colors whose mana sources fall furthest short of their target. Open spell slots stay open, so
 * finishing early never turns a half-built deck into a pile of basics. Each color the spells need aims for a quarter of the lands plus its
 * share of the colored pips, so a light splash still gets enough sources while nonbasic lands that
 * already make a color reduce its basics. Colorless commanders get Wastes.
 */
export function fillBasics(
  entries: readonly DeckEntry[],
  identity: readonly Color[],
  basics: readonly Card[],
  landTarget: number,
  size: number = DECK_SIZE,
): DeckEntry[] {
  const stats = deckStats({ entries, commander: { colorIdentity: [...identity] } });
  const needed = Math.min(size - deckCount(entries), landTarget - stats.lands);
  if (needed <= 0) return [...entries];

  const byName = new Map(basics.map((b) => [b.name, b]));
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
