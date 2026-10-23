import { CURVE_LABELS, curveBucket, isLand, landColors } from "@/lib/cards/mana";
import type { Color } from "@/lib/cards/types";
import type { DeckStats } from "@/lib/decks/stats";

import { comboPartners, type Combo } from "./combos";
import type { SwipePreferences } from "./settings";
import { TEMPLATE_ROLE_LABELS, TEMPLATE_ROLES, templateRoles, type DeckTemplate, type TemplateRole } from "./template";
import type { Candidate } from "./types";

const WEIGHTS = {
  /** Scales the EDHREC fit (synergy/inclusion blend) to the size of the other bonuses. */
  fit: 1.8,
  /** Extra for cards most decks of this commander play, ramping up from 60% inclusion. */
  staple: 0.6,
  roleNeed: 0.7,
  /** How much stronger the role bonus gets when the open role slots run out. */
  urgency: 1.5,
  /** Penalty for cards that fill no missing role once the open slots run out. */
  offRole: 1,
  curveNeed: 0.45,
  curveExcess: 0.5,
  gameChanger: 0.4,
  combo: 0.6,
  landColor: 0.15,
  colorlessLand: 0.2,
};

/**
 * Penalty per card above a role's target: too many wipes hurt most, extra protection least. Strong
 * enough that a full role stops getting cards that merely fit a little better than off-role ones.
 */
const ROLE_EXCESS: Record<TemplateRole, number> = {
  ramp: 0.45,
  draw: 0.4,
  interaction: 0.45,
  boardwipe: 0.8,
  protection: 0.35,
  wincon: 0.4,
};
/** Most a full role can cost a card, so near-universal staples still come through. */
const MAX_ROLE_EXCESS = 2;

export interface ScoreContext {
  stats: DeckStats;
  template: DeckTemplate;
  preferences: SwipePreferences;
  identity: readonly Color[];
  /** Combos the card would complete; only offered as a bonus where the bracket allows them. */
  combosCompleted: (card: Candidate) => Combo[];
}

/**
 * How much the deck wants `card` next: EDHREC fit (synergy vs. inclusion as the deck prefers) plus
 * bonuses for template roles and curve slots that are still empty. Roles get urgent as the open spell
 * slots run out, and overfilled roles or curve slots cost points. Penalties shrink for cards that
 * nearly every deck of this commander plays, so staples like Sol Ring are not crowded out.
 */
export function scoreCandidate(card: Candidate, ctx: ScoreContext): number {
  const { stats, template, preferences } = ctx;
  const w = preferences.synergy;
  let score = WEIGHTS.fit * (w * card.synergy + (1 - w) * card.inclusion);
  score += WEIGHTS.staple * Math.max(0, (card.inclusion - 0.6) / 0.4);
  const dampen = 1 - card.inclusion ** 2;

  if (card.gameChanger && preferences.gameChangers === "prefer") score += WEIGHTS.gameChanger;

  if (isLand(card)) {
    if (ctx.identity.length >= 2) {
      const colors = landColors(card, ctx.identity).length;
      if (colors >= 2) score += WEIGHTS.landColor * (colors - 1);
      if (colors === 0) score -= Math.min(0.6, WEIGHTS.colorlessLand * (ctx.identity.length - 1)) * dampen;
    }
    return score;
  }

  if (ctx.combosCompleted(card).length) score += WEIGHTS.combo;

  const urgency = roleUrgency(stats, template);
  const roles = templateRoles(card);
  const needs = roles.filter((role) => stats.roles[role] < template.roles[role]);
  if (needs.length) {
    const need = Math.max(...needs.map((role) => (template.roles[role] - stats.roles[role]) / template.roles[role]));
    score += WEIGHTS.roleNeed * need * (1 + WEIGHTS.urgency * urgency);
  } else {
    if (roles.length) {
      const excess = Math.max(...roles.map((role) => ROLE_EXCESS[role] * (stats.roles[role] - template.roles[role] + 1)));
      score -= Math.min(MAX_ROLE_EXCESS, excess) * dampen;
    }
    score -= WEIGHTS.offRole * urgency ** 2 * dampen;
  }

  const bucket = curveBucket(card.cmc);
  const target = template.curve[bucket];
  const have = stats.curve[bucket];
  if (have < target) score += (WEIGHTS.curveNeed * (target - have)) / target;
  else score -= Math.min(0.8, (WEIGHTS.curveExcess * (have - target + 1)) / Math.max(target, 1)) * dampen;

  return score;
}

/**
 * 0 while there is room for everything, rising to 1 when the cards still missing from role targets
 * need (nearly) all remaining spell slots.
 */
export function roleUrgency(stats: DeckStats, template: DeckTemplate): number {
  const slotsLeft = Math.max(1, template.size - template.lands - stats.nonlands);
  const missing = TEMPLATE_ROLES.reduce((sum, role) => sum + Math.max(0, template.roles[role] - stats.roles[role]), 0);
  return Math.min(1, Math.max(0, (missing / slotsLeft - 0.7) / 0.3));
}

export interface CandidateReason {
  /** "fit" repeats the EDHREC numbers; "deck" comes from what this deck still needs. */
  kind: "fit" | "deck";
  text: string;
}

/** Short, human-readable reasons why the deck wants `card` right now, most telling first. */
export function explainCandidate(card: Candidate, ctx: ScoreContext, commanderName: string): CandidateReason[] {
  const { stats, template } = ctx;
  const reasons: CandidateReason[] = [];
  const deck = (text: string) => reasons.push({ kind: "deck", text });
  const fit = (text: string) => reasons.push({ kind: "fit", text });
  const combos = isLand(card) ? [] : ctx.combosCompleted(card);
  if (combos.length) deck(`Completes a combo with ${comboPartners(combos[0], card.name)}`);
  if (card.synergy >= 0.3) fit(`High synergy with ${commanderName}`);
  if (card.inclusion >= 0.5) fit(`A staple: in ${Math.round(card.inclusion * 100)}% of decks`);

  if (isLand(card)) {
    if (ctx.identity.length >= 2 && landColors(card, ctx.identity).length >= 2) deck("Fixes your colors");
    return reasons;
  }

  for (const role of templateRoles(card)) {
    if (stats.roles[role] < template.roles[role]) {
      deck(`Your deck needs ${TEMPLATE_ROLE_LABELS[role].toLowerCase()} (${stats.roles[role]}/${template.roles[role]})`);
    }
  }
  const bucket = curveBucket(card.cmc);
  if (stats.curve[bucket] < template.curve[bucket]) {
    deck(`Fills a ${CURVE_LABELS[bucket]} mana slot (${stats.curve[bucket]}/${template.curve[bucket]})`);
  }
  return reasons;
}
