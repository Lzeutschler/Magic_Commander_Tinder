"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Card } from "@/lib/cards/types";
import { frontFaceName } from "@/lib/cards/names";
import {
  decide,
  finish,
  skipToLands,
  undo,
  type SwipeDecision,
  type SwipeSession,
} from "@/lib/deckbuilder/session";
import type { Bracket } from "@/lib/edhrec/types";
import type { Deck } from "@/lib/decks/types";

interface DeckStore {
  decks: Record<string, Deck>;
  /** In-progress swipe sessions, keyed by deck id. */
  sessions: Record<string, SwipeSession>;

  createDeck(input: { commander: Card; bracket: Bracket; theme: string | null; name?: string; entries?: Deck["entries"]; maybe?: Card[] }): string;
  updateDeck(id: string, update: (deck: Deck) => Deck): void;
  deleteDeck(id: string): void;
  setSession(deckId: string, session: SwipeSession | null): void;
  swipe(deckId: string, cardId: string, decision: SwipeDecision): void;
  undoSwipe(deckId: string): void;
  skipToLands(deckId: string): void;
  /** Fills the deck with basics and ends its swipe session. */
  finishSwipe(deckId: string): void;
}

export const useDeckStore = create<DeckStore>()(
  persist(
    (set, get) => ({
      decks: {},
      sessions: {},

      createDeck({ commander, bracket, theme, name, entries = [], maybe = [] }) {
        const id = crypto.randomUUID();
        const now = Date.now();
        const deck: Deck = {
          id,
          name: name ?? frontFaceName(commander.name),
          commander,
          bracket,
          theme,
          entries,
          maybe,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ decks: { ...s.decks, [id]: deck } }));
        return id;
      },

      updateDeck(id, update) {
        const deck = get().decks[id];
        if (!deck) return;
        set((s) => ({ decks: { ...s.decks, [id]: { ...update(deck), updatedAt: Date.now() } } }));
      },

      deleteDeck(id) {
        set((s) => {
          const { [id]: _deck, ...decks } = s.decks;
          const { [id]: _session, ...sessions } = s.sessions;
          return { decks, sessions };
        });
      },

      setSession(deckId, session) {
        set((s) => {
          const { [deckId]: _old, ...sessions } = s.sessions;
          return { sessions: session ? { ...sessions, [deckId]: session } : sessions };
        });
      },

      swipe(deckId, cardId, decision) {
        const { decks, sessions } = get();
        const deck = decks[deckId];
        const session = sessions[deckId];
        const card = session?.pool.find((c) => c.id === cardId);
        if (!deck || !session || !card) return;
        const next = decide(session, deck, card, decision);
        set((s) => ({
          decks: { ...s.decks, [deckId]: next.deck },
          sessions: { ...s.sessions, [deckId]: next.session },
        }));
      },

      undoSwipe(deckId) {
        const { decks, sessions } = get();
        if (!decks[deckId] || !sessions[deckId]) return;
        const next = undo(sessions[deckId], decks[deckId]);
        set((s) => ({
          decks: { ...s.decks, [deckId]: next.deck },
          sessions: { ...s.sessions, [deckId]: next.session },
        }));
      },

      skipToLands(deckId) {
        const { decks, sessions } = get();
        if (!decks[deckId] || !sessions[deckId]) return;
        set((s) => ({ sessions: { ...s.sessions, [deckId]: skipToLands(sessions[deckId], decks[deckId]) } }));
      },

      finishSwipe(deckId) {
        const { decks, sessions } = get();
        if (!decks[deckId] || !sessions[deckId]) return;
        const deck = finish(sessions[deckId], decks[deckId]);
        set((s) => {
          const { [deckId]: _session, ...rest } = s.sessions;
          return { decks: { ...s.decks, [deckId]: deck }, sessions: rest };
        });
      },
    }),
    {
      name: "commander-tinder",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/** False during SSR and until the persisted decks have been read from localStorage. */
export function useDecksHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useDeckStore.persist.onFinishHydration(onChange),
    () => useDeckStore.persist.hasHydrated(),
    () => false,
  );
}
