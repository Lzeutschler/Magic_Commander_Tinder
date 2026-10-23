import { COLOR_NAMES, identityName } from "@/lib/cards/colors";
import { frontFaceName } from "@/lib/cards/names";
import type { Card, Color, CommanderSummary } from "@/lib/cards/types";
import { ARCHETYPE_LABELS, ARCHETYPE_IDS, type ArchetypeId } from "@/lib/tagging/archetypes";
import { stripReminderText } from "@/lib/tagging/themes";
import { TRIBES } from "@/lib/tagging/tribes";

import { FRANCHISE_LABELS, franchiseOf, type FranchiseId } from "./franchises";
import type {
  Answers,
  FitReason,
  PopularityMode,
  QuizProfile,
  Question,
  ScoredCommander,
  Track,
} from "./types";

/** Points each part of the score can contribute at most (archetypes dominate, as they decide how a deck plays). */
const WEIGHTS = {
  archetypes: 45,
  colorMatch: 12,
  colorMiss: 15,
  colorCount: 8,
  colorLean: 5,
  tribe: 30,
  tribeMember: 12,
  noTribe: 8,
  creatureLean: 6,
  franchise: 35,
  franchiseMiss: 12,
  world: 10,
  tempo: 8,
  complexity: 8,
  partner: 4,
  popular: 20,
  balanced: 8,
  hidden: 16,
} as const;

/** Plain-language archetype descriptions for "why this fits". */
const ARCHETYPE_PITCH: Record<ArchetypeId, string> = {
  tokens: "builds a huge army of tokens",
  aristocrats: "profits whenever creatures die",
  voltron: "suits up one big champion",
  spellslinger: "rewards casting instants and sorceries",
  reanimator: "turns the graveyard into a second hand",
  lands: "gets value from every land you play",
  counters: "grows creatures with +1/+1 counters",
  blink: "flickers creatures for repeat value",
  control: "answers everything, then wins late",
  stax: "locks opponents out of the game",
  grouphug: "makes friends by sharing resources",
  goad: "makes opponents fight each other",
  typal: "leads one creature type",
  artifacts: "runs an artifact engine",
  enchantress: "draws cards off enchantments",
  lifegain: "turns lifegain into power",
  combo: "can win in one explosive turn",
  ramp: "ramps into huge spells",
  stompy: "rewards big creatures",
  mill: "mills opponents out",
  wheels: "punishes opponents for drawing and discarding",
  superfriends: "leads an army of planeswalkers",
  chaos: "thrives on dice and randomness",
  theft: "steals opponents' best cards",
  aggro: "attacks early and often",
  burn: "drains and burns the whole table",
  treasure: "makes piles of Treasure",
  vehicles: "crews powerful Vehicles",
};

const TRIBE_PLURALS = new Map(TRIBES.map((t) => [t.type, t.plural]));
const plural = (type: string) => TRIBE_PLURALS.get(type) ?? `${type}s`;

export function emptyProfile(track: Track): QuizProfile {
  return {
    track,
    archetypes: {},
    colors: null,
    colorless: false,
    colorCount: null,
    colorLean: {},
    tribes: [],
    creatureLean: [],
    noTribe: false,
    franchises: [],
    sets: [],
    tempo: null,
    complexity: null,
  };
}

/** Adds up the effects of every picked answer. */
export function buildProfile(track: Track, questions: Question[], answers: Answers): QuizProfile {
  const profile = emptyProfile(track);
  const add = (question: Pick<Question, "id" | "options">) => {
    for (const optionId of answers[question.id] ?? []) {
      const effect = question.options.find((o) => o.id === optionId)?.effect;
      if (!effect) continue;
      for (const [id, weight] of Object.entries(effect.archetypes ?? {}) as [ArchetypeId, number][]) {
        profile.archetypes[id] = (profile.archetypes[id] ?? 0) + weight;
      }
      for (const [color, weight] of Object.entries(effect.colorLean ?? {}) as [Color, number][]) {
        profile.colorLean[color] = (profile.colorLean[color] ?? 0) + weight;
      }
      if (effect.color === "C") profile.colorless = true;
      else if (effect.color) profile.colors = [...(profile.colors ?? []), effect.color];
      if (effect.colorCount) profile.colorCount = effect.colorCount;
      if (effect.tribes) profile.tribes.push(...effect.tribes);
      if (effect.creatureLean) profile.creatureLean.push(...effect.creatureLean);
      if (effect.noTribe) profile.noTribe = true;
      if (effect.franchise) profile.franchises.push(effect.franchise);
      if (effect.sets) profile.sets.push(...effect.sets);
      if (effect.tempo) profile.tempo = effect.tempo;
      if (effect.complexity) profile.complexity = effect.complexity;
    }
  };
  for (const question of questions) {
    add(question);
    if (question.followUp) add(question.followUp);
  }
  // Picking only "Colorless" still is an explicit color choice.
  if (profile.colorless && !profile.colors) profile.colors = [];
  return profile;
}

/**
 * Rough rules complexity: text length plus a premium per ability and for partner pairings. Runs at
 * build time; commanders carry the result as `complexity`.
 */
export function rulesComplexity(commander: Pick<Card, "oracleText"> & Pick<CommanderSummary, "partner">): number {
  const text = stripReminderText(commander.oracleText);
  const abilities = text.split("\n").filter((line) => line.trim() && line.trim() !== "//").length;
  return text.length + abilities * 40 + (commander.partner ? 60 : 0);
}

/** Percentiles across all commanders, computed once per commander list. */
export interface ScoringContext {
  /** 0 = simplest commander, 1 = most complex. */
  complexity: Map<string, number>;
  /** 0 = unknown on EDHREC, 1 = the most popular commander. */
  popularity: Map<string, number>;
}

export function createScoringContext(commanders: CommanderSummary[]): ScoringContext {
  const percentile = (sorted: CommanderSummary[]) =>
    new Map(sorted.map((c, i) => [c.id, sorted.length > 1 ? i / (sorted.length - 1) : 0.5]));

  const byComplexity = [...commanders].sort((a, b) => a.complexity - b.complexity);
  const ranked = commanders.filter((c) => c.edhrecRank !== null).sort((a, b) => b.edhrecRank! - a.edhrecRank!);
  const popularity = percentile(ranked);
  for (const c of commanders) if (!popularity.has(c.id)) popularity.set(c.id, 0);
  return { complexity: percentile(byComplexity), popularity };
}

export function scoreCommander(
  commander: CommanderSummary,
  profile: QuizProfile,
  context: ScoringContext,
  popularity: PopularityMode,
): ScoredCommander {
  const reasons: FitReason[] = [];
  const add = (kind: FitReason["kind"], points: number, text = "") => {
    if (points !== 0) reasons.push({ kind, points, text });
  };
  const name = frontFaceName(commander.name).split(",")[0];

  // Archetypes: weighted average affinity over what the player asked for.
  const wanted = (Object.entries(profile.archetypes) as [ArchetypeId, number][]).filter(([, w]) => w !== 0);
  const positiveWeight = wanted.reduce((sum, [, w]) => sum + Math.max(0, w), 0);
  if (positiveWeight > 0) {
    let fit = 0;
    const hits: { id: ArchetypeId; value: number }[] = [];
    for (const [id, weight] of wanted) {
      const affinity = commander.archetypes[id] ?? 0;
      fit += (weight * affinity) / positiveWeight;
      if (weight > 0 && affinity >= 0.5) hits.push({ id, value: weight * affinity });
    }
    hits.sort((a, b) => b.value - a.value);
    const points = WEIGHTS.archetypes * fit;
    // The two strongest archetypes explain their share of the points; the rest counts silently.
    const total = hits.reduce((sum, h) => sum + h.value, 0);
    let explained = 0;
    for (const hit of points > 0 ? hits.slice(0, 2) : []) {
      const share = (points * hit.value) / total;
      add("archetype", share, archetypeReason(commander, hit.id, name));
      explained += share;
    }
    add("archetype", points - explained);
  }

  // Colors.
  const identity = commander.colorIdentity;
  if (profile.colors) {
    const chosen = profile.colors;
    const outside = identity.filter((c) => !chosen.includes(c)).length;
    const inside = identity.length - outside;
    if (identity.length === 0) {
      add("colors", profile.colorless ? WEIGHTS.colorMatch : -WEIGHTS.colorMiss / 3, profile.colorless ? "Colorless, as you asked" : "");
    } else if (outside === 0) {
      add("colors", WEIGHTS.colorMatch, `${identityName(identity)}: all in your colors`);
    } else {
      add("colors", inside > 0 ? -WEIGHTS.colorMiss * outside * 0.7 : -WEIGHTS.colorMiss * outside);
    }
  }
  if (profile.colorCount) {
    const target = profile.colorCount === "mono" ? 1 : profile.colorCount === "two" ? 2 : 3;
    const size = Math.max(identity.length, 1);
    const distance = profile.colorCount === "three-plus" ? Math.max(0, target - size) : Math.abs(size - target);
    const points = distance === 0 ? WEIGHTS.colorCount : distance === 1 ? 0 : -WEIGHTS.colorCount;
    add("colors", points, distance === 0 ? `${identity.length || "No"} color${identity.length === 1 ? "" : "s"}, as you like` : "");
  }
  const lean = identity.reduce((sum, c) => sum + (profile.colorLean[c] ?? 0), 0);
  if (lean !== 0) {
    const points = Math.max(-2, Math.min(3, lean)) * WEIGHTS.colorLean;
    const strongest = identity.filter((c) => (profile.colorLean[c] ?? 0) > 0).sort((a, b) => profile.colorLean[b]! - profile.colorLean[a]!)[0];
    add("colors", points, strongest ? `${COLOR_NAMES[strongest]} fits your vibe` : "");
  }

  // Creature types.
  const leads = commander.tribes.filter((t) => profile.tribes.includes(t));
  const isOne = commander.creatureTypes.filter((t) => profile.tribes.includes(t) && !leads.includes(t));
  if (leads.length) add("tribe", WEIGHTS.tribe, `Leads ${plural(leads[0])}`);
  else if (isOne.length) add("tribe", WEIGHTS.tribeMember, `A ${isOne[0]} itself`);
  if (profile.noTribe && commander.tribes.length) add("tribe", -WEIGHTS.noTribe);
  const vibeTypes = [...new Set([...commander.creatureTypes, ...commander.tribes])].filter((t) => profile.creatureLean.includes(t));
  if (vibeTypes.length) add("tribe", Math.min(2, vibeTypes.length) * WEIGHTS.creatureLean, `${plural(vibeTypes[0])} fit your vibe`);

  // Worlds.
  const franchise = franchiseOf(commander.set);
  if (profile.franchises.length) {
    if (profile.franchises.includes(franchise)) {
      add("franchise", franchise === "magic" ? WEIGHTS.franchise / 3 : WEIGHTS.franchise, franchiseReason(franchise));
    } else {
      add("franchise", -WEIGHTS.franchiseMiss);
    }
  }
  if (profile.sets.includes(commander.set)) add("world", WEIGHTS.world, "From a world with exactly that feel");

  // Tempo by mana value.
  if (profile.tempo) {
    const cmc = commander.cmc;
    const points =
      profile.tempo === "fast"
        ? cmc <= 2 ? 1 : cmc === 3 ? 0.6 : cmc === 4 ? 0 : cmc === 5 ? -0.5 : -1
        : profile.tempo === "slow"
          ? cmc >= 6 ? 1 : cmc === 5 ? 0.6 : cmc === 4 ? 0 : -0.5
          : cmc >= 3 && cmc <= 5 ? 0.6 : -0.3;
    const text = profile.tempo === "fast" ? `${cmc} mana: out early` : profile.tempo === "slow" ? `${cmc}-mana bomb` : "";
    add("tempo", points * WEIGHTS.tempo, points > 0 ? text : "");
  }

  // Complexity.
  if (profile.complexity) {
    const c = context.complexity.get(commander.id) ?? 0.5;
    const points =
      profile.complexity === "simple" ? 1 - 2 * c : profile.complexity === "complex" ? 2 * c - 1 : 0.5 - 2 * Math.abs(c - 0.5);
    const text = profile.complexity === "simple" ? "Simple to play" : profile.complexity === "complex" ? "Lots to master" : "";
    add("complexity", points * WEIGHTS.complexity, points > 0.3 ? text : "");
  }
  if (profile.track === "beginner" && commander.partner) add("complexity", -WEIGHTS.partner);

  // Popularity.
  const p = context.popularity.get(commander.id) ?? 0;
  const popularityPoints =
    popularity === "popular" ? WEIGHTS.popular * p : popularity === "balanced" ? WEIGHTS.balanced * p : WEIGHTS.hidden * (p > 0.05 ? 1 - p : -0.5);
  const decks = commander.edhrecDecks;
  const popularityText =
    popularity === "hidden"
      ? p > 0.05 && p < 0.6 ? "A hidden gem" : ""
      : p > 0.85 ? (decks ? `Fan favorite: ${decks.toLocaleString("en-US")} decks on EDHREC` : "Fan favorite on EDHREC") : "";
  add("popularity", popularityPoints, popularityText);

  const score = reasons.reduce((sum, r) => sum + r.points, 0);
  return { commander, score: Math.round(score * 10) / 10, reasons: pickReasons(reasons) };
}

/** Up to four reasons, strongest first, preferring one per kind so a match is explained from several angles. */
function pickReasons(reasons: FitReason[], limit = 4): FitReason[] {
  const candidates = reasons.filter((r) => r.text && r.points >= 3).sort((a, b) => b.points - a.points);
  const kinds = new Set<FitReason["kind"]>();
  const varied = candidates.filter((r) => !kinds.has(r.kind) && kinds.add(r.kind));
  const rest = candidates.filter((r) => !varied.includes(r));
  return [...varied, ...rest].slice(0, limit).sort((a, b) => b.points - a.points);
}

function archetypeReason(commander: CommanderSummary, id: ArchetypeId, name: string): string {
  if (id === "typal" && commander.tribes.length) return `${name} leads ${plural(commander.tribes[0])}`;
  const edhrecTop = (commander.edhrecThemes[id] ?? 0) > 0 && (commander.archetypes[id] ?? 0) >= 0.8;
  return edhrecTop ? `${ARCHETYPE_LABELS[id]}: a top EDHREC pick` : `${name} ${ARCHETYPE_PITCH[id]}`;
}

function franchiseReason(franchise: FranchiseId): string {
  return franchise === "magic" ? "From Magic's own worlds" : `From ${FRANCHISE_LABELS[franchise]}`;
}

/** All commanders scored for the profile, best first; ties go to the more popular commander. */
export function rankCommanders(
  commanders: CommanderSummary[],
  profile: QuizProfile,
  popularity: PopularityMode,
  context: ScoringContext = createScoringContext(commanders),
): ScoredCommander[] {
  return commanders
    .map((c) => scoreCommander(c, profile, context, popularity))
    .sort((a, b) => b.score - a.score || (a.commander.edhrecRank ?? Infinity) - (b.commander.edhrecRank ?? Infinity));
}

/** The commander's strongest archetypes, for chips on the swipe card. */
export function topArchetypes(commander: CommanderSummary, limit = 3): ArchetypeId[] {
  return ARCHETYPE_IDS.filter((id) => (commander.archetypes[id] ?? 0) >= 0.5)
    .sort((a, b) => commander.archetypes[b]! - commander.archetypes[a]!)
    .slice(0, limit);
}

export function defaultPopularity(track: Track): PopularityMode {
  return track === "beginner" ? "popular" : "balanced";
}
