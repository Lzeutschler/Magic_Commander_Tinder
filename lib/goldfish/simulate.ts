import { isLand } from "@/lib/cards/mana";
import type { Card } from "@/lib/cards/types";
import { expandEntries } from "@/lib/decks/stats";
import type { Deck } from "@/lib/decks/types";

import { OPENING_HAND, shuffled } from "./game";

const MAX_TURN = 10;

export interface HandSimulation {
  iterations: number;
  /** Share of opening hands with 0..7 lands. */
  landShares: number[];
  /** Share of hands with 2–4 lands, the usual keep range. */
  keepable: number;
  averageLands: number;
  /** Cumulative share of games where the commander is castable by turn 1..MAX_TURN. */
  commanderByTurn: number[];
  /** Average turn the commander becomes castable (games that never get there count as MAX_TURN + 1). */
  averageCommanderTurn: number;
}

/**
 * Monte Carlo over opening hands. Each simulated game plays a land per turn when it can and casts
 * cheap ramp spells, which is enough to estimate when the commander comes down.
 */
export function simulateOpeningHands(
  deck: Pick<Deck, "commander" | "entries">,
  iterations = 1000,
  seed = 1,
): HandSimulation {
  const library = expandEntries(deck.entries);
  const landCounts = new Array(OPENING_HAND + 1).fill(0);
  const castableBy = new Array(MAX_TURN).fill(0);
  let landTotal = 0;
  let turnTotal = 0;

  for (let i = 0; i < iterations; i++) {
    const order = shuffled(library, seed + i * 7919);
    const hand = order.slice(0, OPENING_HAND);
    const lands = hand.filter(isLand).length;
    landCounts[lands] += 1;
    landTotal += lands;

    const turn = commanderTurn(order, deck.commander.cmc);
    turnTotal += turn;
    for (let t = turn; t <= MAX_TURN; t++) castableBy[t - 1] += 1;
  }

  return {
    iterations,
    landShares: landCounts.map((n) => n / iterations),
    keepable: (landCounts[2] + landCounts[3] + landCounts[4]) / iterations,
    averageLands: landTotal / iterations,
    commanderByTurn: castableBy.map((n) => n / iterations),
    averageCommanderTurn: turnTotal / iterations,
  };
}

/** First turn on which `commanderCmc` mana is available, or MAX_TURN + 1. */
function commanderTurn(order: Card[], commanderCmc: number): number {
  const hand = order.slice(0, OPENING_HAND);
  let next = OPENING_HAND;
  let lands = 0;
  let ramp = 0;

  for (let turn = 1; turn <= MAX_TURN; turn++) {
    if (turn > 1 && next < order.length) hand.push(order[next++]);

    const landIndex = hand.findIndex(isLand);
    if (landIndex !== -1) {
      hand.splice(landIndex, 1);
      lands += 1;
    }
    const mana = lands + ramp;
    if (mana >= commanderCmc) return turn;

    // Spend the turn on the cheapest affordable ramp spell; it pays off from next turn.
    const rampIndex = hand
      .map((card, index) => ({ card, index }))
      .filter(({ card }) => !isLand(card) && card.roles.includes("ramp") && card.cmc <= mana)
      .sort((a, b) => a.card.cmc - b.card.cmc)[0]?.index;
    if (rampIndex !== undefined) {
      hand.splice(rampIndex, 1);
      ramp += 1;
    }
  }
  return MAX_TURN + 1;
}
