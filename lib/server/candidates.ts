import "server-only";

import { BASIC_FOR_COLOR, fitsIdentity } from "@/lib/cards/colors";
import { isBasicLandName } from "@/lib/cards/names";
import type { Card, Role } from "@/lib/cards/types";
import type { Candidate, CandidatePool, CommanderInsights } from "@/lib/deckbuilder/types";
import type { Bracket } from "@/lib/edhrec/types";
import { loadCommanderStats } from "@/lib/recs/provider";
import type { CommanderStats } from "@/lib/recs/types";
import { THEMES, detectThemes, stripReminderText } from "@/lib/tagging/themes";
import { detectTribes } from "@/lib/tagging/tribes";

import { findCard, getCardDb, type CardDb } from "./card-db";
import { findCombos } from "./combos";

/** Below this many decks bracket stats are too noisy; use the all-brackets stats instead. */
const MIN_BRACKET_SAMPLE = 40;
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

export async function getCommanderInsights(name: string): Promise<CommanderInsights | null> {
  const db = await getCardDb();
  const commander = findCard(db, name);
  if (!commander) return null;
  const { stats, failed } = await loadCommanderStats(commander.name);
  return {
    commander,
    deckCount: stats?.deckCount ?? 0,
    themes: stats?.themes ?? [],
    bracketCounts: stats?.bracketCounts ?? {},
    incomplete: failed,
  };
}

export async function getCandidatePool(
  commanderName: string,
  bracket: Bracket,
  theme: string | null,
): Promise<CandidatePool | null> {
  const db = await getCardDb();
  const commander = findCard(db, commanderName);
  if (!commander) return null;

  // Only themes the source lists for this commander are looked up, so made-up ones cost it nothing.
  const overview = theme ? await loadCommanderStats(commander.name) : null;
  const knownTheme = theme && overview?.stats?.themes.some((t) => t.slug === theme) ? theme : null;
  const [base, filtered] = await Promise.all([
    loadCommanderStats(commander.name, undefined, knownTheme ?? undefined),
    loadCommanderStats(commander.name, bracket, knownTheme ?? undefined),
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
      if (!card || candidates.has(card.id) || !isEligible(card, commander)) continue;
      candidates.set(card.id, { ...card, synergy: stat.synergy, inclusion: stat.inclusion });
    }
  }

  const source = candidates.size > 0 ? "edhrec" : "fallback";
  if (candidates.size < MIN_POOL) {
    for (const candidate of fallbackCandidates(db, commander)) {
      if (!candidates.has(candidate.id)) candidates.set(candidate.id, candidate);
    }
  }

  const pool = [...candidates.values()];
  const combos = await settle(findCombos(commander.name, pool.map((c) => c.name).sort()));

  const basicNames = commander.colorIdentity.length
    ? commander.colorIdentity.map((c) => BASIC_FOR_COLOR[c])
    : ["Wastes"];

  return {
    commander,
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

function isEligible(card: Card, commander: Card): boolean {
  return card.id !== commander.id && !isBasicLandName(card.name) && fitsIdentity(card.colorIdentity, commander.colorIdentity);
}

/**
 * Heuristic pool for commanders without deck statistics: popular cards in the color identity,
 * boosted when they share the commander's themes or tribes, plus the best staples per role.
 */
function fallbackCandidates(db: CardDb, commander: Card): Candidate[] {
  const themeIds = new Set(detectThemes(commander.oracleText));
  const themePatterns = THEMES.filter((t) => themeIds.has(t.id)).flatMap((t) => t.patterns);
  const tribes = detectTribes(commander.oracleText, commander.name);

  const scored = db.cards
    .filter((card) => isEligible(card, commander))
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
