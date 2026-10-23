import type { Color } from "@/lib/cards/types";

/**
 * One commander's file in data/recs-snapshot/, condensed from EDHREC's bulk data by
 * scripts/build-recs-snapshot.ts: the commander's deck count and its cards as [name, decks, synergy],
 * most decks first.
 */
export interface SnapshotFile {
  deckCount: number;
  cards: [name: string, decks: number, synergy: number][];
}

/** A card of the bulk data, or null when the card database does not know it. */
export interface SnapshotCard {
  name: string;
  /** Color identity as a bit mask, see `colorMask`. */
  mask: number;
  /** Basic lands and other cards never worth suggesting. */
  skip: boolean;
}

/** One commander's rows of the bulk data: indexes into the card list and how many decks play each card. */
export interface SnapshotCommander {
  name: string;
  mask: number;
  cards: Int32Array;
  counts: Int32Array;
  length: number;
}

export interface CondenseOptions {
  /** Commanders with fewer decks get no file: their shares are noise. */
  minDecks: number;
  /** Cards kept per commander by deck count. */
  topByDecks: number;
  /** Further cards kept per commander by synergy, beyond those. */
  topBySynergy: number;
}

export const CONDENSE_DEFAULTS: CondenseOptions = { minDecks: 20, topByDecks: 200, topBySynergy: 60 };

const COLOR_BITS: Record<Color, number> = { W: 1, U: 2, B: 4, R: 8, G: 16 };

/** Color identity as a bit mask, so `(card & ~commander) === 0` means the card fits the commander. */
export function colorMask(colors: readonly Color[]): number {
  return colors.reduce((mask, c) => mask | COLOR_BITS[c], 0);
}

/** Splits one CSV line into fields, honouring quotes and doubled quotes inside them. */
export function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (quoted && char === '"' && line[i + 1] === '"') {
      field += '"';
      i++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      fields.push(field);
      field = "";
    } else {
      field += char;
    }
  }
  fields.push(field);
  return fields;
}

/**
 * Condenses the bulk data into one file per commander. The data has no deck totals, so a commander's
 * deck count is the count of its most played card (a basic land or Command Tower, in nearly every deck).
 * Synergy follows EDHREC: the card's share of this commander's decks minus its share of all decks with
 * the same color identity. Cards outside the commander's identity are left out; they come from partner
 * decks, which the data files under one of the two partners.
 */
export function condenseSnapshot(
  commanders: readonly SnapshotCommander[],
  cards: readonly (SnapshotCard | null)[],
  options: CondenseOptions = CONDENSE_DEFAULTS,
): Map<string, SnapshotFile> {
  const decksOf = commanders.map((c) => {
    let max = 0;
    for (let i = 0; i < c.length; i++) max = Math.max(max, c.counts[i]);
    return max;
  });

  // Decks and card counts per color identity, for the baseline that synergy compares against.
  const identityDecks = new Float64Array(32);
  const identityCards = new Float64Array(32 * cards.length);
  commanders.forEach((c, n) => {
    identityDecks[c.mask] += decksOf[n];
    for (let i = 0; i < c.length; i++) {
      const card = cards[c.cards[i]];
      if (card && (card.mask & ~c.mask) === 0) identityCards[c.mask * cards.length + c.cards[i]] += c.counts[i];
    }
  });

  const files = new Map<string, SnapshotFile>();
  commanders.forEach((c, n) => {
    const deckCount = decksOf[n];
    if (deckCount < options.minDecks) return;
    const rows: SnapshotFile["cards"] = [];
    for (let i = 0; i < c.length; i++) {
      const card = cards[c.cards[i]];
      if (!card || card.skip || card.name === c.name || (card.mask & ~c.mask) !== 0) continue;
      const base = identityCards[c.mask * cards.length + c.cards[i]] / identityDecks[c.mask];
      rows.push([card.name, c.counts[i], round(c.counts[i] / deckCount - base)]);
    }

    const byDecks = [...rows].sort((a, b) => b[1] - a[1]);
    const kept = new Set(byDecks.slice(0, options.topByDecks));
    // A card in two or three decks of a small commander is not a pattern yet.
    const minSynergyDecks = Math.max(3, Math.ceil(deckCount * 0.02));
    const bySynergy = rows.filter((r) => !kept.has(r) && r[2] > 0 && r[1] >= minSynergyDecks).sort((a, b) => b[2] - a[2]);
    for (const row of bySynergy.slice(0, options.topBySynergy)) kept.add(row);

    files.set(c.name, { deckCount, cards: byDecks.filter((r) => kept.has(r)) });
  });
  return files;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
