import type { Deck } from "@/lib/decks/types";
import { primaryType } from "@/lib/decks/stats";

export type ExportFormat = "sections" | "plain";

export const EXPORT_FORMATS: { id: ExportFormat; label: string; hint: string }[] = [
  { id: "sections", label: "Moxfield / Archidekt / Arena", hint: "Commander and Deck sections" },
  { id: "plain", label: "Plain list", hint: "One card per line, commander first" },
];

/** Deck list as text, e.g. "1 Sol Ring". Cards are sorted by type, then name. */
export function exportDeck(deck: Pick<Deck, "commander" | "entries">, format: ExportFormat): string {
  const lines = [...deck.entries]
    .sort((a, b) => primaryType(a.card).localeCompare(primaryType(b.card)) || a.card.name.localeCompare(b.card.name))
    .map((e) => `${e.quantity} ${e.card.name}`);
  const commander = `1 ${deck.commander.name}`;

  if (format === "plain") return [commander, ...lines].join("\n");
  return ["Commander", commander, "", "Deck", ...lines].join("\n");
}

export function deckFileName(deck: Pick<Deck, "name">): string {
  return `${deck.name.replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-") || "deck"}.txt`;
}
