import type { Card } from "@/lib/cards/types";
import type { Bracket } from "@/lib/edhrec/types";

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
 * Commander Brackets (WotC beta). The Game Changers list itself comes from Scryfall's
 * `game_changer` flag, so only the per-bracket limits live here.
 */
export const BRACKET_INFO: Record<Bracket, BracketInfo> = {
  1: {
    name: "Exhibition",
    tagline: "Theme first, power last",
    description: "Ultra-casual decks built around a fun idea. No Game Changers, no mass land denial, no extra turns.",
    maxGameChangers: 0,
    maxExtraTurns: 0,
    allowMassLandDenial: false,
  },
  2: {
    name: "Core",
    tagline: "Precon power level",
    description: "Like a modern preconstructed deck. No Game Changers, no mass land denial, no chained extra turns.",
    maxGameChangers: 0,
    maxExtraTurns: 1,
    allowMassLandDenial: false,
  },
  3: {
    name: "Upgraded",
    tagline: "Tuned and stronger than a precon",
    description: "Focused synergy and strong cards. Up to three Game Changers, no mass land denial or chained extra turns.",
    maxGameChangers: 3,
    maxExtraTurns: 1,
    allowMassLandDenial: false,
  },
  4: {
    name: "Optimized",
    tagline: "High power, anything goes",
    description: "Lethal, efficient and consistent. No restrictions beyond the banned list.",
    maxGameChangers: Infinity,
    maxExtraTurns: Infinity,
    allowMassLandDenial: true,
  },
  5: {
    name: "cEDH",
    tagline: "Competitive tournament play",
    description: "The strongest possible deck for a competitive metagame.",
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

/** Why `card` would break the bracket if added to `deck`, or null when it fits. */
export function bracketViolation(card: Card, deck: readonly Card[], bracket: Bracket): string | null {
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
  return null;
}

/** Bracket problems of a finished deck, for the editor. */
export function deckBracketIssues(cards: readonly Card[], bracket: Bracket): string[] {
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
  return issues;
}
