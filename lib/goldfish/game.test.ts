import { describe, expect, it } from "vitest";

import { basic, card } from "@/tests/fixtures";

import {
  addCounter,
  availableMana,
  bottomCards,
  cardsToBottom,
  commanderTax,
  copyAsToken,
  draw,
  keepHand,
  mill,
  moveCard,
  mulligan,
  newGame,
  nextTurn,
  resolveLook,
  toggleTap,
} from "./game";
import { simulateOpeningHands } from "./simulate";
import type { GameState } from "./types";

const commander = card({ name: "Krenko, Mob Boss", cmc: 4, typeLine: "Legendary Creature — Goblin Warrior" });
const mountain = basic("Mountain", "R");
const spells = Array.from({ length: 63 }, (_, i) => ({ card: card({ name: `Spell ${i}`, typeLine: "Sorcery" }), quantity: 1 }));
const deck = { commander, entries: [...spells, { card: mountain, quantity: 36 }] };

function totalCards(state: GameState): number {
  return Object.values(state.zones).reduce((sum, zone) => sum + zone.length, 0);
}

describe("goldfish game", () => {
  it("starts with the commander in the command zone and 7 cards in hand", () => {
    const game = newGame(deck, 1);
    expect(game.zones.command).toHaveLength(1);
    expect(game.cards[game.zones.command[0]].isCommander).toBe(true);
    expect(game.zones.hand).toHaveLength(7);
    expect(game.zones.library).toHaveLength(92);
    expect(game.life).toBe(40);
    expect(game.phase).toBe("mulligan");
  });

  it("is reproducible for a seed and differs between seeds", () => {
    expect(newGame(deck, 5).zones.library).toEqual(newGame(deck, 5).zones.library);
    expect(newGame(deck, 5).zones.library).not.toEqual(newGame(deck, 6).zones.library);
  });

  it("gives one free mulligan, then puts cards on the bottom", () => {
    let game = mulligan(newGame(deck, 1));
    expect(game.zones.hand).toHaveLength(7);
    expect(cardsToBottom(game)).toBe(0);
    expect(keepHand(game).phase).toBe("playing");

    game = mulligan(game);
    expect(cardsToBottom(game)).toBe(1);
    game = keepHand(game);
    expect(game.phase).toBe("bottom");
    const bottom = game.zones.hand[0];
    game = bottomCards(game, [bottom]);
    expect(game.phase).toBe("playing");
    expect(game.zones.hand).toHaveLength(6);
    expect(game.zones.library.at(-1)).toBe(bottom);
    expect(totalCards(game)).toBe(100);
  });

  it("moves cards and resets battlefield state when they leave", () => {
    let game = keepHand(newGame(deck, 1));
    const id = game.zones.hand[0];
    game = moveCard(game, id, "battlefield");
    game = toggleTap(addCounter(game, id, "+1/+1", 2), id);
    expect(game.cards[id]).toMatchObject({ tapped: true, counters: { "+1/+1": 2 } });

    game = moveCard(game, id, "library", { position: "bottom" });
    expect(game.zones.library.at(-1)).toBe(id);
    expect(game.cards[id]).toMatchObject({ tapped: false, counters: {} });
    expect(totalCards(game)).toBe(100);
  });

  it("removes tokens that leave the battlefield", () => {
    let game = keepHand(newGame(deck, 1));
    const id = game.zones.hand[0];
    game = copyAsToken(moveCard(game, id, "battlefield"), id);
    const token = game.zones.battlefield[1];
    expect(game.cards[token].isToken).toBe(true);
    game = moveCard(game, token, "graveyard");
    expect(game.cards[token]).toBeUndefined();
    expect(game.zones.graveyard).not.toContain(token);
  });

  it("tracks commander tax", () => {
    let game = keepHand(newGame(deck, 1));
    const commanderId = game.zones.command[0];
    game = moveCard(game, commanderId, "battlefield");
    game = moveCard(game, commanderId, "command");
    expect(commanderTax(game)).toBe(2);
  });

  it("untaps and draws on the next turn", () => {
    let game = keepHand(newGame(deck, 1));
    const id = game.zones.hand[0];
    game = toggleTap(moveCard(game, id, "battlefield"), id);
    game = nextTurn(game);
    expect(game.turn).toBe(2);
    expect(game.cards[id].tapped).toBe(false);
    expect(game.zones.hand).toHaveLength(7);
  });

  it("resolves scry and mill", () => {
    let game = keepHand(newGame(deck, 1));
    const [a, b] = game.zones.library;
    game = resolveLook(game, { top: [b], bottom: [a], graveyard: [] }, "Scry");
    expect(game.zones.library[0]).toBe(b);
    expect(game.zones.library.at(-1)).toBe(a);
    game = mill(game, 3);
    expect(game.zones.graveyard).toHaveLength(3);
    expect(totalCards(draw(game, 2))).toBe(100);
  });

  it("counts untapped mana sources", () => {
    let game = keepHand(newGame(deck, 3));
    const lands = game.zones.library.filter((id) => game.cards[id].card.name === "Mountain").slice(0, 3);
    for (const id of lands) game = moveCard(game, id, "battlefield");
    game = toggleTap(game, lands[0]);
    expect(availableMana(game)).toEqual({ total: 2, colors: { R: 2 } });
  });
});

describe("opening hand simulation", () => {
  it("reports land distribution and commander timing", () => {
    const result = simulateOpeningHands(deck, 500, 1);
    expect(result.landShares.reduce((a, b) => a + b, 0)).toBeCloseTo(1);
    expect(result.averageLands).toBeGreaterThan(2);
    expect(result.averageLands).toBeLessThan(3.2);
    expect(result.commanderByTurn.at(-1)).toBeGreaterThan(0.85);
    expect(result.averageCommanderTurn).toBeGreaterThanOrEqual(4);
  });
});
