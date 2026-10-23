import { describe, expect, it } from "vitest";

import type { Color } from "@/lib/cards/types";
import { deckStats } from "@/lib/decks/stats";
import { land, spell } from "@/tests/fixtures";

import { roleUrgency, scoreCandidate, type ScoreContext } from "./score";
import { DEFAULT_PREFERENCES } from "./settings";
import { recommendTemplate } from "./template";
import type { Candidate } from "./types";

const template = recommendTemplate(3, ["R"], null);

function context(deckCards: Candidate[], identity: Color[] = ["R"]): ScoreContext {
  return {
    stats: deckStats({ entries: deckCards.map((card) => ({ card, quantity: 1 })) }),
    template,
    preferences: DEFAULT_PREFERENCES,
    identity,
    combosCompleted: () => [],
  };
}

const filler = (n: number, cmc: number, roles: Candidate["roles"] = []) =>
  Array.from({ length: n }, (_, i) => spell(`Filler ${cmc}-${i}`, cmc, roles, { synergy: 0, inclusion: 0 }));

describe("scoreCandidate", () => {
  it("does not crowd out a near-universal staple with curve or role penalties", () => {
    // Cheap slot and ramp are both full, as in a cEDH deck with lots of fast mana.
    const ctx = context([...filler(20, 1, ["ramp"])]);
    const solRing = spell("Sol Ring", 1, ["ramp"], { synergy: 0.05, inclusion: 0.99 });
    const niche = spell("Niche Card", 3, [], { synergy: 0.4, inclusion: 0.2 });
    expect(scoreCandidate(solRing, ctx)).toBeGreaterThan(scoreCandidate(niche, ctx));
  });

  it("pushes back harder the further a role is overfilled", () => {
    const rampCard = spell("More Ramp", 3, ["ramp"], { synergy: 0.3, inclusion: 0.3 });
    const atTarget = scoreCandidate(rampCard, context(filler(template.roles.ramp, 2, ["ramp"])));
    const wayOver = scoreCandidate(rampCard, context(filler(template.roles.ramp + 5, 2, ["ramp"])));
    expect(wayOver).toBeLessThan(atTarget);
  });

  it("prefers an off-role card once a role is full, even when the role card fits a bit better", () => {
    const ctx = context(filler(template.roles.interaction + 1, 2, ["removal"]));
    const removal = spell("Doom Blade", 2, ["removal"], { synergy: 0.25, inclusion: 0.6 });
    const synergy = spell("Synergy Creature", 2, [], { synergy: 0.15, inclusion: 0.3 });
    expect(scoreCandidate(synergy, ctx)).toBeGreaterThan(scoreCandidate(removal, ctx));
  });

  it("makes missing roles urgent when the spell slots run out", () => {
    const slots = 99 - template.lands;
    const early = context([]);
    const late = context(filler(slots - 5, 3));
    expect(roleUrgency(early.stats, template)).toBe(0);
    expect(roleUrgency(late.stats, template)).toBe(1);

    const removal = spell("Removal", 2, ["removal"], { synergy: 0, inclusion: 0.2 });
    const synergy = spell("Synergy", 2, [], { synergy: 0.8, inclusion: 0.4 });
    expect(scoreCandidate(synergy, early)).toBeGreaterThan(scoreCandidate(removal, early));
    expect(scoreCandidate(removal, late)).toBeGreaterThan(scoreCandidate(synergy, late));
  });

  it("prefers dual lands and fetches over colorless lands in multicolor decks", () => {
    const ctx = context([], ["U", "G"]);
    const dual = land("Breeding Pool", ["U", "G"], { inclusion: 0.4, synergy: 0 });
    const fetch = land("Misty Rainforest", [], { inclusion: 0.4, synergy: 0, oracleText: "{T}, Pay 1 life, Sacrifice Misty Rainforest: Search your library for a Forest or Island card, put it onto the battlefield." });
    const colorless = land("Rogue's Passage", ["C" as Color], { inclusion: 0.4, synergy: 0 });
    expect(scoreCandidate(dual, ctx)).toBeGreaterThan(scoreCandidate(colorless, ctx));
    expect(scoreCandidate(fetch, ctx)).toBeGreaterThan(scoreCandidate(colorless, ctx));
  });
});
