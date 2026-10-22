import { DEFAULT_PREFERENCES, DEFAULT_SETTINGS } from "@/lib/deckbuilder/settings";
import type { SwipeSession } from "@/lib/deckbuilder/session";
import { recommendTemplate, type DeckTemplate } from "@/lib/deckbuilder/template";

import type { Deck } from "./types";

/** Version of the persisted deck store; bump it together with a step in `migrateDeckStore`. */
export const DECK_STORE_VERSION = 2;

/** Version 1 sessions carried the deck template with four roles and no settings. */
interface TemplateV1 {
  lands: number;
  nonbasicLands: number;
  roles: Record<string, number>;
  curve: number[];
}

type DeckV1 = Omit<Deck, "settings" | "recommendation"> & Partial<Pick<Deck, "settings" | "recommendation">>;
type SessionV1 = Omit<SwipeSession, "combos" | "previouslyPassed"> & { template?: TemplateV1 };

interface PersistedState {
  decks?: Record<string, DeckV1>;
  sessions?: Record<string, SessionV1>;
  passedByCommander?: Record<string, string[]>;
  lastPreferences?: typeof DEFAULT_PREFERENCES;
}

/**
 * Upgrades localStorage state from older versions. Version 1 → 2: decks get default settings, and a
 * running session's template becomes the deck's recommendation (new roles take the bracket defaults).
 */
export function migrateDeckStore(persisted: unknown, version: number): unknown {
  const state = { ...(persisted as PersistedState) };
  if (version < 2) {
    const sessions = state.sessions ?? {};
    const decks: Record<string, Deck> = {};
    for (const [id, deck] of Object.entries(state.decks ?? {})) {
      const template = sessions[id]?.template;
      decks[id] = {
        ...deck,
        settings: deck.settings ?? DEFAULT_SETTINGS,
        recommendation: deck.recommendation ?? (template ? upgradeTemplate(template, deck) : undefined),
      };
    }
    const upgraded: Record<string, SwipeSession> = {};
    for (const [id, session] of Object.entries(sessions)) {
      const { template: _template, ...rest } = session;
      upgraded[id] = { ...rest, combos: null, previouslyPassed: [] };
    }
    Object.assign(state, {
      decks,
      sessions: upgraded,
      passedByCommander: state.passedByCommander ?? {},
      lastPreferences: state.lastPreferences ?? DEFAULT_PREFERENCES,
    });
  }
  return state;
}

function upgradeTemplate(template: TemplateV1, deck: DeckV1): DeckTemplate {
  const defaults = recommendTemplate(deck.bracket, deck.commander.colorIdentity, null);
  return {
    ...defaults,
    lands: template.lands,
    nonbasicLands: template.nonbasicLands,
    roles: { ...defaults.roles, ...template.roles },
    curveProfile: "balanced",
    curve: template.curve,
  };
}
