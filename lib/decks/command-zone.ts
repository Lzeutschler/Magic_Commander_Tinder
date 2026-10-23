import { sortColors } from "@/lib/cards/colors";
import { commandZoneName } from "@/lib/cards/pairing";
import type { Card, Color } from "@/lib/cards/types";

import { DECK_SIZE, type Deck } from "./types";

type CommandZone = Pick<Deck, "commander" | "partner">;

/** The deck's commanders: the commander, then its partner when it has one. */
export function commandZone(deck: CommandZone): Card[] {
  return deck.partner ? [deck.commander, deck.partner] : [deck.commander];
}

/** Color identity of all commanders together. */
export function deckIdentity(deck: CommandZone): Color[] {
  return deck.partner ? sortColors([...deck.commander.colorIdentity, ...deck.partner.colorIdentity]) : deck.commander.colorIdentity;
}

/** Cards besides the commanders: 99, or 98 with a partner. */
export function mainDeckSize(deck: Pick<Deck, "partner">): number {
  return deck.partner ? DECK_SIZE - 1 : DECK_SIZE;
}

/** "Krenko, Mob Boss", or "Tymna & Kraum" for a pair. */
export function commanderTitle(deck: CommandZone): string {
  return commandZoneName(commandZone(deck));
}
