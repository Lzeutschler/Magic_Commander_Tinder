import type { Card, Color } from "./types";

const COLOR_SET = new Set(["W", "U", "B", "R", "G"]);

/**
 * Colored pips in a mana cost: "{1}{W}{W}" → { W: 2 }. Hybrid symbols count half for each
 * color, Phyrexian and twobrid symbols count fully.
 */
export function colorPips(manaCost: string): Partial<Record<Color, number>> {
  const pips: Partial<Record<Color, number>> = {};
  for (const [, symbol] of manaCost.matchAll(/\{([^}]+)\}/g)) {
    const colors = symbol.split("/").filter((part) => COLOR_SET.has(part)) as Color[];
    const weight = colors.length > 1 ? 1 / colors.length : 1;
    for (const color of colors) pips[color] = (pips[color] ?? 0) + weight;
  }
  return pips;
}

export function isLand(card: Pick<Card, "typeLine">): boolean {
  return card.typeLine.split(" // ")[0].includes("Land");
}

/** Mana value bucket for curve charts: 0–1, 2, 3, 4, 5, 6+ → 0..5. */
export function curveBucket(cmc: number): number {
  return Math.min(Math.max(Math.round(cmc), 1), 6) - 1;
}

export const CURVE_LABELS = ["≤1", "2", "3", "4", "5", "6+"];

const BASIC_TYPES: [string, Color][] = [
  ["plains", "W"],
  ["island", "U"],
  ["swamp", "B"],
  ["mountain", "R"],
  ["forest", "G"],
];

/**
 * Colors of `identity` a land can produce. Scryfall has no produced mana for fetch lands, so lands that
 * search for a basic land type (Misty Rainforest) or any basic land (Evolving Wilds) count for those colors.
 */
export function landColors(card: Pick<Card, "producedMana" | "oracleText">, identity: readonly Color[]): Color[] {
  const colors = new Set(card.producedMana.filter((m): m is Color => identity.includes(m as Color)));
  const search = card.oracleText.toLowerCase().match(/search your library for an? ([^.]*?)card/);
  if (search) {
    const wanted = search[1];
    if (/\bbasic land\b/.test(wanted)) identity.forEach((c) => colors.add(c));
    for (const [type, color] of BASIC_TYPES) if (wanted.includes(type) && identity.includes(color)) colors.add(color);
  }
  return identity.filter((c) => colors.has(c));
}
