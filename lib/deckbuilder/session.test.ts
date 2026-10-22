import { describe, expect, it } from "vitest";

import { fitsIdentity } from "@/lib/cards/colors";
import { isLand } from "@/lib/cards/mana";
import { deckCount, deckStats, expandEntries } from "@/lib/decks/stats";
import { DECK_SIZE, type Deck } from "@/lib/decks/types";
import { basic, card, emptyDeck, land, spell } from "@/tests/fixtures";

import { bracketCounts } from "./brackets";
import { createSession, decide, finish, nextCandidate, skipToLands, undo, type SwipeSession } from "./session";
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

function makePoolResponse(candidates: Candidate[], bracket: Deck["bracket"]): CandidatePool {
  return {
    commander,
    bracket,
    theme: null,
    source: "edhrec",
    deckCount: 1000,
    averageLands: 36,
    // The server only returns cards inside the commander's identity.
    candidates: candidates.filter((c) => fitsIdentity(c.colorIdentity, commander.colorIdentity)),
    basicLands: [basic("Mountain", "R")],
  };
}

function swipeAll(session: SwipeSession, deck: Deck, decision: "pick" | "pass" = "pick") {
  let state = { session, deck };
  for (let guard = 0; guard < 500 && state.session.phase !== "done"; guard++) {
    const next = nextCandidate(state.session, state.deck);
    if (!next) break;
    state = decide(state.session, state.deck, next, decision);
  }
  return state;
}

describe("swipe session", () => {
  it("builds a legal 99-card deck within the bracket", () => {
    const deck = emptyDeck(commander, 2);
    const session = createSession(deck, makePoolResponse(makePool(), 2), 42);
    const state = swipeAll(session, deck);
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

    const stats = deckStats(finished);
    expect(stats.lands).toBe(session.template.lands);
    expect(stats.roles.ramp).toBeGreaterThanOrEqual(session.template.roles.ramp);
  });

  it("allows up to three Game Changers in bracket 3", () => {
    const deck = emptyDeck(commander, 3);
    const changers = [1, 2, 3, 4].map((i) => spell(`Changer ${i}`, 2, [], { gameChanger: true, synergy: 1, inclusion: 1 }));
    const session = createSession(deck, makePoolResponse([...makePool(), ...changers], 3), 7);
    const state = swipeAll(session, deck);
    expect(bracketCounts(expandEntries(state.deck.entries)).gameChangers).toBe(3);
  });

  it("offers lands only after the spell slots are full", () => {
    const deck = emptyDeck(commander);
    const session = createSession(deck, makePoolResponse(makePool(), 3), 1);
    let state = { session, deck };
    while (state.session.phase === "spells") {
      const next = nextCandidate(state.session, state.deck)!;
      expect(isLand(next)).toBe(false);
      state = decide(state.session, state.deck, next, "pick");
    }
    expect(state.session.phase).toBe("lands");
    expect(deckStats(state.deck).nonlands).toBe(DECK_SIZE - session.template.lands);
    expect(isLand(nextCandidate(state.session, state.deck)!)).toBe(true);
  });

  it("never offers a passed card again and undo restores it", () => {
    const deck = emptyDeck(commander);
    const session = createSession(deck, makePoolResponse(makePool(), 3), 3);
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
    const deck = emptyDeck(commander);
    const session = createSession(deck, makePoolResponse(makePool(), 3), 5);
    const next = nextCandidate(session, deck)!;
    const state = decide(session, deck, next, "maybe");
    expect(state.deck.entries).toHaveLength(0);
    expect(state.deck.maybe.map((c) => c.id)).toEqual([next.id]);
  });

  it("can skip straight to lands and finish with basics", () => {
    const deck = emptyDeck(commander);
    const session = skipToLands(createSession(deck, makePoolResponse(makePool(), 3), 9), deck);
    expect(session.phase).toBe("lands");
    const finished = finish(session, deck);
    expect(deckCount(finished.entries)).toBe(DECK_SIZE);
    expect(finished.entries[0].card.name).toBe("Mountain");
  });
});
