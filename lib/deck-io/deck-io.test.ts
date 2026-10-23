import { describe, expect, it } from "vitest";

import { card } from "@/tests/fixtures";

import { exportDeck } from "./export";
import { parseDeckList } from "./parse";

describe("parseDeckList", () => {
  it("reads Moxfield style sections", () => {
    const parsed = parseDeckList(`Commander
1 Krenko, Mob Boss

Deck
1 Sol Ring
1x Goblin Warchief (DOM) 130 *F*
30 Mountain

Maybeboard
1 Skullclamp`);
    expect(parsed.commanders).toEqual([{ name: "Krenko, Mob Boss", quantity: 1 }]);
    expect(parsed.cards).toEqual([
      { name: "Sol Ring", quantity: 1 },
      { name: "Goblin Warchief", quantity: 1 },
      { name: "Mountain", quantity: 30 },
    ]);
    expect(parsed.maybe).toEqual([{ name: "Skullclamp", quantity: 1 }]);
  });

  it("detects commander markers and ignores sideboard lines", () => {
    const parsed = parseDeckList(`1 Atraxa, Praetors' Voice *CMDR*
1 Sol Ring [Ramp]
Arcane Signet
SB: 1 Duress
// a comment`);
    expect(parsed.commanders).toEqual([{ name: "Atraxa, Praetors' Voice", quantity: 1 }]);
    expect(parsed.cards.map((c) => c.name)).toEqual(["Sol Ring", "Arcane Signet"]);
  });

  it("keeps a companion out of the deck", () => {
    const parsed = parseDeckList(`Commander
1 Tymna the Weaver
1 Kraum, Ludevic's Opus

Companion
1 Lurrus of the Dream-Den

Deck
1 Sol Ring`);
    expect(parsed.commanders.map((c) => c.name)).toEqual(["Tymna the Weaver", "Kraum, Ludevic's Opus"]);
    expect(parsed.cards.map((c) => c.name)).toEqual(["Sol Ring"]);
  });
});

describe("exportDeck", () => {
  it("lists both commanders of a pair", () => {
    const commander = card({ name: "Wilson, Refined Grizzly" });
    const partner = card({ name: "Raised by Giants" });
    const parsed = parseDeckList(exportDeck({ commander, partner, entries: [] }, "sections"));
    expect(parsed.commanders.map((c) => c.name)).toEqual(["Wilson, Refined Grizzly", "Raised by Giants"]);
  });

  it("round-trips through the parser", () => {
    const commander = card({ name: "Krenko, Mob Boss", typeLine: "Legendary Creature — Goblin Warrior" });
    const entries = [
      { card: card({ name: "Sol Ring" }), quantity: 1 },
      { card: card({ name: "Mountain", typeLine: "Basic Land — Mountain" }), quantity: 30 },
    ];
    const parsed = parseDeckList(exportDeck({ commander, entries }, "sections"));
    expect(parsed.commanders).toEqual([{ name: "Krenko, Mob Boss", quantity: 1 }]);
    expect(parsed.cards).toEqual(
      expect.arrayContaining([
        { name: "Sol Ring", quantity: 1 },
        { name: "Mountain", quantity: 30 },
      ]),
    );
  });
});
