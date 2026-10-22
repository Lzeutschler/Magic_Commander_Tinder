import "server-only";

import { BASIC_FOR_COLOR, fitsIdentity } from "@/lib/cards/colors";
import { edhrecSlug, isBasicLandName } from "@/lib/cards/names";
import type { Card, Role } from "@/lib/cards/types";
import type { Candidate, CandidatePool, CommanderInsights } from "@/lib/deckbuilder/types";
import { fetchCommanderPage } from "@/lib/edhrec/fetch-commander";
import type { Bracket, EdhrecCommanderPage } from "@/lib/edhrec/types";
import { THEMES, detectThemes, stripReminderText } from "@/lib/tagging/themes";
import { detectTribes } from "@/lib/tagging/tribes";

import { findCard, getCardDb, type CardDb } from "./card-db";
import { findCombos } from "./combos";

/** Below this many decks a bracket page is too noisy; use the all-brackets page instead. */
const MIN_BRACKET_SAMPLE = 40;
/** Top up EDHREC suggestions with heuristic picks when fewer than this many remain. */
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
  const page = await settle(fetchCommanderPage(edhrecSlug(commander.name)));
  return {
    commander,
    deckCount: page?.deckCount ?? 0,
    themes: page?.themes ?? [],
    bracketCounts: page?.bracketCounts ?? {},
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

  const slug = edhrecSlug(commander.name);
  const [basePage, filteredPage] = await Promise.all([
    settle(fetchCommanderPage(slug, undefined, theme ?? undefined)),
    settle(fetchCommanderPage(slug, bracket, theme ?? undefined)),
  ]);
  const bracketPage = filteredPage && filteredPage.deckCount >= MIN_BRACKET_SAMPLE ? filteredPage : null;
  const primary: EdhrecCommanderPage | null = bracketPage ?? basePage;

  const candidates = new Map<string, Candidate>();
  // Bracket-specific stats win; the all-brackets page fills in cards the bracket page lacks.
  for (const page of [bracketPage, basePage]) {
    for (const stat of page?.cards ?? []) {
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
    theme,
    source,
    deckCount: primary?.deckCount ?? 0,
    averageLands: primary?.averageLands ?? null,
    candidates: pool,
    combos,
    basicLands: basicNames.map((name) => findCard(db, name)).filter((c): c is Card => Boolean(c)),
  };
}

function isEligible(card: Card, commander: Card): boolean {
  return card.id !== commander.id && !isBasicLandName(card.name) && fitsIdentity(card.colorIdentity, commander.colorIdentity);
}

/**
 * Heuristic pool for commanders EDHREC has little data on: popular cards in the color identity,
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
