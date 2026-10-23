import { isLand } from "@/lib/cards/mana";
import type { Card, Color } from "@/lib/cards/types";
import type { Bracket } from "@/lib/edhrec/types";
import { DECK_SIZE } from "@/lib/decks/types";

import type { Candidate } from "./types";

/** Deck slots the template budgets for, beyond lands and synergy cards. */
export type TemplateRole = "ramp" | "draw" | "interaction" | "boardwipe" | "protection" | "wincon";

export const TEMPLATE_ROLES: TemplateRole[] = ["ramp", "draw", "interaction", "boardwipe", "protection", "wincon"];

export const TEMPLATE_ROLE_LABELS: Record<TemplateRole, string> = {
  ramp: "Ramp",
  draw: "Card Draw",
  interaction: "Interaction",
  boardwipe: "Board Wipes",
  protection: "Protection",
  wincon: "Finishers",
};

/** Mana curve shape: "low" leans on cheap spells, "high" on big ones. */
export type CurveProfile = "low" | "balanced" | "high";

export const CURVE_PROFILES: CurveProfile[] = ["low", "balanced", "high"];

export interface DeckTemplate {
  /** Cards besides the commanders: 99, or 98 with a partner. */
  size: number;
  lands: number;
  /** How many of the lands should be nonbasic before basics fill the rest. */
  nonbasicLands: number;
  roles: Record<TemplateRole, number>;
  /** Most tutors (nonland) the swipe offers; null means no limit. */
  maxTutors: number | null;
  curveProfile: CurveProfile;
  /** Target nonland card counts per mana value bucket (≤1, 2, 3, 4, 5, 6+). */
  curve: number[];
}

/** What EDHREC decks of this commander actually play, estimated from the candidate pool. */
export interface PoolProfile {
  averageLands: number | null;
  /** Role counts of the average deck, scaled up because the pool only holds EDHREC's top cards. */
  roles: Record<TemplateRole, number>;
  averageManaValue: number;
  /** Ramp and draw cards with mana value 2 or less, for Karsten's land formula. */
  cheapRampDraw: number;
}

const DEFAULT_LANDS: Record<Bracket, number> = { 1: 37, 2: 37, 3: 36, 4: 35, 5: 30 };
const LAND_RANGE: Record<Bracket, [number, number]> = { 1: [33, 40], 2: [33, 40], 3: [32, 39], 4: [30, 38], 5: [26, 34] };

const ROLE_TARGETS: Record<Bracket, Record<TemplateRole, number>> = {
  1: { ramp: 9, draw: 9, interaction: 7, boardwipe: 2, protection: 2, wincon: 3 },
  2: { ramp: 10, draw: 10, interaction: 8, boardwipe: 3, protection: 2, wincon: 3 },
  3: { ramp: 10, draw: 10, interaction: 9, boardwipe: 3, protection: 3, wincon: 3 },
  4: { ramp: 12, draw: 11, interaction: 11, boardwipe: 3, protection: 3, wincon: 4 },
  5: { ramp: 14, draw: 12, interaction: 14, boardwipe: 2, protection: 3, wincon: 2 },
};

/** Guard rails for commander-specific targets, so odd EDHREC data never skips a whole category. */
const ROLE_RANGE: Record<TemplateRole, [number, number]> = {
  ramp: [6, 20],
  draw: [6, 16],
  interaction: [5, 18],
  boardwipe: [0, 6],
  protection: [1, 14],
  wincon: [1, 8],
};

const MAX_TUTORS: Record<Bracket, number | null> = { 1: 1, 2: 2, 3: 4, 4: 8, 5: null };

/** Share of nonland cards per mana value bucket; faster brackets curve lower. */
const CURVE_SHARES: Record<Bracket, number[]> = {
  1: [0.1, 0.22, 0.24, 0.2, 0.13, 0.11],
  2: [0.12, 0.24, 0.24, 0.18, 0.12, 0.1],
  3: [0.13, 0.26, 0.24, 0.17, 0.11, 0.09],
  4: [0.18, 0.28, 0.23, 0.15, 0.09, 0.07],
  5: [0.3, 0.3, 0.2, 0.1, 0.06, 0.04],
};

/** Each step up the curve gets this factor more (high) or less (low) weight than "balanced". */
const CURVE_TILT: Record<CurveProfile, number> = { low: 0.75, balanced: 1, high: 1.3 };

/** Typical mana value per curve bucket, for the average a target curve implies. */
const BUCKET_MANA_VALUE = [1, 2, 3, 4, 5, 6.5];

const NONBASICS_BY_COLORS = [4, 6, 12, 15, 17, 18];
/** Optimized and cEDH decks run more fetches, duals and utility lands. */
const NONBASIC_BONUS: Record<Bracket, number> = { 1: 0, 2: 0, 3: 0, 4: 4, 5: 6 };

/** How much commander-specific EDHREC numbers pull the bracket template towards them. */
const EDHREC_BLEND = 0.5;

/** The recommended template: bracket defaults, adjusted towards what this commander's decks play. */
export function recommendTemplate(
  bracket: Bracket,
  colors: readonly Color[],
  profile: PoolProfile | null,
  size: number = DECK_SIZE,
): DeckTemplate {
  const base = ROLE_TARGETS[bracket];
  const roles = { ...base };
  if (profile) {
    for (const role of TEMPLATE_ROLES) {
      const [min, max] = ROLE_RANGE[role];
      roles[role] = clamp(Math.round((1 - EDHREC_BLEND) * base[role] + EDHREC_BLEND * profile.roles[role]), min, max);
    }
  }

  const [minLands, maxLands] = LAND_RANGE[bracket];
  let lands = profile?.averageLands ?? DEFAULT_LANDS[bracket];
  if (profile) lands = (lands + karstenLands(profile.averageManaValue, profile.cheapRampDraw)) / 2;
  lands = clamp(Math.round(lands), minLands, maxLands);

  const curveProfile: CurveProfile = !profile
    ? "balanced"
    : profile.averageManaValue < 2.6 && bracket < 5
      ? "low"
      : profile.averageManaValue > 3.6
        ? "high"
        : "balanced";

  return {
    size,
    lands,
    nonbasicLands: Math.min(lands, NONBASICS_BY_COLORS[colors.length] + NONBASIC_BONUS[bracket]),
    roles,
    maxTutors: MAX_TUTORS[bracket],
    curveProfile,
    curve: curveTargets(bracket, curveProfile, size - lands),
  };
}

/** Per-deck changes to the recommendation; unset fields follow the recommendation. */
export interface TemplateOverrides {
  lands?: number;
  nonbasicLands?: number;
  roles?: Partial<Record<TemplateRole, number>>;
  /** null means no limit. */
  maxTutors?: number | null;
  curveProfile?: CurveProfile;
}

export function applyOverrides(recommended: DeckTemplate, overrides: TemplateOverrides, bracket: Bracket): DeckTemplate {
  const size = recommended.size;
  const lands = clamp(overrides.lands ?? recommended.lands, 0, size);
  const curveProfile = overrides.curveProfile ?? recommended.curveProfile;
  return {
    size,
    lands,
    nonbasicLands: clamp(overrides.nonbasicLands ?? recommended.nonbasicLands, 0, lands),
    roles: { ...recommended.roles, ...overrides.roles },
    maxTutors: overrides.maxTutors === undefined ? recommended.maxTutors : overrides.maxTutors,
    curveProfile,
    curve:
      lands === recommended.lands && curveProfile === recommended.curveProfile
        ? recommended.curve
        : curveTargets(bracket, curveProfile, size - lands),
  };
}

export function curveTargets(bracket: Bracket, profile: CurveProfile, nonlands: number): number[] {
  const tilt = CURVE_TILT[profile];
  return distribute(nonlands, CURVE_SHARES[bracket].map((share, i) => share * tilt ** i));
}

/** Average mana value a target curve aims for. */
export function curveAverage(curve: readonly number[]): number {
  const total = curve.reduce((a, b) => a + b, 0);
  return total ? curve.reduce((sum, count, i) => sum + count * BUCKET_MANA_VALUE[i], 0) / total : 0;
}

/**
 * Frank Karsten's regression for 99-card Commander decks: lands needed to hit land drops given the
 * average mana value of the nonland cards and the number of cheap (mana value ≤ 2) ramp and draw spells.
 */
export function karstenLands(averageManaValue: number, cheapRampDraw: number): number {
  return 31.42 + 3.13 * averageManaValue - 0.28 * cheapRampDraw;
}

/**
 * Estimates the average EDHREC deck from the pool: summed inclusion per role, scaled to the nonland
 * slots of a real deck since the pool only lists the top few hundred cards.
 */
export function profilePool(pool: { candidates: readonly Candidate[]; averageLands: number | null; source: string }): PoolProfile | null {
  if (pool.source !== "edhrec") return null;
  const nonlands = pool.candidates.filter((c) => !isLand(c));
  const listed = nonlands.reduce((sum, c) => sum + c.inclusion, 0);
  if (listed < 10) return null;

  const slots = DECK_SIZE - (pool.averageLands ?? 36);
  const scale = Math.max(1, slots / listed);
  const roles = Object.fromEntries(TEMPLATE_ROLES.map((r) => [r, 0])) as Record<TemplateRole, number>;
  let manaValue = 0;
  let cheap = 0;
  for (const card of nonlands) {
    for (const role of templateRoles(card)) roles[role] += card.inclusion * scale;
    manaValue += card.inclusion * card.cmc;
    if (card.cmc <= 2 && (card.roles.includes("ramp") || card.roles.includes("draw"))) cheap += card.inclusion * scale;
  }
  return { averageLands: pool.averageLands, roles, averageManaValue: manaValue / listed, cheapRampDraw: cheap };
}

export function templateRoles(card: Pick<Card, "roles">): TemplateRole[] {
  const roles: TemplateRole[] = [];
  if (card.roles.includes("ramp")) roles.push("ramp");
  if (card.roles.includes("draw")) roles.push("draw");
  if (card.roles.includes("removal") || card.roles.includes("counterspell")) roles.push("interaction");
  if (card.roles.includes("boardwipe")) roles.push("boardwipe");
  if (card.roles.includes("protection")) roles.push("protection");
  if (card.roles.includes("wincon")) roles.push("wincon");
  return roles;
}

/** Splits `total` into integer parts proportional to `shares` (largest remainder method). */
export function distribute(total: number, shares: readonly number[]): number[] {
  const sum = shares.reduce((a, b) => a + b, 0);
  if (sum <= 0) return shares.map(() => 0);
  const exact = shares.map((s) => (s / sum) * total);
  const parts = exact.map(Math.floor);
  let remaining = total - parts.reduce((a, b) => a + b, 0);
  const byRemainder = exact.map((x, i) => ({ i, r: x - Math.floor(x) })).sort((a, b) => b.r - a.r);
  for (const { i } of byRemainder) {
    if (remaining <= 0) break;
    parts[i] += 1;
    remaining -= 1;
  }
  return parts;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
