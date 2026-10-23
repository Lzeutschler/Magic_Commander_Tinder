import { afterEach, describe, expect, it, vi } from "vitest";

import { EdhrecError, fetchCommanderPage } from "@/lib/edhrec/fetch-commander";

import { loadCommanderStats } from "./provider";
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
}));

const fetchPage = vi.mocked(fetchCommanderPage);
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
  });

  it("asks nobody when switched off", async () => {
    vi.stubEnv("RECS_SOURCE", "off");
    await expect(loadCommanderStats("Krenko, Mob Boss", 3, "tokens")).resolves.toEqual({ stats: null, failed: false });
    expect(fetchPage).not.toHaveBeenCalled();
  });

  it("reads EDHREC by commander slug", async () => {
    vi.stubEnv("RECS_SOURCE", "edhrec");
    fetchPage.mockResolvedValue(stats);
    await expect(loadCommanderStats("Krenko, Mob Boss", 3, "tokens")).resolves.toEqual({ stats, failed: false });
    expect(fetchPage).toHaveBeenCalledWith("krenko-mob-boss", 3, "tokens");
  });

  it("treats a missing page as no data and anything else as a failure to retry", async () => {
    vi.stubEnv("RECS_SOURCE", "edhrec");
    fetchPage.mockRejectedValueOnce(new EdhrecError("missing", 404));
    await expect(loadCommanderStats("Krenko, Mob Boss")).resolves.toEqual({ stats: null, failed: false });
    fetchPage.mockRejectedValueOnce(new EdhrecError("busy", 429));
    await expect(loadCommanderStats("Krenko, Mob Boss")).resolves.toEqual({ stats: null, failed: true });
  });
});
