import "server-only";

import { BASIC_FOR_COLOR, fitsIdentity, sortColors } from "@/lib/cards/colors";
import { isBasicLandName } from "@/lib/cards/names";
import type { Card, Role } from "@/lib/cards/types";
import type { Candidate, CandidatePool, CommanderInsights } from "@/lib/deckbuilder/types";
import type { Bracket } from "@/lib/edhrec/types";
import { asPairable, takesSecondCommander } from "@/lib/cards/pairing";
import { loadCommanderStats, loadPairings, type StatsResult } from "@/lib/recs/provider";
import type { CommanderStats } from "@/lib/recs/types";
import { THEMES, detectThemes, stripReminderText } from "@/lib/tagging/themes";
import { detectTribes } from "@/lib/tagging/tribes";

import { findCard, getCardDb, type CardDb } from "./card-db";
import { findCombos } from "./combos";

/** Below this many decks bracket stats are too noisy; use the all-brackets stats instead. */
const MIN_BRACKET_SAMPLE = 40;
/** Pairs with fewer decks than this borrow what decks of each commander play. */
const MIN_PAIR_SAMPLE = 20;
/** Pairing suggestions sent to the setup. */
const MAX_PAIRINGS = 40;
/** Top up deck-statistics suggestions with heuristic picks when fewer than this many remain. */
const MIN_POOL = 180;
const FALLBACK_POOL = 400;
const STAPLES_PER_ROLE = 25;
const STAPLE_ROLES: Role[] = ["ramp", "draw", "removal", "boardwipe", "protection", "wincon"];

async function settle<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch {
    return null;
  }
}

/**
 * Deck counts and themes for one commander or a pair, plus the partners or Backgrounds decks play with
 * a lone commander that can take one. `commanders` must be a legal pair (see `canPair`).
 */
export async function getCommanderInsights(commanders: Card[]): Promise<CommanderInsights> {
  const [commander, partner] = commanders;
  const wantsPairings = !partner && takesSecondCommander(asPairable(commander));
  const [{ stats, failed }, pairings] = await Promise.all([
    loadCommanderStats(commanders),
    wantsPairings ? loadPairings(commander) : { pairings: [], failed: false },
  ]);
  return {
    commander,
    ...(partner && { partner }),
    deckCount: stats?.deckCount ?? 0,
    themes: stats?.themes ?? [],
    bracketCounts: stats?.bracketCounts ?? {},
    pairings: pairings.pairings.slice(0, MAX_PAIRINGS),
    incomplete: failed || pairings.failed,
  };
}

/**
 * Stats for the command zone. A pair EDHREC knows too few decks of borrows from each commander's own
 * decks across all brackets, which still fit since the pair's identity covers both. Bracket stats stay
 * the pair's own; with too few decks the pool ignores them anyway.
 */
async function loadZoneStats(commanders: Card[], bracket?: Bracket, theme?: string): Promise<StatsResult> {
  const zone = await loadCommanderStats(commanders, bracket, theme);
  const enough = (zone.stats?.deckCount ?? 0) >= MIN_PAIR_SAMPLE;
  if (commanders.length === 1 || bracket !== undefined || zone.failed || enough) return zone;
  const solos = await Promise.all(commanders.map((c) => loadCommanderStats([c], bracket, theme)));
  const found = solos.flatMap((s) => s.stats ?? []);
  if (!found.length) return { stats: zone.stats, failed: solos.some((s) => s.failed) };
  return {
    stats: {
      deckCount: found.reduce((sum, s) => sum + s.deckCount, 0),
      themes: zone.stats?.themes ?? found[0].themes,
      bracketCounts: zone.stats?.bracketCounts ?? found[0].bracketCounts,
      averageLands: found[0].averageLands,
      cards: found.flatMap((s) => s.cards),
    },
    failed: solos.some((s) => s.failed),
  };
}

export async function getCandidatePool(commanders: Card[], bracket: Bracket, theme: string | null): Promise<CandidatePool> {
  const db = await getCardDb();
  const [commander, partner] = commanders;
  const identity = sortColors(commanders.flatMap((c) => c.colorIdentity));

  // Only themes the source lists for this commander are looked up, so made-up ones cost it nothing.
  const overview = theme ? await loadCommanderStats(commanders) : null;
  const knownTheme = theme && overview?.stats?.themes.some((t) => t.slug === theme) ? theme : null;
  const [base, filtered] = await Promise.all([
    loadZoneStats(commanders, undefined, knownTheme ?? undefined),
    loadZoneStats(commanders, bracket, knownTheme ?? undefined),
  ]);
  const baseStats = base.stats;
  const filteredStats = filtered.stats;
  const bracketStats = filteredStats && filteredStats.deckCount >= MIN_BRACKET_SAMPLE ? filteredStats : null;
  const primary: CommanderStats | null = bracketStats ?? baseStats;

  const candidates = new Map<string, Candidate>();
  // Bracket-specific stats win; the all-brackets stats fill in cards the bracket stats lack.
  for (const stats of [bracketStats, baseStats]) {
    for (const stat of stats?.cards ?? []) {
      const card = findCard(db, stat.name);
      if (!card || candidates.has(card.id) || !isEligible(card, commanders, identity)) continue;
      candidates.set(card.id, { ...card, synergy: stat.synergy, inclusion: stat.inclusion });
    }
  }

  const source = candidates.size > 0 ? "edhrec" : "fallback";
  if (candidates.size < MIN_POOL) {
    for (const candidate of fallbackCandidates(db, commanders, identity)) {
      if (!candidates.has(candidate.id)) candidates.set(candidate.id, candidate);
    }
  }

  const pool = [...candidates.values()];
  const combos = await settle(findCombos(commanders.map((c) => c.name), pool.map((c) => c.name).sort()));

  const basicNames = identity.length ? identity.map((c) => BASIC_FOR_COLOR[c]) : ["Wastes"];

  return {
    commander,
    ...(partner && { partner }),
    bracket,
    theme: knownTheme,
    source,
    deckCount: primary?.deckCount ?? 0,
    averageLands: primary?.averageLands ?? null,
    candidates: pool,
    combos,
    basicLands: basicNames.map((name) => findCard(db, name)).filter((c): c is Card => Boolean(c)),
    incomplete: Boolean(overview?.failed || base.failed || filtered.failed),
  };
}

function isEligible(card: Card, commanders: Card[], identity: Card["colorIdentity"]): boolean {
  return commanders.every((c) => c.id !== card.id) && !isBasicLandName(card.name) && fitsIdentity(card.colorIdentity, identity);
}

/**
 * Heuristic pool for commanders without deck statistics: popular cards in the color identity,
 * boosted when they share the commanders' themes or tribes, plus the best staples per role.
 */
function fallbackCandidates(db: CardDb, commanders: Card[], identity: Card["colorIdentity"]): Candidate[] {
  const themeIds = new Set(commanders.flatMap((c) => detectThemes(c.oracleText)));
  const themePatterns = THEMES.filter((t) => themeIds.has(t.id)).flatMap((t) => t.patterns);
  const tribes = [...new Set(commanders.flatMap((c) => detectTribes(c.oracleText, c.name)))];

  const scored = db.cards
    .filter((card) => isEligible(card, commanders, identity))
    .map((card): Candidate => {
      const text = stripReminderText(card.oracleText).toLowerCase();
      const themeHit = themePatterns.some((re) => re.test(text));
      const tribeHit = tribes.some((tribe) => card.typeLine.includes(tribe) || card.oracleText.includes(tribe));
      const popularity = card.edhrecRank ? 1 - Math.min(card.edhrecRank, 30000) / 30000 : 0;
      return {
        ...card,
        synergy: (themeHit ? 0.25 : 0) + (tribeHit ? 0.35 : 0),
        inclusion: popularity * 0.5,
      };
    });

  const byScore = [...scored].sort((a, b) => b.synergy + b.inclusion - (a.synergy + a.inclusion));
  const picked = new Map(byScore.slice(0, FALLBACK_POOL).map((c) => [c.id, c]));

  const byPopularity = [...scored].sort((a, b) => b.inclusion - a.inclusion);
  for (const role of STAPLE_ROLES) {
    for (const card of byPopularity.filter((c) => c.roles.includes(role)).slice(0, STAPLES_PER_ROLE)) {
      picked.set(card.id, card);
    }
  }
  return [...picked.values()];
}
