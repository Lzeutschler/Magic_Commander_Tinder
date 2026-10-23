import { describe, expect, it } from "vitest";

import { edhrecCardUrl, edhrecCommanderUrl } from "./links";

const krenko = { name: "Krenko, Mob Boss", typeLine: "Legendary Creature — Goblin Warrior" };
const atraxa = { name: "Atraxa, Praetors' Voice", typeLine: "Legendary Creature — Phyrexian Angel Horror" };

describe("EDHREC links", () => {
  it("point at the commander page narrowed like our data", () => {
    expect(edhrecCommanderUrl([krenko])).toBe("https://edhrec.com/commanders/krenko-mob-boss");
    expect(edhrecCommanderUrl([krenko], 2, "tokens")).toBe("https://edhrec.com/commanders/krenko-mob-boss/core/tokens");
    expect(edhrecCommanderUrl([atraxa], 4, null)).toBe("https://edhrec.com/commanders/atraxa-praetors-voice/optimized");
  });

  it("put pairs in EDHREC's order", () => {
    const tymna = { name: "Tymna the Weaver", typeLine: "Legendary Creature — Human Cleric" };
    const kraum = { name: "Kraum, Ludevic's Opus", typeLine: "Legendary Creature — Zombie Horror" };
    expect(edhrecCommanderUrl([tymna, kraum])).toBe("https://edhrec.com/commanders/kraum-ludevics-opus-tymna-the-weaver");
    const raised = { name: "Raised by Giants", typeLine: "Legendary Enchantment — Background" };
    const wilson = { name: "Wilson, Refined Grizzly", typeLine: "Legendary Creature — Bear Warrior" };
    expect(edhrecCommanderUrl([raised, wilson])).toBe("https://edhrec.com/commanders/wilson-refined-grizzly-raised-by-giants");
    const rose = { name: "Rose Tyler", typeLine: "Legendary Creature — Human" };
    const doctor = { name: "The Tenth Doctor", typeLine: "Legendary Creature — Time Lord Doctor" };
    expect(edhrecCommanderUrl([rose, doctor])).toBe("https://edhrec.com/commanders/the-tenth-doctor-rose-tyler");
  });

  it("use the front face for double-faced cards", () => {
    expect(edhrecCardUrl("Fable of the Mirror-Breaker // Reflection of Kiki-Jiki")).toBe("https://edhrec.com/cards/fable-of-the-mirror-breaker");
  });
});
