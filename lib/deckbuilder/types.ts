import type { Card } from "@/lib/cards/types";
import type { Bracket, EdhrecTheme } from "@/lib/edhrec/types";

import type { Combo } from "./combos";

/** A card the swipe deck can offer, with how well it fits the commander. */
export interface Candidate extends Card {
  /** EDHREC synergy (-1..1) or a heuristic estimate for fallback cards. */
  synergy: number;
  /** Share of comparable decks running the card (0..1), or an estimate from popularity. */
  inclusion: number;
}

export interface CandidatePool {
  commander: Card;
  bracket: Bracket;
  theme: string | null;
  source: "edhrec" | "fallback";
  deckCount: number;
  averageLands: number | null;
  candidates: Candidate[];
  /** Commander Spellbook combos among the commander and the candidates; null when Spellbook was unreachable. */
  combos: Combo[] | null;
  /** Basic lands for the commander's colors (Wastes when colorless), used to finish the deck. */
  basicLands: Card[];
  /** EDHREC could not be asked (down, busy or blocking us), so this pool is only cached briefly. */
  incomplete?: boolean;
}

export interface CommanderInsights {
  commander: Card;
  deckCount: number;
  themes: EdhrecTheme[];
  bracketCounts: Partial<Record<Bracket, number>>;
  /** EDHREC could not be asked, so the answer is only cached briefly. */
  incomplete?: boolean;
}
