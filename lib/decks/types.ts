import type { Card } from "@/lib/cards/types";
import type { Bracket } from "@/lib/edhrec/types";

export interface DeckEntry {
  card: Card;
  quantity: number;
}

export interface Deck {
  id: string;
  name: string;
  commander: Card;
  bracket: Bracket;
  theme: string | null;
  /** The 99, excluding the commander. */
  entries: DeckEntry[];
  /** Cards swiped up ("maybe") to review in the editor. */
  maybe: Card[];
  createdAt: number;
  updatedAt: number;
}

export const DECK_SIZE = 99;
