import type { Deck } from "@/lib/decks/types";
import { BRACKETS, type Bracket } from "@/lib/edhrec/types";

/** First line of every shared deck, so the format can change without breaking old links. */
const VERSION = "1";
/** Limits for links from strangers: a few KB of names, never a decompression bomb. */
const MAX_CODE_LENGTH = 8_000;
const MAX_TEXT_BYTES = 32_000;
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
 * Packs a deck into a URL-safe code, so a link carries the whole list without any server storage.
 * The text is one value per line (version, bracket, theme, name, commander, then the cards as
 * "Sol Ring" or "30<tab>Mountain"), deflated and base64url-encoded: about 1 KB for 99 cards.
 */
export async function encodeSharedDeck(deck: Pick<Deck, "name" | "bracket" | "theme" | "commander" | "entries">): Promise<string> {
  const cards = [...deck.entries]
    .sort((a, b) => a.card.name.localeCompare(b.card.name))
    .map((e) => (e.quantity > 1 ? `${e.quantity}\t${e.card.name}` : e.card.name));
  const name = deck.name.replace(/\s+/g, " ").trim().slice(0, 100);
  const text = [VERSION, String(deck.bracket), deck.theme ?? "", name, deck.commander.name, ...cards].join("\n");
  return toBase64Url(await transform(new TextEncoder().encode(text), new CompressionStream("deflate-raw")));
}

/** The deck in `code`, or null for anything that is not a valid share code. */
export async function decodeSharedDeck(code: string): Promise<SharedDeck | null> {
  if (!code || code.length > MAX_CODE_LENGTH || !/^[\w-]+$/.test(code)) return null;
  let text: string;
  try {
    text = new TextDecoder().decode(await transform(fromBase64Url(code), new DecompressionStream("deflate-raw"), MAX_TEXT_BYTES));
  } catch {
    return null;
  }

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

/** Runs `input` through a (de)compression stream, giving up once the output exceeds `maxBytes`. */
async function transform(input: Uint8Array<ArrayBuffer>, stream: CompressionStream | DecompressionStream, maxBytes = Infinity) {
  const reader = new Blob([input]).stream().pipeThrough(stream).getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > maxBytes) {
      await reader.cancel();
      throw new Error("Shared deck is too large");
    }
    chunks.push(value);
  }
  const output = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(code: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(code.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
}
