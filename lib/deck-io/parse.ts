export interface ParsedLine {
  name: string;
  quantity: number;
}

export interface ParsedDeckList {
  commanders: ParsedLine[];
  cards: ParsedLine[];
  maybe: ParsedLine[];
}

type Section = "commanders" | "cards" | "maybe" | "skip";

const SECTION_HEADERS: [RegExp, Section][] = [
  [/^(commanders?|command zone)$/i, "commanders"],
  [/^(deck|main ?deck|mainboard)$/i, "cards"],
  [/^(maybe(board)?|considering)$/i, "maybe"],
  // A companion starts the game outside the deck, so it is not one of the 99.
  [/^(sideboard|tokens?|companions?)$/i, "skip"],
];

/**
 * Parses deck lists from Moxfield, Archidekt, MTG Arena, MTGO and plain text:
 * "1 Sol Ring", "1x Sol Ring (CMM) 410 *F*", "Sol Ring", section headers, "*CMDR*" or
 * "[Commander]" markers and "SB:" lines.
 */
export function parseDeckList(text: string): ParsedDeckList {
  const result: ParsedDeckList = { commanders: [], cards: [], maybe: [] };
  let section: Section = "cards";

  for (const rawLine of text.split(/\r?\n/)) {
    let line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const header = line.replace(/^\/\/\s*/, "").replace(/:$/, "").trim();
    const matchedHeader = SECTION_HEADERS.find(([re]) => re.test(header));
    if (matchedHeader) {
      section = matchedHeader[1];
      continue;
    }
    if (line.startsWith("//")) continue;
    if (/^SB:\s*/i.test(line)) continue;

    let target = section;
    if (/\*CMDR\*|\[commander[^\]]*\]/i.test(line)) target = "commanders";
    line = line
      .replace(/\*CMDR\*/gi, "")
      .replace(/\[[^\]]*\]/g, "")
      .replace(/\^[^^]*\^/g, "")
      .replace(/\*[A-Z]+\*/g, "")
      .trim();

    const match = line.match(/^(\d+)\s*x?\s+(.+)$/i);
    const quantity = match ? Number(match[1]) : 1;
    // Drop set code and collector number: "Sol Ring (CMM) 410" → "Sol Ring".
    const name = (match ? match[2] : line).replace(/\s+\([A-Z0-9]{2,6}\)(\s+\S+)?$/i, "").trim();
    if (!name || target === "skip") continue;
    result[target].push({ name, quantity });
  }
  return result;
}
