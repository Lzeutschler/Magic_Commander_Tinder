import type { Card } from "@/lib/cards/types";
import type { DeckSettings } from "@/lib/deckbuilder/settings";
import type { DeckTemplate } from "@/lib/deckbuilder/template";
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
  /** Swipe targets and preferences, editable before and while swiping. */
  settings: DeckSettings;
  /**
   * The template recommended for this commander and bracket, from EDHREC data when the swipe started.
   * Missing for imported decks, which fall back to the bracket defaults.
   */
  recommendation?: DeckTemplate;
  createdAt: number;
  updatedAt: number;
}

export const DECK_SIZE = 99;
