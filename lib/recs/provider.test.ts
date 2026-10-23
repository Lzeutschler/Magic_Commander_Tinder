import { afterEach, describe, expect, it, vi } from "vitest";

import { EdhrecError, fetchCommanderPage } from "@/lib/edhrec/fetch-commander";

import { loadCommanderStats } from "./provider";
import { loadSnapshotStats } from "./snapshot";
import { recsSource } from "./source";

vi.mock("@/lib/edhrec/fetch-commander", () => ({
  EdhrecError: class EdhrecError extends Error {
    constructor(
      message: string,
      readonly status: number,
    ) {
      super(message);
    }
  },
  fetchCommanderPage: vi.fn(),
  fetchPairingsPage: vi.fn(),
}));

vi.mock("./snapshot", () => ({ loadSnapshotStats: vi.fn() }));

const fetchPage = vi.mocked(fetchCommanderPage);
const snapshot = vi.mocked(loadSnapshotStats);
const krenko = { name: "Krenko, Mob Boss", typeLine: "Legendary Creature — Goblin Warrior" };
const stats = { deckCount: 120, themes: [], bracketCounts: {}, averageLands: 37, cards: [] };

describe("recsSource", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("defaults to EDHREC", () => {
    vi.stubEnv("RECS_SOURCE", "");
    expect(recsSource()).toBe("edhrec");
  });

  it("reads the variable case-insensitively", () => {
    vi.stubEnv("RECS_SOURCE", " OFF ");
    expect(recsSource()).toBe("off");
  });

  it("turns statistics off for unknown values", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("RECS_SOURCE", "edhrecc");
    expect(recsSource()).toBe("off");
  });
});

describe("loadCommanderStats", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    fetchPage.mockReset();
    snapshot.mockReset();
  });

  it("asks nobody when switched off", async () => {
    vi.stubEnv("RECS_SOURCE", "off");
    await expect(loadCommanderStats([krenko], 3, "tokens")).resolves.toEqual({ stats: null, failed: false });
    expect(fetchPage).not.toHaveBeenCalled();
  });

  it("reads EDHREC by commander slug", async () => {
    vi.stubEnv("RECS_SOURCE", "edhrec");
    fetchPage.mockResolvedValue(stats);
    await expect(loadCommanderStats([krenko], 3, "tokens")).resolves.toEqual({ stats, failed: false });
    expect(fetchPage).toHaveBeenCalledWith("krenko-mob-boss", 3, "tokens");
  });

  it("reads a pair from its own page", async () => {
    vi.stubEnv("RECS_SOURCE", "edhrec");
    fetchPage.mockResolvedValue(stats);
    const giants = { name: "Raised by Giants", typeLine: "Legendary Enchantment — Background" };
    const wilson = { name: "Wilson, Refined Grizzly", typeLine: "Legendary Creature — Bear Warrior" };
    await loadCommanderStats([giants, wilson]);
    expect(fetchPage).toHaveBeenCalledWith("wilson-refined-grizzly-raised-by-giants", undefined, undefined);
  });

  it("treats a missing page as no data and anything else as a failure to retry", async () => {
    vi.stubEnv("RECS_SOURCE", "edhrec");
    snapshot.mockResolvedValue(null);
    fetchPage.mockRejectedValueOnce(new EdhrecError("missing", 404));
    await expect(loadCommanderStats([krenko])).resolves.toEqual({ stats: null, failed: false });
    fetchPage.mockRejectedValueOnce(new EdhrecError("busy", 429));
    await expect(loadCommanderStats([krenko])).resolves.toEqual({ stats: null, failed: true });
  });

  it("stands in with the bulk data snapshot when EDHREC cannot be asked, still as a failure to retry", async () => {
    vi.stubEnv("RECS_SOURCE", "edhrec");
    snapshot.mockResolvedValue(stats);
    fetchPage.mockRejectedValueOnce(new EdhrecError("busy", 429));
    await expect(loadCommanderStats([krenko], 3)).resolves.toEqual({ stats, failed: true });
    expect(snapshot).toHaveBeenCalledWith([krenko]);

    fetchPage.mockResolvedValueOnce(stats);
    await loadCommanderStats([krenko]);
    expect(snapshot).toHaveBeenCalledTimes(1);
  });

  it("does not read the snapshot when switched off", async () => {
    vi.stubEnv("RECS_SOURCE", "off");
    await loadCommanderStats([krenko]);
    expect(snapshot).not.toHaveBeenCalled();
  });
});
