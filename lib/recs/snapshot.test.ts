import { existsSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { loadSnapshotStats } from "./snapshot";

// Reads the snapshot that scripts/build-recs-snapshot.ts wrote to data/recs-snapshot/, when it exists.
describe.skipIf(!existsSync("data/recs-snapshot/krenko-mob-boss.json"))("loadSnapshotStats", () => {
  it("turns a commander's file into deck statistics", async () => {
    const stats = (await loadSnapshotStats([{ name: "Krenko, Mob Boss" }]))!;
    expect(stats.deckCount).toBeGreaterThan(1000);
    const warchief = stats.cards.find((c) => c.name === "Goblin Warchief")!;
    expect(warchief.inclusion).toBeCloseTo(warchief.decks / stats.deckCount);
    expect(warchief.synergy).toBeGreaterThan(0.3);
  });

  it("answers null for commanders without a file", async () => {
    await expect(loadSnapshotStats([{ name: "No Such Commander" }])).resolves.toBeNull();
    await expect(loadSnapshotStats([{ name: "../../package" }])).resolves.toBeNull();
  });
});
