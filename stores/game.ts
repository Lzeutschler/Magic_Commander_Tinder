"use client";

import { create } from "zustand";

import { newGame } from "@/lib/goldfish/game";
import type { GameState } from "@/lib/goldfish/types";
import type { Deck } from "@/lib/decks/types";
import { randomSeed } from "@/lib/random";

const UNDO_LIMIT = 200;

interface GameStore {
  deckId: string | null;
  game: GameState | null;
  past: GameState[];
  start(deck: Deck): void;
  /** Applies a pure game action and remembers the previous state for undo. */
  act(action: (game: GameState) => GameState): void;
  undo(): void;
}

export const useGameStore = create<GameStore>()((set, get) => ({
  deckId: null,
  game: null,
  past: [],

  start(deck) {
    set({ deckId: deck.id, game: newGame(deck, randomSeed()), past: [] });
  },

  act(action) {
    const { game, past } = get();
    if (!game) return;
    const next = action(game);
    if (next === game) return;
    set({ game: next, past: [...past.slice(-(UNDO_LIMIT - 1)), game] });
  },

  undo() {
    const { past } = get();
    const previous = past.at(-1);
    if (previous) set({ game: previous, past: past.slice(0, -1) });
  },
}));
