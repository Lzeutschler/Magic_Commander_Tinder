import type { Deck } from "@/lib/decks/types";
import { BRACKETS, type Bracket } from "@/lib/edhrec/types";

import { packText, unpackText } from "./code";

/** First line of every shared deck, so the format can change without breaking old links. */
const VERSION = "1";
const MAX_CARD_LINES = 250;
const MAX_NAME_LENGTH = 200;

/** A deck as it travels in a share link: names only, looked up again when the link is opened. */
export interface SharedDeck {
  name: string;
  bracket: Bracket;
  theme: string | null;
  commander: string;
  cards: { name: string; quantity: number }[];
}

/**
 * The text a deck link carries: one value per line (version, bracket, theme, name, commander, then
 * the cards as "Sol Ring" or "30<tab>Mountain"). Packed, that is about 1 KB for 99 cards.
 */
export function sharedDeckText(deck: Pick<Deck, "name" | "bracket" | "theme" | "commander" | "entries">): string {
  const cards = [...deck.entries]
    .sort((a, b) => a.card.name.localeCompare(b.card.name))
    .map((e) => (e.quantity > 1 ? `${e.quantity}\t${e.card.name}` : e.card.name));
  const name = deck.name.replace(/\s+/g, " ").trim().slice(0, 100);
  return [VERSION, String(deck.bracket), deck.theme ?? "", name, deck.commander.name, ...cards].join("\n");
}

export function encodeSharedDeck(deck: Pick<Deck, "name" | "bracket" | "theme" | "commander" | "entries">): Promise<string> {
  return packText(sharedDeckText(deck));
}

/** The deck in `code`, or null for anything that is not a valid share code. */
export async function decodeSharedDeck(code: string): Promise<SharedDeck | null> {
  const text = await unpackText(code);
  if (text === null) return null;

  const [version, bracket, theme, name, commander, ...lines] = text.split("\n");
  const cardLines = lines.filter(Boolean);
  if (version !== VERSION || !commander || cardLines.length > MAX_CARD_LINES) return null;
  if (!BRACKETS.includes(Number(bracket) as Bracket)) return null;

  const cards = cardLines.map((line) => {
    const tab = line.indexOf("\t");
    return tab < 0 ? { name: line, quantity: 1 } : { name: line.slice(tab + 1), quantity: Number(line.slice(0, tab)) };
  });
  const valid = (n: string) => n.length > 0 && n.length <= MAX_NAME_LENGTH;
  if (!valid(commander) || cards.some((c) => !valid(c.name) || !Number.isInteger(c.quantity) || c.quantity < 1 || c.quantity > 99)) {
    return null;
  }
  return { name: name || commander, bracket: Number(bracket) as Bracket, theme: theme || null, commander, cards };
}
