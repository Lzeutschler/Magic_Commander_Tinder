import "server-only";

import { cache } from "react";

import type { Card } from "@/lib/cards/types";
import { decodeSharedDeck } from "@/lib/deck-io/share";
import type { DeckEntry } from "@/lib/decks/types";
import type { Bracket } from "@/lib/edhrec/types";

import { findCard, getCardDb } from "./card-db";

export interface ResolvedSharedDeck {
  name: string;
  bracket: Bracket;
  theme: string | null;
  commander: Card;
  entries: DeckEntry[];
  /** Names in the link that are not in our card database (renamed or not Commander-legal). */
  missing: string[];
}

/**
 * The deck behind a share code with its cards looked up, or null when the code is broken or names
 * an unknown commander. Cached per request, since the page, its metadata and its image all need it.
 */
export const loadSharedDeck = cache(async (code: string): Promise<ResolvedSharedDeck | null> => {
  const shared = await decodeSharedDeck(code);
  if (!shared) return null;
  const db = await getCardDb();
  const commander = findCard(db, shared.commander);
  if (!commander) return null;

  const entries = new Map<string, DeckEntry>();
  const missing: string[] = [];
  for (const { name, quantity } of shared.cards) {
    const card = findCard(db, name);
    if (!card) {
      missing.push(name);
      continue;
    }
    entries.set(card.id, { card, quantity: (entries.get(card.id)?.quantity ?? 0) + quantity });
  }
  return { name: shared.name, bracket: shared.bracket, theme: shared.theme, commander, entries: [...entries.values()], missing };
});
