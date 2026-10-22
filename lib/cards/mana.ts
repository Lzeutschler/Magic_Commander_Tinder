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
