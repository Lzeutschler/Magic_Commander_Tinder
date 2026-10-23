import { describe, expect, it } from "vitest";

import { colorMask, condenseSnapshot, parseCsvLine, type SnapshotCard, type SnapshotCommander } from "./snapshot-format";

const R = colorMask(["R"]);
const B = colorMask(["B"]);
const BR = colorMask(["B", "R"]);

const cards: (SnapshotCard | null)[] = [
  { name: "Mountain", mask: 0, skip: true },
  { name: "Sol Ring", mask: 0, skip: false },
  { name: "Goblin Warchief", mask: R, skip: false },
  { name: "Lightning Bolt", mask: R, skip: false },
  { name: "Dark Ritual", mask: B, skip: false },
  null,
];

function commander(name: string, mask: number, rows: [card: number, count: number][]): SnapshotCommander {
  return {
    name,
    mask,
    cards: Int32Array.from(rows.map(([card]) => card)),
    counts: Int32Array.from(rows.map(([, count]) => count)),
    length: rows.length,
  };
}

describe("parseCsvLine", () => {
  it("splits plain fields and keeps commas and doubled quotes inside quoted ones", () => {
    expect(parseCsvLine('"Krenko, Mob Boss",Sol Ring,38194')).toEqual(["Krenko, Mob Boss", "Sol Ring", "38194"]);
    expect(parseCsvLine('"Kongming, ""Sleeping Dragon""",Island,12')).toEqual(['Kongming, "Sleeping Dragon"', "Island", "12"]);
  });
});

describe("colorMask", () => {
  it("lets a card fit exactly the identities that contain its colors", () => {
    expect(R & ~BR).toBe(0);
    expect(BR & ~R).not.toBe(0);
    expect(colorMask([])).toBe(0);
  });
});

describe("condenseSnapshot", () => {
  const krenko = commander("Krenko, Mob Boss", R, [
    [0, 100], // Mountain: the deck count
    [1, 90],
    [2, 80],
    [3, 20],
    [4, 15], // off-color, from a partner deck
    [5, 50], // unknown card
  ]);
  const zada = commander("Zada, Hedron Grinder", R, [
    [0, 100],
    [1, 90],
    [3, 60],
  ]);
  const files = condenseSnapshot([krenko, zada], cards, { minDecks: 20, topByDecks: 2, topBySynergy: 1 });

  it("takes the most played card as the deck count and leaves out basics, off-color and unknown cards", () => {
    const file = files.get("Krenko, Mob Boss")!;
    expect(file.deckCount).toBe(100);
    expect(file.cards.map(([name]) => name)).toEqual(["Sol Ring", "Goblin Warchief"]);
  });

  it("scores synergy against all decks of the same color identity", () => {
    const [, warchief] = files.get("Krenko, Mob Boss")!.cards;
    // 80 of Krenko's 100 decks, 80 of the 200 mono-red decks.
    expect(warchief).toEqual(["Goblin Warchief", 80, 0.4]);
    const [ring] = files.get("Krenko, Mob Boss")!.cards;
    expect(ring[2]).toBe(0);
  });

  it("adds high-synergy cards beyond the most played ones", () => {
    const zadaCards = files.get("Zada, Hedron Grinder")!.cards.map(([name]) => name);
    expect(zadaCards).toEqual(["Sol Ring", "Lightning Bolt"]);
    const wide = condenseSnapshot([krenko, zada], cards, { minDecks: 20, topByDecks: 1, topBySynergy: 1 });
    expect(wide.get("Krenko, Mob Boss")!.cards.map(([name]) => name)).toEqual(["Sol Ring", "Goblin Warchief"]);
  });

  it("skips commanders with too few decks", () => {
    const tiny = commander("Tiny", R, [[1, 5]]);
    expect(condenseSnapshot([tiny], cards).has("Tiny")).toBe(false);
  });
});
