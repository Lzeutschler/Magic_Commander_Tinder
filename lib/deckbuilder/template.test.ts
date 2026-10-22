import { describe, expect, it } from "vitest";

import { DECK_SIZE } from "@/lib/decks/types";
import { candidate, land, spell } from "@/tests/fixtures";

import {
  applyOverrides,
  curveAverage,
  karstenLands,
  profilePool,
  recommendTemplate,
  type PoolProfile,
} from "./template";

const neutral: PoolProfile = {
  averageLands: 36,
  roles: { ramp: 10, draw: 10, interaction: 9, boardwipe: 3, protection: 3, wincon: 3 },
  averageManaValue: 3,
  cheapRampDraw: 8,
};

describe("recommended template", () => {
  it("uses bracket defaults without EDHREC data", () => {
    const template = recommendTemplate(2, ["R"], null);
    expect(template.lands).toBe(37);
    expect(template.roles.ramp).toBe(10);
    expect(template.maxTutors).toBe(2);
    expect(template.curve.reduce((a, b) => a + b, 0)).toBe(DECK_SIZE - template.lands);
  });

  it("moves role targets halfway towards what the commander's decks play", () => {
    const voltron = recommendTemplate(3, ["W"], { ...neutral, roles: { ...neutral.roles, protection: 21, ramp: 4 } });
    expect(voltron.roles.protection).toBe(12);
    expect(voltron.roles.ramp).toBe(7);
  });

  it("keeps commander-specific targets inside guard rails", () => {
    const odd = recommendTemplate(3, ["G"], { ...neutral, roles: { ...neutral.roles, ramp: 60, boardwipe: 0, draw: 0 } });
    expect(odd.roles.ramp).toBe(20);
    expect(odd.roles.draw).toBe(6);
    expect(odd.roles.boardwipe).toBe(2);
  });

  it("blends the EDHREC land count with Karsten's formula and clamps it per bracket", () => {
    // Karsten for MV 4.3 and 10 cheap ramp/draw spells is about 42.1; EDHREC says 36.
    const heavy = recommendTemplate(3, ["R", "G"], { ...neutral, averageManaValue: 4.3, cheapRampDraw: 10 });
    expect(heavy.lands).toBe(39);
    expect(heavy.curveProfile).toBe("high");

    const cedh = recommendTemplate(5, ["U", "G"], { ...neutral, averageLands: 25, averageManaValue: 2.4, cheapRampDraw: 25 });
    expect(cedh.lands).toBe(28);
  });

  it("gives more nonbasic lands to more colors and faster brackets", () => {
    expect(recommendTemplate(3, ["R"], null).nonbasicLands).toBeLessThan(recommendTemplate(3, ["U", "B", "G"], null).nonbasicLands);
    expect(recommendTemplate(5, ["U", "G"], null).nonbasicLands).toBeGreaterThan(recommendTemplate(2, ["U", "G"], null).nonbasicLands);
  });
});

describe("template overrides", () => {
  const recommended = recommendTemplate(3, ["B", "G"], null);

  it("replaces only the values that are set", () => {
    const template = applyOverrides(recommended, { roles: { ramp: 14 }, maxTutors: null }, 3);
    expect(template.roles.ramp).toBe(14);
    expect(template.roles.draw).toBe(recommended.roles.draw);
    expect(template.maxTutors).toBeNull();
    expect(template.lands).toBe(recommended.lands);
  });

  it("rebuilds the curve for a new land count or curve profile", () => {
    const fewerLands = applyOverrides(recommended, { lands: 32 }, 3);
    expect(fewerLands.curve.reduce((a, b) => a + b, 0)).toBe(DECK_SIZE - 32);

    const low = curveAverage(applyOverrides(recommended, { curveProfile: "low" }, 3).curve);
    const high = curveAverage(applyOverrides(recommended, { curveProfile: "high" }, 3).curve);
    expect(low).toBeLessThan(curveAverage(recommended.curve));
    expect(high).toBeGreaterThan(curveAverage(recommended.curve));
  });

  it("never wants more nonbasic lands than lands", () => {
    expect(applyOverrides(recommended, { lands: 10, nonbasicLands: 20 }, 3).nonbasicLands).toBe(10);
  });
});

describe("pool profile", () => {
  it("is only built from EDHREC data", () => {
    expect(profilePool({ candidates: [], averageLands: 36, source: "fallback" })).toBeNull();
  });

  it("scales role counts up to a full deck", () => {
    const candidates = [
      ...Array.from({ length: 20 }, (_, i) => spell(`Ramp ${i}`, 2, ["ramp"], { inclusion: 0.5 })),
      ...Array.from({ length: 40 }, (_, i) => spell(`Other ${i}`, 4, [], { inclusion: 0.5 })),
      land("Some Land", ["R"], { inclusion: 0.9 }),
      candidate({ name: "Protection", cmc: 2, roles: ["protection"], inclusion: 0 }),
    ];
    const profile = profilePool({ candidates, averageLands: 37, source: "edhrec" })!;
    // 30 listed nonland slots scale up to the 62 a deck with 37 lands has.
    expect(profile.roles.ramp).toBeCloseTo(10 * (62 / 30));
    expect(profile.averageManaValue).toBeCloseTo((10 * 2 + 20 * 4) / 30);
    expect(profile.cheapRampDraw).toBeCloseTo(profile.roles.ramp);
  });
});

describe("Karsten land formula", () => {
  it("matches the published regression", () => {
    expect(karstenLands(3, 10)).toBeCloseTo(38.01);
    expect(karstenLands(3.3, 7)).toBeCloseTo(39.8, 1);
  });
});
