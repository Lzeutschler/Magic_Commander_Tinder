import type { Card } from "@/lib/cards/types";
import type { Bracket } from "@/lib/edhrec/types";

import { comboBreaksBracket, comboPartners, combosCompletedBy, combosInDeck, type Combo } from "./combos";

export interface BracketInfo {
  name: string;
  tagline: string;
  description: string;
  maxGameChangers: number;
  /** Extra-turn cards allowed; brackets 2–3 allow a few but no chains. */
  maxExtraTurns: number;
  allowMassLandDenial: boolean;
}

/**
 * Commander Brackets (WotC beta, as of the October 2025 and February 2026 updates). The Game Changers
 * list itself comes from Scryfall's `game_changer` flag, so only the per-bracket limits live here.
 * Tutors are no longer restricted by the brackets; two-card combos are checked with Commander
 * Spellbook data (see combos.ts).
 */
export const BRACKET_INFO: Record<Bracket, BracketInfo> = {
  1: {
    name: "Exhibition",
    tagline: "Theme first, power last",
    description:
      "Theme over function, with thematic or substandard ways to win. No Game Changers, two-card combos, mass land denial or extra turns. Games last nine turns or more.",
    maxGameChangers: 0,
    maxExtraTurns: 0,
    allowMassLandDenial: false,
  },
  2: {
    name: "Core",
    tagline: "Casual, around precon power",
    description:
      "Wins that are incremental, telegraphed and disruptable. No Game Changers, two-card combos or mass land denial; few extra turns, never chained. Games last eight turns or more.",
    maxGameChangers: 0,
    maxExtraTurns: 1,
    allowMassLandDenial: false,
  },
  3: {
    name: "Upgraded",
    tagline: "Tuned and stronger than a precon",
    description:
      "Strong synergy and card quality; a win can come from one big turn. Up to three Game Changers, no early two-card combos, no mass land denial or chained extra turns. Games last six turns or more.",
    maxGameChangers: 3,
    maxExtraTurns: 1,
    allowMassLandDenial: false,
  },
  4: {
    name: "Optimized",
    tagline: "High power, anything goes",
    description:
      "Fast mana, tutors, free interaction and efficient wins. No restrictions beyond the banned list. Games last four turns or more.",
    maxGameChangers: Infinity,
    maxExtraTurns: Infinity,
    allowMassLandDenial: true,
  },
  5: {
    name: "cEDH",
    tagline: "Competitive tournament play",
    description: "The strongest possible deck for a competitive metagame. Games can end on any turn.",
    maxGameChangers: Infinity,
    maxExtraTurns: Infinity,
    allowMassLandDenial: true,
  },
};

interface BracketCounts {
  gameChangers: number;
  extraTurns: number;
}

export function bracketCounts(cards: readonly Card[]): BracketCounts {
  return {
    gameChangers: cards.filter((c) => c.gameChanger).length,
    extraTurns: cards.filter((c) => c.roles.includes("extraturn")).length,
  };
}

/** What the bracket check knows about the deck besides its cards. */
export interface BracketContext {
  /** Names of the commanders, which count as combo pieces. */
  commanders?: readonly string[];
  /** Commander Spellbook combos to check two-card combos against. */
  combos?: readonly Combo[] | null;
}

/** Why `card` would break the bracket if added to `deck`, or null when it fits. */
export function bracketViolation(card: Card, deck: readonly Card[], bracket: Bracket, context: BracketContext = {}): string | null {
  const rules = BRACKET_INFO[bracket];
  const counts = bracketCounts(deck);
  if (card.gameChanger && counts.gameChangers >= rules.maxGameChangers) {
    return rules.maxGameChangers === 0
      ? "Game Changers are not allowed in this bracket"
      : `Only ${rules.maxGameChangers} Game Changers allowed in this bracket`;
  }
  if (card.roles.includes("mld") && !rules.allowMassLandDenial) return "Mass land denial is not allowed in this bracket";
  if (card.roles.includes("extraturn") && counts.extraTurns >= rules.maxExtraTurns) {
    return rules.maxExtraTurns === 0 ? "Extra turns are not allowed in this bracket" : "Extra turns must not be chained in this bracket";
  }
  if (context.combos?.length && bracket <= 3) {
    const have = deckNames(deck, context.commanders);
    const combo = combosCompletedBy(card.name, context.combos, have).find((c) => comboBreaksBracket(c, bracket));
    if (combo) {
      return bracket <= 2
        ? `Forms a two-card combo with ${comboPartners(combo, card.name)}`
        : `Forms an early two-card combo with ${comboPartners(combo, card.name)}`;
    }
  }
  return null;
}

/** Bracket problems of a finished deck, for the editor. */
export function deckBracketIssues(cards: readonly Card[], bracket: Bracket, context: BracketContext = {}): string[] {
  const rules = BRACKET_INFO[bracket];
  const counts = bracketCounts(cards);
  const issues: string[] = [];
  if (counts.gameChangers > rules.maxGameChangers) {
    issues.push(`${counts.gameChangers} Game Changers (bracket ${bracket} allows ${rules.maxGameChangers})`);
  }
  if (!rules.allowMassLandDenial && cards.some((c) => c.roles.includes("mld"))) {
    issues.push("Contains mass land denial");
  }
  if (counts.extraTurns > rules.maxExtraTurns) {
    issues.push(`${counts.extraTurns} extra-turn cards (bracket ${bracket} allows ${rules.maxExtraTurns})`);
  }
  for (const combo of combosInDeck(context.combos ?? [], deckNames(cards, context.commanders))) {
    if (comboBreaksBracket(combo, bracket)) issues.push(`Two-card combo: ${comboPartners(combo)}`);
  }
  return issues;
}

function deckNames(cards: readonly Card[], commanders: readonly string[] = []): Set<string> {
  return new Set([...cards.map((c) => c.name), ...commanders]);
}
