import "server-only";

import { edhrecSlug } from "@/lib/cards/names";
import { commandZoneSlug } from "@/lib/cards/pairing";
import type { Card } from "@/lib/cards/types";
import { EdhrecError, fetchCommanderPage, fetchPairingsPage } from "@/lib/edhrec/fetch-commander";
import type { Bracket } from "@/lib/edhrec/types";

import { recsSource } from "./source";
import type { CommanderStats, PairingStat } from "./types";

type Commander = Pick<Card, "name" | "typeLine">;

export interface StatsResult {
  stats: CommanderStats | null;
  /** The source could not be asked (down, busy or blocking us), so the answer should be retried soon. */
  failed: boolean;
}

/**
 * Deck statistics for a commander, or a pair of them, from the source RECS_SOURCE picks, or null with
 * the reason: stats the source does not have (or a switched-off source) are a fine answer to cache, a
 * failed request is not.
 */
export async function loadCommanderStats(commanders: readonly Commander[], bracket?: Bracket, theme?: string): Promise<StatsResult> {
  const source = recsSource();
  switch (source) {
    case "off":
      return { stats: null, failed: false };
    case "edhrec":
      return fromEdhrec(() => fetchCommanderPage(commandZoneSlug(commanders), bracket, theme), null);
    default:
      throw new Error(`Unhandled recommendation source: ${source satisfies never}`);
  }
}

/** The partners or Backgrounds decks play with `commander`, most decks first; empty without a source. */
export async function loadPairings(commander: Commander): Promise<{ pairings: PairingStat[]; failed: boolean }> {
  const source = recsSource();
  switch (source) {
    case "off":
      return { pairings: [], failed: false };
    case "edhrec": {
      const { stats, failed } = await fromEdhrec(() => fetchPairingsPage(edhrecSlug(commander.name)), []);
      return { pairings: stats ?? [], failed };
    }
    default:
      throw new Error(`Unhandled recommendation source: ${source satisfies never}`);
  }
}

async function fromEdhrec<T>(load: () => Promise<T>, missing: T | null): Promise<{ stats: T | null; failed: boolean }> {
  try {
    return { stats: await load(), failed: false };
  } catch (err) {
    const notThere = err instanceof EdhrecError && (err.status === 404 || err.status === 400);
    return { stats: notThere ? missing : null, failed: !notThere };
  }
}
