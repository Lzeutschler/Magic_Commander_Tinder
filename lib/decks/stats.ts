import { COLORS } from "@/lib/cards/colors";
import { colorPips, curveBucket, isLand } from "@/lib/cards/mana";
import type { Card, Color } from "@/lib/cards/types";
import { TEMPLATE_ROLES, templateRoles, type TemplateRole } from "@/lib/deckbuilder/template";

import type { DeckEntry } from "./types";

export const CARD_TYPES = [
  "Creature",
  "Planeswalker",
  "Battle",
  "Instant",
  "Sorcery",
  "Artifact",
  "Enchantment",
  "Land",
] as const;

export type CardType = (typeof CARD_TYPES)[number] | "Other";

/** Primary type for grouping, e.g. an Artifact Creature counts as a Creature. */
export function primaryType(card: Pick<Card, "typeLine">): CardType {
  const front = card.typeLine.split(" // ")[0];
  return CARD_TYPES.find((type) => front.includes(type)) ?? "Other";
}

export function expandEntries(entries: readonly DeckEntry[]): Card[] {
  return entries.flatMap((e) => Array.from({ length: e.quantity }, () => e.card));
}

export function deckCount(entries: readonly DeckEntry[]): number {
  return entries.reduce((sum, e) => sum + e.quantity, 0);
}

export interface DeckStats {
  total: number;
  lands: number;
  nonlands: number;
  curve: number[];
  averageManaValue: number;
  roles: Record<TemplateRole, number>;
  types: Partial<Record<CardType, number>>;
  /** Colored pips in nonland mana costs. */
  pips: Record<Color, number>;
  /** Lands that can produce each color. */
  sources: Record<Color, number>;
  gameChangers: number;
  priceUsd: number;
}

export function deckStats(deck: { entries: readonly DeckEntry[] }): DeckStats {
  const cards = expandEntries(deck.entries);
  const nonlands = cards.filter((c) => !isLand(c));
  const curve = [0, 0, 0, 0, 0, 0];
  const roles = Object.fromEntries(TEMPLATE_ROLES.map((r) => [r, 0])) as Record<TemplateRole, number>;
  const types: DeckStats["types"] = {};
  const pips = Object.fromEntries(COLORS.map((c) => [c, 0])) as Record<Color, number>;
  const sources = Object.fromEntries(COLORS.map((c) => [c, 0])) as Record<Color, number>;

  for (const card of cards) {
    const type = primaryType(card);
    types[type] = (types[type] ?? 0) + 1;
    if (isLand(card)) {
      for (const color of COLORS) if (card.producedMana.includes(color)) sources[color] += 1;
      continue;
    }
    curve[curveBucket(card.cmc)] += 1;
    for (const role of templateRoles(card)) roles[role] += 1;
    for (const [color, count] of Object.entries(colorPips(card.manaCost))) pips[color as Color] += count;
  }

  return {
    total: cards.length,
    lands: cards.length - nonlands.length,
    nonlands: nonlands.length,
    curve,
    averageManaValue: nonlands.length ? nonlands.reduce((s, c) => s + c.cmc, 0) / nonlands.length : 0,
    roles,
    types,
    pips,
    sources,
    gameChangers: cards.filter((c) => c.gameChanger).length,
    priceUsd: cards.reduce((sum, c) => sum + (c.priceUsd ?? 0), 0),
  };
}
