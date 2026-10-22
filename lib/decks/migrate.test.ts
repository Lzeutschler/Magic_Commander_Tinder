import { describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS, deckTemplate } from "@/lib/deckbuilder/settings";
import { card, emptyDeck } from "@/tests/fixtures";

import { migrateDeckStore } from "./migrate";
import type { Deck } from "./types";

const commander = card({ name: "Krenko, Mob Boss", colorIdentity: ["R"] });

function v1Deck(id: string) {
  const { settings: _settings, ...deck } = { ...emptyDeck(commander, 2), id };
  return deck;
}

describe("deck store migration", () => {
  it("gives version 1 decks default settings and keeps a running session's template", () => {
    const persisted = {
      decks: { a: v1Deck("a"), b: v1Deck("b") },
      sessions: {
        a: {
          deckId: "a",
          pool: [],
          basicLands: [],
          source: "edhrec",
          deckCount: 10,
          phase: "spells",
          history: [],
          seed: 1,
          template: { lands: 35, nonbasicLands: 6, roles: { ramp: 11, draw: 10, interaction: 8, boardwipe: 3 }, curve: [8, 16, 16, 12, 6, 6] },
        },
      },
    };
    const state = migrateDeckStore(persisted, 1) as { decks: Record<string, Deck>; sessions: Record<string, unknown>; passedByCommander: object };

    expect(state.decks.b.settings).toEqual(DEFAULT_SETTINGS);
    expect(state.decks.b.recommendation).toBeUndefined();

    const template = deckTemplate(state.decks.a);
    expect(template.lands).toBe(35);
    expect(template.roles.ramp).toBe(11);
    expect(template.roles.protection).toBeGreaterThan(0);
    expect(state.sessions.a).toMatchObject({ combos: null, previouslyPassed: [] });
    expect(state.sessions.a).not.toHaveProperty("template");
    expect(state.passedByCommander).toEqual({});
  });
});
