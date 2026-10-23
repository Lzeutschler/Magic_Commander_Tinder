import { produce, type Draft } from "immer";

import type { Card } from "@/lib/cards/types";
import { expandEntries } from "@/lib/decks/stats";
import { commandZone } from "@/lib/decks/command-zone";
import type { Deck } from "@/lib/decks/types";
import { seededRandom } from "@/lib/random";

import type { GameCard, GameState, LookResult, PlayCard, ZoneId } from "./types";

export const STARTING_LIFE = 40;
export const OPENING_HAND = 7;
const LOG_LENGTH = 30;

/**
 * Pure game actions for the goldfish sandbox. Every function returns a new state and leaves
 * the input untouched, so the store can keep old states for undo.
 */

export function shuffled<T>(items: readonly T[], seed: number): T[] {
  const random = seededRandom(seed);
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function makeCard(card: PlayCard, id: string, extra: Partial<GameCard> = {}): GameCard {
  return {
    instanceId: id,
    card,
    tapped: false,
    counters: {},
    faceDown: false,
    flipped: false,
    isToken: false,
    isCommander: false,
    ...extra,
  };
}

/** Commanders in the command zone, the 99 (or 98) shuffled into the library and an opening hand of 7. */
export function newGame(deck: Pick<Deck, "commander" | "partner" | "entries">, seed: number): GameState {
  const cards: Record<string, GameCard> = {};
  const commanderIds = commandZone(deck).map((commander, i) => {
    const id = i === 0 ? "c0" : `p${i}`;
    cards[id] = makeCard(commander, id, { isCommander: true });
    return id;
  });

  const library = expandEntries(deck.entries).map((card: Card, i) => {
    const id = `c${i + 1}`;
    cards[id] = makeCard(card, id);
    return id;
  });

  const state: GameState = {
    cards,
    zones: {
      library: shuffled(library, seed),
      hand: [],
      battlefield: [],
      graveyard: [],
      exile: [],
      command: commanderIds,
    },
    life: STARTING_LIFE,
    turn: 0,
    phase: "mulligan",
    mulligans: 0,
    commanderCasts: {},
    seed,
    shuffles: 1,
    nextInstance: library.length + 1,
    log: [],
  };
  return draw(state, OPENING_HAND, false);
}

function log(draft: Draft<GameState>, message: string) {
  draft.log.unshift(message);
  draft.log.length = Math.min(draft.log.length, LOG_LENGTH);
}

export function zoneOf(state: GameState, instanceId: string): ZoneId | null {
  for (const zone of Object.keys(state.zones) as ZoneId[]) {
    if (state.zones[zone].includes(instanceId)) return zone;
  }
  return null;
}

function shuffleDraft(draft: Draft<GameState>) {
  draft.shuffles += 1;
  draft.zones.library = shuffled(draft.zones.library, draft.seed + draft.shuffles * 104729);
}

export function draw(state: GameState, count = 1, withLog = true): GameState {
  return produce(state, (draft) => {
    const drawn = draft.zones.library.splice(0, count);
    draft.zones.hand.push(...drawn);
    if (withLog && drawn.length) log(draft, `Drew ${drawn.length === 1 ? "a card" : `${drawn.length} cards`}`);
  });
}

export function shuffleLibrary(state: GameState): GameState {
  return produce(state, (draft) => {
    shuffleDraft(draft);
    log(draft, "Shuffled the library");
  });
}

/** London mulligan: shuffle the hand back and draw 7. The first mulligan in Commander is free. */
export function mulligan(state: GameState): GameState {
  const next = produce(state, (draft) => {
    draft.zones.library.push(...draft.zones.hand);
    draft.zones.hand = [];
    shuffleDraft(draft);
    draft.mulligans += 1;
    log(draft, `Mulligan #${draft.mulligans}`);
  });
  return draw(next, OPENING_HAND, false);
}

/** Cards to put on the bottom after keeping (London mulligan with one free mulligan). */
export function cardsToBottom(state: GameState): number {
  return Math.max(0, state.mulligans - 1);
}

export function keepHand(state: GameState): GameState {
  return produce(state, (draft) => {
    if (cardsToBottom(state) > 0) {
      draft.phase = "bottom";
      return;
    }
    draft.phase = "playing";
    draft.turn = 1;
    log(draft, `Kept ${draft.zones.hand.length} cards`);
  });
}

export function bottomCards(state: GameState, instanceIds: string[]): GameState {
  return produce(state, (draft) => {
    draft.zones.hand = draft.zones.hand.filter((id) => !instanceIds.includes(id));
    draft.zones.library.push(...instanceIds);
    draft.phase = "playing";
    draft.turn = 1;
    log(draft, `Kept ${draft.zones.hand.length} cards, ${instanceIds.length} to the bottom`);
  });
}

export interface MoveOptions {
  /** Where in the library a card goes; ignored for other zones. */
  position?: "top" | "bottom";
}

/**
 * Moves a card between zones. Leaving the battlefield resets tapped state and counters, and
 * tokens that leave the battlefield cease to exist.
 */
export function moveCard(state: GameState, instanceId: string, to: ZoneId, options: MoveOptions = {}): GameState {
  const from = zoneOf(state, instanceId);
  if (!from) return state;
  if (from === to && to !== "library") return state;

  return produce(state, (draft) => {
    draft.zones[from] = draft.zones[from].filter((id) => id !== instanceId);
    const card = draft.cards[instanceId];

    if (from === "battlefield" && to !== "battlefield") {
      card.tapped = false;
      card.counters = {};
      card.faceDown = false;
    }
    if (card.isToken && to !== "battlefield") {
      delete draft.cards[instanceId];
      log(draft, `${card.card.name} token left the battlefield`);
      return;
    }
    if (card.isCommander && from === "command" && to === "battlefield") {
      draft.commanderCasts[instanceId] = (draft.commanderCasts[instanceId] ?? 0) + 1;
    }

    if (to === "library" && options.position === "bottom") draft.zones.library.push(instanceId);
    else if (to === "library") draft.zones.library.unshift(instanceId);
    else draft.zones[to].push(instanceId);

    const where = to === "library" ? `${options.position ?? "top"} of library` : to;
    log(draft, `${card.faceDown ? "A face-down card" : card.card.name} → ${where}`);
  });
}

export function toggleTap(state: GameState, instanceId: string): GameState {
  return produce(state, (draft) => {
    const card = draft.cards[instanceId];
    if (card) card.tapped = !card.tapped;
  });
}

export function untapAll(state: GameState): GameState {
  return produce(state, (draft) => {
    for (const id of draft.zones.battlefield) draft.cards[id].tapped = false;
  });
}

/** Untap, then draw for the turn. */
export function nextTurn(state: GameState): GameState {
  const untapped = produce(untapAll(state), (draft) => {
    draft.turn += 1;
    log(draft, `Turn ${draft.turn}`);
  });
  return draw(untapped, 1, false);
}

export function addCounter(state: GameState, instanceId: string, kind: string, delta: number): GameState {
  return produce(state, (draft) => {
    const card = draft.cards[instanceId];
    if (!card) return;
    const value = (card.counters[kind] ?? 0) + delta;
    if (value <= 0) delete card.counters[kind];
    else card.counters[kind] = value;
  });
}

export function toggleFlip(state: GameState, instanceId: string): GameState {
  return produce(state, (draft) => {
    const card = draft.cards[instanceId];
    if (card) card.flipped = !card.flipped;
  });
}

export function toggleFaceDown(state: GameState, instanceId: string): GameState {
  return produce(state, (draft) => {
    const card = draft.cards[instanceId];
    if (card) card.faceDown = !card.faceDown;
  });
}

export function createTokens(state: GameState, card: PlayCard, count = 1): GameState {
  return produce(state, (draft) => {
    for (let i = 0; i < count; i++) {
      const id = `t${draft.nextInstance++}`;
      draft.cards[id] = makeCard(card, id, { isToken: true });
      draft.zones.battlefield.push(id);
    }
    log(draft, `Created ${count === 1 ? "a" : count} ${card.name} token${count === 1 ? "" : "s"}`);
  });
}

export function copyAsToken(state: GameState, instanceId: string): GameState {
  const original = state.cards[instanceId];
  return original ? createTokens(state, original.card) : state;
}

export function mill(state: GameState, count: number): GameState {
  return produce(state, (draft) => {
    const milled = draft.zones.library.splice(0, count);
    draft.zones.graveyard.push(...milled);
    log(draft, `Milled ${milled.length}`);
  });
}

/** Applies the result of scry, surveil or a reveal of the top cards. */
export function resolveLook(state: GameState, result: LookResult, label: string): GameState {
  return produce(state, (draft) => {
    const looked = new Set([...result.top, ...result.bottom, ...result.graveyard]);
    const rest = draft.zones.library.filter((id) => !looked.has(id));
    draft.zones.library = [...result.top, ...rest, ...result.bottom];
    draft.zones.graveyard.push(...result.graveyard);
    log(draft, `${label} ${looked.size}: ${result.top.length} top, ${result.bottom.length} bottom${result.graveyard.length ? `, ${result.graveyard.length} graveyard` : ""}`);
  });
}

export function changeLife(state: GameState, delta: number): GameState {
  return produce(state, (draft) => {
    draft.life += delta;
  });
}

/** Untapped mana-producing permanents (lands, rocks, dorks), counted once each, by color. */
export function availableMana(state: GameState): { total: number; colors: Record<string, number> } {
  const colors: Record<string, number> = {};
  let total = 0;
  for (const id of state.zones.battlefield) {
    const { card, tapped, faceDown } = state.cards[id];
    if (tapped || faceDown || !card.producedMana.length) continue;
    total += 1;
    for (const color of card.producedMana) colors[color] = (colors[color] ?? 0) + 1;
  }
  return { total, colors };
}

/** Extra mana the commander `instanceId` costs from the command zone; each commander keeps its own tax. */
export function commanderTax(state: GameState, instanceId: string): number {
  return (state.commanderCasts[instanceId] ?? 0) * 2;
}
