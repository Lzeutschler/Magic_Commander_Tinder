import "server-only";

import { cacheLife } from "next/cache";
import { z } from "zod";

import type { CardStat, CommanderStats, PairingStat } from "@/lib/recs/types";
import { upstreamFetch } from "@/lib/server/upstream";
import { USER_AGENT } from "@/lib/site";

import { BRACKET_SLUGS, isEdhrecSlug, type Bracket } from "./types";

const TIMEOUT_MS = 10_000;

const cardViewSchema = z.object({
  name: z.string(),
  synergy: z.number().nullish(),
  num_decks: z.number().nullish(),
  potential_decks: z.number().nullish(),
});

const pageSchema = z.object({
  land: z.number().optional(),
  tag_counts: z.array(z.object({ count: z.number(), slug: z.string(), value: z.string() })).optional(),
  bracket_counts: z.record(z.string(), z.number()).optional(),
  container: z.object({
    json_dict: z.object({
      card: z.object({ num_decks: z.number().optional() }).optional(),
      cardlists: z.array(z.object({ tag: z.string(), cardviews: z.array(cardViewSchema) })),
    }),
  }),
});

/** EDHREC answers a pair in the other order with `{ "redirect": "/commanders/a-b" }`. */
const redirectSchema = z.object({ redirect: z.string().regex(/^\/commanders\/[a-z0-9-]+(?:\/[a-z0-9-]+)*$/) });

const pairingsSchema = z.object({
  container: z.object({
    json_dict: z.object({
      cardlists: z.array(z.object({ cardviews: z.array(z.object({ name: z.string(), num_decks: z.number().nullish() })) })),
    }),
  }),
});

const HEADERS = { "User-Agent": USER_AGENT, Accept: "application/json" };

export class EdhrecError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/**
 * Fetches a commander page from EDHREC's (unofficial) JSON endpoint, optionally filtered by
 * bracket and theme, e.g. /pages/commanders/krenko-mob-boss/core/tokens.json. `slug` may name a pair
 * (see `commandZoneSlug`). Cached for a day.
 */
export async function fetchCommanderPage(
  slug: string,
  bracket?: Bracket,
  theme?: string,
): Promise<CommanderStats> {
  "use cache";
  cacheLife("days");

  const segments = [slug, bracket ? BRACKET_SLUGS[bracket] : null, theme].filter(Boolean).join("/");
  if (!isEdhrecSlug(slug) || (theme !== undefined && !isEdhrecSlug(theme))) {
    throw new EdhrecError(`EDHREC ${segments}: not a page`, 400);
  }
  let json = await getPage(`commanders/${segments}`);
  const redirect = redirectSchema.safeParse(json);
  if (redirect.success) json = await getPage(redirect.data.redirect.slice(1));

  const parsed = pageSchema.safeParse(json);
  if (!parsed.success) throw new EdhrecError(`EDHREC ${segments}: unexpected format`, 502);
  return normalize(parsed.data);
}

/**
 * The commanders and Backgrounds most often paired with a commander, most decks first, from EDHREC's
 * pairings page, e.g. /pages/partners/tymna-the-weaver.json. Cached for a day.
 */
export async function fetchPairingsPage(slug: string): Promise<PairingStat[]> {
  "use cache";
  cacheLife("days");

  if (!isEdhrecSlug(slug)) throw new EdhrecError(`EDHREC partners/${slug}: not a page`, 400);
  const parsed = pairingsSchema.safeParse(await getPage(`partners/${slug}`));
  if (!parsed.success) throw new EdhrecError(`EDHREC partners/${slug}: unexpected format`, 502);
  return parsed.data.container.json_dict.cardlists
    .flatMap((list) => list.cardviews)
    .map((view) => ({ name: view.name, deckCount: view.num_decks ?? 0 }))
    .sort((a, b) => b.deckCount - a.deckCount);
}

async function getPage(path: string): Promise<unknown> {
  const res = await upstreamFetch("edhrec", `https://json.edhrec.com/pages/${path}.json`, {
    headers: HEADERS,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new EdhrecError(`EDHREC ${path}: HTTP ${res.status}`, res.status);
  return res.json();
}

function normalize(page: z.infer<typeof pageSchema>): CommanderStats {
  const { cardlists, card } = page.container.json_dict;
  const stats = new Map<string, CardStat>();
  // On bracket/theme pages `card.num_decks` is the unfiltered total; potential_decks is filtered.
  let filteredDecks = 0;

  for (const list of cardlists) {
    for (const view of list.cardviews) {
      const potential = view.potential_decks ?? 0;
      filteredDecks = Math.max(filteredDecks, potential);
      if (stats.has(view.name)) continue;
      stats.set(view.name, {
        name: view.name,
        synergy: view.synergy ?? 0,
        inclusion: potential > 0 ? (view.num_decks ?? 0) / potential : 0,
        decks: view.num_decks ?? 0,
      });
    }
  }

  const bracketCounts: CommanderStats["bracketCounts"] = {};
  for (const [key, count] of Object.entries(page.bracket_counts ?? {})) {
    const bracket = Number(key);
    if (bracket >= 1 && bracket <= 5) bracketCounts[bracket as Bracket] = count;
  }

  return {
    deckCount: filteredDecks || (card?.num_decks ?? 0),
    themes: (page.tag_counts ?? []).map((t) => ({ slug: t.slug, label: t.value, deckCount: t.count })),
    bracketCounts,
    averageLands: page.land ?? null,
    cards: [...stats.values()],
  };
}
