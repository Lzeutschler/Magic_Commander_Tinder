import { describe, expect, it } from "vitest";

import { spell } from "@/tests/fixtures";

import { bracketViolation, deckBracketIssues } from "./brackets";
import { comboBreaksBracket, combosCompletedBy, type Combo } from "./combos";

const combo = (cards: string[], manaValue: number, bracketTag = "S"): Combo => ({ id: cards.join("+"), cards, results: [], bracketTag, manaValue });

describe("two-card combos and brackets", () => {
  it("follows the official bracket guidelines", () => {
    const late = combo(["Kiki-Jiki, Mirror Breaker", "Helm of the Host"], 9);
    const early = combo(["Dramatic Reversal", "Isochron Scepter"], 4);
    const ruthless = combo(["Kinnan, Bonder Prodigy", "Basalt Monolith"], 8, "R");
    const threeCards = combo(["Krenko, Mob Boss", "Skirk Prospector", "Thornbite Staff"], 7, "E");

    expect(comboBreaksBracket(late, 2)).toBe(true);
    expect(comboBreaksBracket(late, 3)).toBe(false);
    expect(comboBreaksBracket(early, 3)).toBe(true);
    expect(comboBreaksBracket(ruthless, 3)).toBe(true);
    expect(comboBreaksBracket(early, 4)).toBe(false);
    expect(comboBreaksBracket(threeCards, 1)).toBe(false);
  });

  it("finds the combos a card completes, counting the commander as a piece", () => {
    const combos = [combo(["Kinnan, Bonder Prodigy", "Basalt Monolith"], 5), combo(["Basalt Monolith", "Rings of Brighthearth"], 7)];
    const completed = combosCompletedBy("Basalt Monolith", combos, new Set(["Kinnan, Bonder Prodigy"]));
    expect(completed.map((c) => c.id)).toEqual(["Kinnan, Bonder Prodigy+Basalt Monolith"]);
  });

  it("rejects a card that completes a forbidden combo and reports combos in finished decks", () => {
    const monolith = spell("Basalt Monolith", 3);
    const combos = [combo(["Kinnan, Bonder Prodigy", "Basalt Monolith"], 5, "R")];
    const context = { commanders: ["Kinnan, Bonder Prodigy"], combos };
    expect(bracketViolation(monolith, [], 3, context)).toMatch(/early two-card combo with Kinnan/);
    expect(bracketViolation(monolith, [], 4, context)).toBeNull();
    expect(deckBracketIssues([monolith], 2, context)).toEqual(["Two-card combo: Kinnan, Bonder Prodigy + Basalt Monolith"]);
  });
});
