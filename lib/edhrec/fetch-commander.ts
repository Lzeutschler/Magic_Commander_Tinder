import "server-only";

import { cacheLife } from "next/cache";
import { z } from "zod";

import { BRACKET_SLUGS, type Bracket, type EdhrecCardStat, type EdhrecCommanderPage } from "./types";

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
 * bracket and theme, e.g. /pages/commanders/krenko-mob-boss/core/tokens.json. Cached for a day.
 */
export async function fetchCommanderPage(
  slug: string,
  bracket?: Bracket,
  theme?: string,
): Promise<EdhrecCommanderPage> {
  "use cache";
  cacheLife("days");

  const segments = [slug, bracket ? BRACKET_SLUGS[bracket] : null, theme].filter(Boolean).join("/");
  const res = await fetch(`https://json.edhrec.com/pages/commanders/${segments}.json`, {
    headers: { "User-Agent": "Brewmance/0.1", Accept: "application/json" },
  });
  if (!res.ok) throw new EdhrecError(`EDHREC ${segments}: HTTP ${res.status}`, res.status);

  const parsed = pageSchema.safeParse(await res.json());
  if (!parsed.success) throw new EdhrecError(`EDHREC ${segments}: unexpected format`, 502);
  return normalize(parsed.data);
}

function normalize(page: z.infer<typeof pageSchema>): EdhrecCommanderPage {
  const { cardlists, card } = page.container.json_dict;
  const stats = new Map<string, EdhrecCardStat>();
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
        list: list.tag,
      });
    }
  }

  const bracketCounts: EdhrecCommanderPage["bracketCounts"] = {};
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
