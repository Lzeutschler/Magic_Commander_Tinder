import "server-only";

import { edhrecSlug } from "@/lib/cards/names";
import { EdhrecError, fetchCommanderPage } from "@/lib/edhrec/fetch-commander";
import type { Bracket } from "@/lib/edhrec/types";

import { recsSource } from "./source";
import type { CommanderStats } from "./types";

export interface StatsResult {
  stats: CommanderStats | null;
  /** The source could not be asked (down, busy or blocking us), so the answer should be retried soon. */
  failed: boolean;
}

/**
 * Deck statistics for a commander from the source RECS_SOURCE picks, or null with the reason: stats the
 * source does not have (or a switched-off source) are a fine answer to cache, a failed request is not.
 */
export async function loadCommanderStats(commanderName: string, bracket?: Bracket, theme?: string): Promise<StatsResult> {
  const source = recsSource();
  switch (source) {
    case "off":
      return { stats: null, failed: false };
    case "edhrec":
      return loadEdhrec(commanderName, bracket, theme);
    default:
      throw new Error(`Unhandled recommendation source: ${source satisfies never}`);
  }
}

async function loadEdhrec(commanderName: string, bracket?: Bracket, theme?: string): Promise<StatsResult> {
  try {
    return { stats: await fetchCommanderPage(edhrecSlug(commanderName), bracket, theme), failed: false };
  } catch (err) {
    const missing = err instanceof EdhrecError && (err.status === 404 || err.status === 400);
    return { stats: null, failed: !missing };
  }
}
