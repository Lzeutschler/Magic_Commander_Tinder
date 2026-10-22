import type { Card, Color } from "@/lib/cards/types";
import type { Bracket } from "@/lib/edhrec/types";
import { DECK_SIZE } from "@/lib/decks/types";

/** Deck slots the template budgets for, beyond lands and synergy cards. */
export type TemplateRole = "ramp" | "draw" | "interaction" | "boardwipe";

export const TEMPLATE_ROLES: TemplateRole[] = ["ramp", "draw", "interaction", "boardwipe"];

export const TEMPLATE_ROLE_LABELS: Record<TemplateRole, string> = {
  ramp: "Ramp",
  draw: "Card Draw",
  interaction: "Interaction",
  boardwipe: "Board Wipes",
};

export interface DeckTemplate {
  lands: number;
  /** How many of the lands should be nonbasic before basics fill the rest. */
  nonbasicLands: number;
  roles: Record<TemplateRole, number>;
  /** Target nonland card counts per mana value bucket (≤1, 2, 3, 4, 5, 6+). */
  curve: number[];
}

const DEFAULT_LANDS: Record<Bracket, number> = { 1: 37, 2: 37, 3: 36, 4: 35, 5: 31 };

const ROLE_TARGETS: Record<Bracket, Record<TemplateRole, number>> = {
  1: { ramp: 9, draw: 9, interaction: 7, boardwipe: 2 },
  2: { ramp: 10, draw: 10, interaction: 8, boardwipe: 3 },
  3: { ramp: 10, draw: 10, interaction: 9, boardwipe: 3 },
  4: { ramp: 12, draw: 11, interaction: 11, boardwipe: 3 },
  5: { ramp: 14, draw: 12, interaction: 14, boardwipe: 2 },
};

/** Share of nonland cards per mana value bucket; faster brackets curve lower. */
const CURVE_SHARES: Record<Bracket, number[]> = {
  1: [0.1, 0.22, 0.24, 0.2, 0.13, 0.11],
  2: [0.12, 0.24, 0.24, 0.18, 0.12, 0.1],
  3: [0.13, 0.26, 0.24, 0.17, 0.11, 0.09],
  4: [0.18, 0.28, 0.23, 0.15, 0.09, 0.07],
  5: [0.3, 0.3, 0.2, 0.1, 0.06, 0.04],
};

const NONBASICS_BY_COLORS = [4, 6, 12, 15, 17, 18];

export function deckTemplate(bracket: Bracket, colors: readonly Color[], averageLands: number | null): DeckTemplate {
  const lands = Math.round(Math.min(40, Math.max(30, averageLands ?? DEFAULT_LANDS[bracket])));
  const nonland = DECK_SIZE - lands;
  return {
    lands,
    nonbasicLands: Math.min(lands, NONBASICS_BY_COLORS[colors.length] + (bracket >= 4 ? 4 : 0)),
    roles: ROLE_TARGETS[bracket],
    curve: distribute(nonland, CURVE_SHARES[bracket]),
  };
}

export function templateRoles(card: Pick<Card, "roles">): TemplateRole[] {
  const roles: TemplateRole[] = [];
  if (card.roles.includes("ramp")) roles.push("ramp");
  if (card.roles.includes("draw")) roles.push("draw");
  if (card.roles.includes("removal") || card.roles.includes("counterspell")) roles.push("interaction");
  if (card.roles.includes("boardwipe")) roles.push("boardwipe");
  return roles;
}

/** Splits `total` into integer parts proportional to `shares` (largest remainder method). */
export function distribute(total: number, shares: readonly number[]): number[] {
  const sum = shares.reduce((a, b) => a + b, 0);
  if (sum <= 0) return shares.map(() => 0);
  const exact = shares.map((s) => (s / sum) * total);
  const parts = exact.map(Math.floor);
  let remaining = total - parts.reduce((a, b) => a + b, 0);
  const byRemainder = exact.map((x, i) => ({ i, r: x - Math.floor(x) })).sort((a, b) => b.r - a.r);
  for (const { i } of byRemainder) {
    if (remaining <= 0) break;
    parts[i] += 1;
    remaining -= 1;
  }
  return parts;
}
