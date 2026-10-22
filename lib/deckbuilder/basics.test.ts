import { describe, expect, it } from "vitest";

import type { Color } from "@/lib/cards/types";
import { deckCount } from "@/lib/decks/stats";
import { DECK_SIZE, type DeckEntry } from "@/lib/decks/types";
import { basic, card, land } from "@/tests/fixtures";

import { fillBasics } from "./basics";

const BASICS = [basic("Plains", "W"), basic("Swamp", "B"), basic("Mountain", "R")];

function spells(cost: string, n: number, colors: Color[]): DeckEntry[] {
  return Array.from({ length: n }, (_, i) => ({ card: card({ name: `${cost} ${i}`, manaCost: cost, typeLine: "Instant", colorIdentity: colors }), quantity: 1 }));
}

function basicsOf(entries: DeckEntry[]) {
  return Object.fromEntries(entries.filter((e) => e.card.typeLine.startsWith("Basic")).map((e) => [e.card.name, e.quantity]));
}

describe("fillBasics", () => {
  it("fills the deck to 99 cards", () => {
    const entries = fillBasics(spells("{1}{B}", 62, ["B"]), ["B"], BASICS);
    expect(deckCount(entries)).toBe(DECK_SIZE);
    expect(basicsOf(entries)).toEqual({ Swamp: 37 });
  });

  it("still gives a light splash a fair number of sources", () => {
    const entries = fillBasics([...spells("{B}{B}", 55, ["B"]), ...spells("{1}{R}", 7, ["R"])], ["B", "R"], BASICS);
    const basics = basicsOf(entries);
    expect(basics.Mountain).toBeGreaterThanOrEqual(9);
    expect(basics.Swamp).toBeGreaterThan(basics.Mountain);
  });

  it("gives fewer basics to colors the nonbasic lands already make", () => {
    const duals = Array.from({ length: 10 }, (_, i) => ({ card: land(`W/B Dual ${i}`, ["W", "B"]), quantity: 1 }));
    const entries = fillBasics([...spells("{1}{W}", 31, ["W"]), ...spells("{1}{R}", 31, ["R"]), ...duals], ["W", "B", "R"], BASICS);
    const basics = basicsOf(entries);
    expect(basics.Swamp ?? 0).toBe(0);
    expect(basics.Mountain).toBeGreaterThan(basics.Plains);
  });
});
