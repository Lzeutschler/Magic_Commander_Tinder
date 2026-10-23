import { describe, expect, it } from "vitest";

import { edhrecCardUrl, edhrecCommanderUrl } from "./links";

describe("EDHREC links", () => {
  it("point at the commander page narrowed like our data", () => {
    expect(edhrecCommanderUrl("Krenko, Mob Boss")).toBe("https://edhrec.com/commanders/krenko-mob-boss");
    expect(edhrecCommanderUrl("Krenko, Mob Boss", 2, "tokens")).toBe("https://edhrec.com/commanders/krenko-mob-boss/core/tokens");
    expect(edhrecCommanderUrl("Atraxa, Praetors' Voice", 4, null)).toBe("https://edhrec.com/commanders/atraxa-praetors-voice/optimized");
  });

  it("use the front face for double-faced cards", () => {
    expect(edhrecCardUrl("Fable of the Mirror-Breaker // Reflection of Kiki-Jiki")).toBe("https://edhrec.com/cards/fable-of-the-mirror-breaker");
  });
});
