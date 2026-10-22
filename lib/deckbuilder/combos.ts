import type { Bracket } from "@/lib/edhrec/types";

/** A combo from Commander Spellbook, with card names as in our card database. */
export interface Combo {
  id: string;
  /** Every card the combo needs, including the commander when it takes part. */
  cards: string[];
  /** What the combo produces, e.g. "Infinite creature tokens". */
  results: string[];
  /**
   * Commander Spellbook's power estimate: E(xhibition), C(ore), O(ddball), P(owerful), S(picy),
   * R(uthless) or B(anned).
   */
  bracketTag: string | null;
  /** Combined mana value of the cards, a proxy for how early the combo can come together. */
  manaValue: number;
}

/** Two-card combos at or below this combined mana value can assemble within the first six turns. */
const EARLY_COMBO_MANA_VALUE = 6;

/**
 * Whether the official bracket guidelines rule out `combo`: brackets 1–2 allow no two-card
 * combos, bracket 3 no early ones (cheap, or rated Ruthless by Commander Spellbook).
 */
export function comboBreaksBracket(combo: Combo, bracket: Bracket): boolean {
  if (combo.cards.length > 2 || bracket >= 4) return false;
  if (bracket <= 2) return true;
  return combo.manaValue <= EARLY_COMBO_MANA_VALUE || combo.bracketTag === "R";
}

/** Combos that `cardName` would complete, given the names of the commander and the cards already in the deck. */
export function combosCompletedBy(cardName: string, combos: readonly Combo[], have: ReadonlySet<string>): Combo[] {
  if (have.has(cardName)) return [];
  return combos.filter((combo) => combo.cards.includes(cardName) && combo.cards.every((name) => name === cardName || have.has(name)));
}

/** Combos fully contained in the deck (names include the commander). */
export function combosInDeck(combos: readonly Combo[], have: ReadonlySet<string>): Combo[] {
  return combos.filter((combo) => combo.cards.every((name) => have.has(name)));
}

/** "Kiki-Jiki, Mirror Breaker + Helm of the Host" for the given combo, without `except`. */
export function comboPartners(combo: Combo, except?: string): string {
  return combo.cards.filter((name) => name !== except).join(" + ");
}
