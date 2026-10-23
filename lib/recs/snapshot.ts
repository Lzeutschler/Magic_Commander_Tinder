import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { edhrecSlug } from "@/lib/cards/names";
import type { Card } from "@/lib/cards/types";

import type { SnapshotFile } from "./snapshot-format";
import type { CommanderStats } from "./types";

/**
 * What decks of a commander play according to the condensed EDHREC bulk data in data/recs-snapshot/
 * (scripts/build-recs-snapshot.ts), across all brackets and without themes. A pair gets both commanders'
 * cards, like `loadZoneStats` does for pairs with too few decks. Null when no commander has a file.
 */
export async function loadSnapshotStats(commanders: readonly Pick<Card, "name">[]): Promise<CommanderStats | null> {
  const files = (await Promise.all(commanders.map((c) => readSnapshot(edhrecSlug(c.name))))).filter(
    (f): f is SnapshotFile => f !== null,
  );
  if (!files.length) return null;
  return {
    deckCount: files.reduce((sum, f) => sum + f.deckCount, 0),
    themes: [],
    bracketCounts: {},
    averageLands: null,
    cards: files.flatMap((f) =>
      f.cards.map(([name, decks, synergy]) => ({ name, decks, synergy, inclusion: decks / f.deckCount })),
    ),
  };
}

async function readSnapshot(slug: string): Promise<SnapshotFile | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  try {
    return JSON.parse(await readFile(path.join(process.cwd(), "data/recs-snapshot", `${slug}.json`), "utf8")) as SnapshotFile;
  } catch {
    // No file: the commander has too few decks, or the snapshot was not built.
    return null;
  }
}
