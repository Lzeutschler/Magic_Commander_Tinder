import { describe, expect, it } from "vitest";

import { fitsIdentity } from "@/lib/cards/colors";
import { isLand } from "@/lib/cards/mana";
import { deckCount, deckStats, expandEntries } from "@/lib/decks/stats";
import { DECK_SIZE, type Deck } from "@/lib/decks/types";
import { basic, card, emptyDeck, land, spell } from "@/tests/fixtures";

import { bracketCounts } from "./brackets";
import type { Combo } from "./combos";
import { decide, finish, nextCandidate, rankCandidates, refreshSession, skipToLands, startSession, undo, type SwipeSession } from "./session";
import { DEFAULT_SETTINGS, deckTemplate, type DeckSettings } from "./settings";
import type { Candidate, CandidatePool } from "./types";

const commander = card({ name: "Krenko, Mob Boss", typeLine: "Legendary Creature — Goblin Warrior", colorIdentity: ["R"], cmc: 4 });

function makePool(): Candidate[] {
  const pool: Candidate[] = [];
  for (let i = 0; i < 150; i++) {
    const roles = i % 6 === 0 ? (["ramp"] as const) : i % 6 === 1 ? (["draw"] as const) : i % 6 === 2 ? (["removal"] as const) : [];
    pool.push(spell(`Spell ${i}`, (i % 7) + 1, [...roles], { synergy: (i % 10) / 10 }));
  }
  pool.push(spell("Big Game Changer", 3, [], { gameChanger: true, synergy: 1, inclusion: 1 }));
  pool.push(spell("Armageddon", 4, ["mld"], { synergy: 1, inclusion: 1 }));
  pool.push(spell("Blue Card", 2, [], { colorIdentity: ["U"], synergy: 1 }));
  for (let i = 0; i < 30; i++) pool.push(land(`Land ${i}`));
  return pool;
}

function makePoolResponse(candidates: Candidate[], bracket: Deck["bracket"], combos: Combo[] | null = null): CandidatePool {
  return {
    commander,
    bracket,
    theme: null,
    source: "fallback",
    deckCount: 1000,
    averageLands: 36,
    // The server only returns cards inside the commander's identity.
    candidates: candidates.filter((c) => fitsIdentity(c.colorIdentity, commander.colorIdentity)),
    combos,
    basicLands: [basic("Mountain", "R")],
  };
}

type State = { session: SwipeSession; deck: Deck };

function start(bracket: Deck["bracket"], candidates: Candidate[], seed: number, settings: DeckSettings = DEFAULT_SETTINGS, combos: Combo[] | null = null): State {
  const deck = { ...emptyDeck(commander, bracket), settings };
  return startSession(deck, makePoolResponse(candidates, bracket, combos), seed);
}

function swipeAll(state: State, decision: "pick" | "pass" = "pick"): State {
  for (let guard = 0; guard < 500 && state.session.phase !== "done"; guard++) {
    const next = nextCandidate(state.session, state.deck);
    if (!next) break;
    state = decide(state.session, state.deck, next, decision);
  }
  return state;
}

function withPreferences(preferences: Partial<DeckSettings["preferences"]>, overrides: DeckSettings["overrides"] = {}): DeckSettings {
  return { overrides, preferences: { ...DEFAULT_SETTINGS.preferences, ...preferences } };
}

describe("swipe session", () => {
  it("builds a legal 99-card deck within the bracket", () => {
    const started = start(2, makePool(), 42);
    const state = swipeAll(started);
    expect(state.session.phase).toBe("done");

    const finished = finish(state.session, state.deck);
    const cards = expandEntries(finished.entries);
    expect(deckCount(finished.entries)).toBe(DECK_SIZE);
    expect(cards.every((c) => fitsIdentity(c.colorIdentity, commander.colorIdentity))).toBe(true);
    expect(bracketCounts(cards).gameChangers).toBe(0);
    expect(cards.some((c) => c.roles.includes("mld"))).toBe(false);

    const nonBasics = finished.entries.filter((e) => e.card.name !== "Mountain");
    expect(nonBasics.every((e) => e.quantity === 1)).toBe(true);
    expect(new Set(nonBasics.map((e) => e.card.id)).size).toBe(nonBasics.length);

    const template = deckTemplate(finished);
    const stats = deckStats(finished);
    expect(stats.lands).toBe(template.lands);
    expect(stats.roles.ramp).toBeGreaterThanOrEqual(template.roles.ramp);
  });

  it("stores the recommended template on the deck", () => {
    const { deck } = start(3, makePool(), 1);
    expect(deck.recommendation?.lands).toBeGreaterThan(30);
    expect(deckTemplate(deck)).toEqual(deck.recommendation);
  });

  it("allows up to three Game Changers in bracket 3", () => {
    const changers = [1, 2, 3, 4].map((i) => spell(`Changer ${i}`, 2, [], { gameChanger: true, synergy: 1, inclusion: 1 }));
    const state = swipeAll(start(3, [...makePool(), ...changers], 7));
    expect(bracketCounts(expandEntries(state.deck.entries)).gameChangers).toBe(3);
  });

  it("offers lands only after the spell slots are full", () => {
    let state = start(3, makePool(), 1);
    const template = deckTemplate(state.deck);
    while (state.session.phase === "spells") {
      const next = nextCandidate(state.session, state.deck)!;
      expect(isLand(next)).toBe(false);
      state = decide(state.session, state.deck, next, "pick");
    }
    expect(state.session.phase).toBe("lands");
    expect(deckStats(state.deck).nonlands).toBe(DECK_SIZE - template.lands);
    expect(isLand(nextCandidate(state.session, state.deck)!)).toBe(true);
  });

  it("never offers a passed card again and undo restores it", () => {
    const { session, deck } = start(3, makePool(), 3);
    const first = nextCandidate(session, deck)!;
    const passed = decide(session, deck, first, "pass");
    expect(nextCandidate(passed.session, passed.deck)?.id).not.toBe(first.id);

    const picked = decide(passed.session, passed.deck, nextCandidate(passed.session, passed.deck)!, "pick");
    expect(picked.deck.entries).toHaveLength(1);
    const undone = undo(picked.session, picked.deck);
    expect(undone.deck.entries).toHaveLength(0);
    expect(undone.session.history).toHaveLength(1);
  });

  it("keeps maybes out of the deck", () => {
    const { session, deck } = start(3, makePool(), 5);
    const next = nextCandidate(session, deck)!;
    const state = decide(session, deck, next, "maybe");
    expect(state.deck.entries).toHaveLength(0);
    expect(state.deck.maybe.map((c) => c.id)).toEqual([next.id]);
  });

  it("finishing early fills open spell slots with suggestions and lands only up to the target", () => {
    let state = start(3, makePool(), 9);
    for (let i = 0; i < 20; i++) state = decide(state.session, state.deck, nextCandidate(state.session, state.deck)!, i % 4 ? "pick" : "pass");
    const passed = state.session.history.filter((h) => h.decision === "pass").map((h) => h.cardId);

    const finished = finish(skipToLands(state.session, state.deck), state.deck);
    const template = deckTemplate(finished);
    const stats = deckStats(finished);
    expect(stats.total).toBe(DECK_SIZE);
    expect(stats.lands).toBe(template.lands);
    expect(finished.entries.some((e) => passed.includes(e.card.id))).toBe(false);
  });

  it("leaves spell slots open when no suggestions are left", () => {
    const started = start(3, makePool().filter(isLand), 9);
    const finished = finish(started.session, started.deck);
    expect(deckCount(finished.entries)).toBe(deckTemplate(started.deck).lands);
    expect(finished.entries[0].card.name).toBe("Mountain");
  });
});

describe("swipe settings", () => {
  it("moves to the land phase as soon as more lands leave fewer spell slots", () => {
    let state = start(3, makePool(), 11);
    for (let i = 0; i < 50; i++) state = decide(state.session, state.deck, nextCandidate(state.session, state.deck)!, "pick");
    expect(state.session.phase).toBe("spells");

    const deck = { ...state.deck, settings: withPreferences({}, { lands: 49 }) };
    expect(refreshSession(state.session, deck).phase).toBe("lands");
  });

  it("goes back to spells when the land count drops again", () => {
    const started = start(3, makePool(), 12, withPreferences({}, { lands: 60 }));
    let state = started;
    while (state.session.phase === "spells") state = decide(state.session, state.deck, nextCandidate(state.session, state.deck)!, "pick");
    const deck = { ...state.deck, settings: DEFAULT_SETTINGS };
    expect(refreshSession(state.session, deck).phase).toBe("spells");
  });

  it("only offers cards within the budget, but keeps cards without a price", () => {
    const pool = [
      spell("Pricey", 2, ["ramp"], { priceUsd: 40, synergy: 1, inclusion: 1 }),
      spell("Unpriced", 2, [], { priceUsd: null }),
      ...makePool(),
    ];
    const { session, deck } = start(3, pool, 2, withPreferences({ maxPriceUsd: 5 }));
    const offered = rankCandidates(session, deck).map((r) => r.candidate.name);
    expect(offered).not.toContain("Pricey");
    expect(offered).toContain("Unpriced");
  });

  it("avoids or prefers Game Changers on request", () => {
    const pool = [spell("Changer", 3, [], { gameChanger: true, synergy: 0, inclusion: 0.2 }), ...makePool()];
    const avoid = start(4, pool, 2, withPreferences({ gameChangers: "avoid" }));
    expect(rankCandidates(avoid.session, avoid.deck).some((r) => r.candidate.gameChanger)).toBe(false);

    const neutral = start(4, pool, 2);
    const prefer = start(4, pool, 2, withPreferences({ gameChangers: "prefer" }));
    const scoreOf = (state: State) => rankCandidates(state.session, state.deck).find((r) => r.candidate.name === "Changer")!.score;
    expect(scoreOf(prefer)).toBeGreaterThan(scoreOf(neutral));
  });

  it("weighs synergy against staples as configured", () => {
    const pool = [
      spell("Staple", 3, [], { synergy: 0, inclusion: 0.55 }),
      spell("Synergy Piece", 3, [], { synergy: 0.55, inclusion: 0.1 }),
    ];
    const top = (synergy: number) => {
      const { session, deck } = start(3, pool, 1, withPreferences({ synergy }));
      return rankCandidates(session, deck)[0].candidate.name;
    };
    expect(top(0.15)).toBe("Staple");
    expect(top(0.95)).toBe("Synergy Piece");
  });

  it("caps tutors", () => {
    const tutors = [1, 2, 3].map((i) => spell(`Tutor ${i}`, 2, ["tutor"], { synergy: 1, inclusion: 1 }));
    const state = swipeAll(start(3, [...tutors, ...makePool()], 4, withPreferences({}, { maxTutors: 1 })));
    expect(expandEntries(state.deck.entries).filter((c) => c.roles.includes("tutor"))).toHaveLength(1);
  });

  it("hides cards passed in earlier sessions only when asked to", () => {
    const pool = makePool();
    const hiddenId = pool[0].oracleId;
    const deck = emptyDeck(commander, 3);
    const keep = startSession(deck, makePoolResponse(pool, 3), 1, [hiddenId]);
    expect(rankCandidates(keep.session, keep.deck).some((r) => r.candidate.oracleId === hiddenId)).toBe(true);

    const hide = startSession({ ...deck, settings: withPreferences({ hidePassed: true }) }, makePoolResponse(pool, 3), 1, [hiddenId]);
    expect(rankCandidates(hide.session, hide.deck).some((r) => r.candidate.oracleId === hiddenId)).toBe(false);
  });
});

describe("combos in the swipe", () => {
  const kiki = spell("Kiki-Jiki, Mirror Breaker", 5, [], { synergy: 0.5, inclusion: 0.4 });
  const helm = spell("Helm of the Host", 4, [], { synergy: 0.5, inclusion: 0.4 });
  const combo: Combo = { id: "1", cards: [kiki.name, helm.name], results: ["Infinite tokens"], bracketTag: "S", manaValue: 9 };

  function withKiki(bracket: Deck["bracket"]): State {
    const state = start(bracket, [kiki, helm, ...makePool()], 1, DEFAULT_SETTINGS, [combo]);
    return decide(state.session, state.deck, kiki, "pick");
  }

  it("does not offer the second piece of a two-card combo in bracket 2", () => {
    const { session, deck } = withKiki(2);
    expect(rankCandidates(session, deck).some((r) => r.candidate.name === helm.name)).toBe(false);
  });

  it("allows a late two-card combo in bracket 3", () => {
    const { session, deck } = withKiki(3);
    expect(rankCandidates(session, deck).some((r) => r.candidate.name === helm.name)).toBe(true);
  });

  it("prefers combo pieces in bracket 4", () => {
    const b3 = withKiki(3);
    const b4 = withKiki(4);
    const scoreOf = (state: State) => rankCandidates(state.session, state.deck).find((r) => r.candidate.name === helm.name)!.score;
    expect(scoreOf(b4)).toBeGreaterThan(scoreOf(b3));
  });
});
