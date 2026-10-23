import type { Bracket } from "@/lib/edhrec/types";

/** A deck theme of one commander, e.g. Tokens, with how many of its decks follow it. */
export interface CommanderTheme {
  slug: string;
  label: string;
  deckCount: number;
}

export interface CardStat {
  name: string;
  /** Synergy score, roughly -1..1: how much more often the card is played with this commander. */
  synergy: number;
  /** Share of this commander's decks that run the card, 0..1. */
  inclusion: number;
  decks: number;
}

/** What decks of one commander play, optionally narrowed to a bracket and a theme. */
export interface CommanderStats {
  deckCount: number;
  themes: CommanderTheme[];
  bracketCounts: Partial<Record<Bracket, number>>;
  /** Average land count across the commander's decks, when the source reports it. */
  averageLands: number | null;
  cards: CardStat[];
}
