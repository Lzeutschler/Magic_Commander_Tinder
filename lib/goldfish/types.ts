import type { Card } from "@/lib/cards/types";

export type ZoneId = "library" | "hand" | "battlefield" | "graveyard" | "exile" | "command";

export const ZONE_LABELS: Record<ZoneId, string> = {
  library: "Library",
  hand: "Hand",
  battlefield: "Battlefield",
  graveyard: "Graveyard",
  exile: "Exile",
  command: "Command Zone",
};

/** The card fields the sandbox needs; deck cards and tokens both fit. */
export type PlayCard = Pick<Card, "id" | "name" | "manaCost" | "cmc" | "typeLine" | "oracleText" | "image" | "producedMana">;

export interface GameCard {
  instanceId: string;
  card: PlayCard;
  tapped: boolean;
  /** Counter kind → amount, e.g. { "+1/+1": 2 }. */
  counters: Record<string, number>;
  faceDown: boolean;
  /** Showing the back face of a double-faced card. */
  flipped: boolean;
  isToken: boolean;
  isCommander: boolean;
}

export interface GameState {
  cards: Record<string, GameCard>;
  /** Instance ids per zone; index 0 of the library is its top card. */
  zones: Record<ZoneId, string[]>;
  life: number;
  turn: number;
  /** "mulligan" until the opening hand is kept and any London mulligan cards are on the bottom. */
  phase: "mulligan" | "bottom" | "playing";
  mulligans: number;
  commanderCasts: number;
  seed: number;
  /** Increments with every shuffle so each one uses fresh randomness. */
  shuffles: number;
  nextInstance: number;
  log: string[];
}

/** How the player arranged cards after scry, surveil or a reveal. */
export interface LookResult {
  top: string[];
  bottom: string[];
  graveyard: string[];
}
