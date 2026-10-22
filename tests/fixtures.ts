import type { Card, Color, Role } from "@/lib/cards/types";
import type { Candidate } from "@/lib/deckbuilder/types";
import type { Deck } from "@/lib/decks/types";

let nextId = 0;

export function card(overrides: Partial<Card> & { name: string }): Card {
  nextId += 1;
  return {
    id: `card-${nextId}`,
    oracleId: `oracle-${nextId}`,
    manaCost: "{2}",
    cmc: 2,
    typeLine: "Artifact",
    oracleText: "",
    colorIdentity: [],
    producedMana: [],
    image: null,
    edhrecRank: 1000,
    gameChanger: false,
    roles: [],
    priceUsd: 1,
    ...overrides,
  };
}

export function candidate(
  overrides: Partial<Candidate> & { name: string },
): Candidate {
  return { ...card(overrides), synergy: 0.2, inclusion: 0.3, ...overrides };
}

export function spell(name: string, cmc: number, roles: Role[] = [], extra: Partial<Candidate> = {}): Candidate {
  return candidate({ name, cmc, manaCost: `{${Math.max(cmc - 1, 0)}}{R}`, typeLine: "Sorcery", colorIdentity: ["R"], roles, ...extra });
}

export function land(name: string, produced: Color[] = ["R"], extra: Partial<Candidate> = {}): Candidate {
  return candidate({ name, cmc: 0, manaCost: "", typeLine: "Land", producedMana: produced, ...extra });
}

export function basic(name: string, color: Color): Card {
  return card({ name, cmc: 0, manaCost: "", typeLine: "Basic Land — " + name, producedMana: [color] });
}

export function emptyDeck(commander: Card, bracket: Deck["bracket"] = 3): Deck {
  return {
    id: "deck-1",
    name: "Test Deck",
    commander,
    bracket,
    theme: null,
    entries: [],
    maybe: [],
    createdAt: 0,
    updatedAt: 0,
  };
}
