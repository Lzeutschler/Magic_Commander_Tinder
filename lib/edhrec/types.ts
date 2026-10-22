export type Bracket = 1 | 2 | 3 | 4 | 5;

export const BRACKETS: Bracket[] = [1, 2, 3, 4, 5];

/** EDHREC URL segment for each Commander bracket. */
export const BRACKET_SLUGS: Record<Bracket, string> = {
  1: "exhibition",
  2: "core",
  3: "upgraded",
  4: "optimized",
  5: "cedh",
};

export interface EdhrecTheme {
  slug: string;
  label: string;
  deckCount: number;
}

export interface EdhrecCardStat {
  name: string;
  /** EDHREC synergy score, roughly -1..1: how much more often the card is played with this commander. */
  synergy: number;
  /** Share of this commander's decks that run the card, 0..1. */
  inclusion: number;
  decks: number;
  /** EDHREC list the card appeared in, e.g. "highsynergycards", "manaartifacts". */
  list: string;
}

export interface EdhrecCommanderPage {
  deckCount: number;
  themes: EdhrecTheme[];
  bracketCounts: Partial<Record<Bracket, number>>;
  /** Average land count across the commander's decks, when EDHREC reports it. */
  averageLands: number | null;
  cards: EdhrecCardStat[];
}
