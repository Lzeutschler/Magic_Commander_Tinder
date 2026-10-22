import { CURVE_LABELS, curveBucket, isLand } from "@/lib/cards/mana";
import type { DeckStats } from "@/lib/decks/stats";

import { TEMPLATE_ROLE_LABELS, templateRoles, type DeckTemplate } from "./template";
import type { Candidate } from "./types";

const WEIGHTS = {
  synergy: 1.0,
  inclusion: 0.8,
  roleNeed: 0.7,
  roleFull: 0.15,
  curveNeed: 0.45,
  curveExcess: 0.5,
  multicolorLand: 0.15,
};

/**
 * How much the deck wants `card` next: EDHREC fit plus bonuses for template roles and
 * curve slots that are still empty, minus a penalty for overfilled curve slots.
 */
export function scoreCandidate(card: Candidate, stats: DeckStats, template: DeckTemplate): number {
  let score = WEIGHTS.synergy * card.synergy + WEIGHTS.inclusion * card.inclusion;

  if (isLand(card)) {
    const colors = card.producedMana.filter((m) => m !== "C").length;
    return score + (colors >= 2 ? WEIGHTS.multicolorLand : 0);
  }

  const roles = templateRoles(card);
  if (roles.length) {
    const needs = roles.map((role) => Math.max(0, template.roles[role] - stats.roles[role]) / template.roles[role]);
    const need = Math.max(...needs);
    score += need > 0 ? WEIGHTS.roleNeed * need : -WEIGHTS.roleFull;
  }

  const bucket = curveBucket(card.cmc);
  const target = template.curve[bucket];
  const have = stats.curve[bucket];
  if (have < target) score += (WEIGHTS.curveNeed * (target - have)) / target;
  else score -= Math.min(0.8, (WEIGHTS.curveExcess * (have - target + 1)) / Math.max(target, 1));

  return score;
}

/** Short, human-readable reasons why the deck wants `card` right now. */
export function explainCandidate(card: Candidate, stats: DeckStats, template: DeckTemplate, commanderName: string): string[] {
  const reasons: string[] = [];
  if (card.synergy >= 0.3) reasons.push(`High synergy with ${commanderName}`);
  if (card.inclusion >= 0.5) reasons.push(`A staple: in ${Math.round(card.inclusion * 100)}% of decks`);

  if (isLand(card)) {
    if (card.producedMana.filter((m) => m !== "C").length >= 2) reasons.push("Fixes your colors");
    return reasons;
  }

  for (const role of templateRoles(card)) {
    if (stats.roles[role] < template.roles[role]) {
      reasons.push(`Your deck needs ${TEMPLATE_ROLE_LABELS[role].toLowerCase()} (${stats.roles[role]}/${template.roles[role]})`);
    }
  }
  const bucket = curveBucket(card.cmc);
  if (stats.curve[bucket] < template.curve[bucket]) {
    reasons.push(`Fills a ${CURVE_LABELS[bucket]} mana slot (${stats.curve[bucket]}/${template.curve[bucket]})`);
  }
  return reasons.slice(0, 3);
}
