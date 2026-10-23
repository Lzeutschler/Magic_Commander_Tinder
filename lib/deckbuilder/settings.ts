import { deckIdentity, mainDeckSize } from "@/lib/decks/command-zone";
import type { Deck } from "@/lib/decks/types";

import { applyOverrides, recommendTemplate, type DeckTemplate, type TemplateOverrides } from "./template";

export type GameChangerStance = "prefer" | "neutral" | "avoid";

/** How the swipe picks among cards that fit the template. */
export interface SwipePreferences {
  /** 0 = only EDHREC inclusion (staples), 1 = only EDHREC synergy (commander-specific cards). */
  synergy: number;
  /** Highest price per card in USD; null means no limit. Cards without a price always pass. */
  maxPriceUsd: number | null;
  /** Prefer or avoid Game Changers; the bracket limit applies either way. */
  gameChangers: GameChangerStance;
  /** Hide cards already swiped left for this commander, in this or other decks. */
  hidePassed: boolean;
}

export interface DeckSettings {
  overrides: TemplateOverrides;
  preferences: SwipePreferences;
}

export const DEFAULT_PREFERENCES: SwipePreferences = {
  synergy: 0.55,
  maxPriceUsd: null,
  gameChangers: "neutral",
  hidePassed: false,
};

export const DEFAULT_SETTINGS: DeckSettings = { overrides: {}, preferences: DEFAULT_PREFERENCES };

export const SYNERGY_STEPS = [
  { value: 0.15, label: "Staples" },
  { value: 0.35, label: "More staples" },
  { value: 0.55, label: "Balanced" },
  { value: 0.75, label: "More synergy" },
  { value: 0.95, label: "Synergy" },
] as const;

export const BUDGET_STEPS: (number | null)[] = [null, 50, 20, 10, 5, 2, 1];

/**
 * The template recommended for the deck, or the bracket defaults for imported decks. Its size always
 * follows the deck, since recommendations saved before partners existed have none.
 */
export function deckRecommendation(deck: Pick<Deck, "bracket" | "commander" | "partner" | "recommendation">): DeckTemplate {
  const size = mainDeckSize(deck);
  return deck.recommendation ? { ...deck.recommendation, size } : recommendTemplate(deck.bracket, deckIdentity(deck), null, size);
}

/** The template the deck swipes against: its recommendation plus the deck's own overrides. */
export function deckTemplate(deck: Pick<Deck, "bracket" | "commander" | "partner" | "recommendation" | "settings">): DeckTemplate {
  return applyOverrides(deckRecommendation(deck), deck.settings.overrides, deck.bracket);
}

/** Back to the recommended targets and curve; budget and hidden cards are personal limits and stay. */
export function resetToRecommendation(settings: DeckSettings): DeckSettings {
  return {
    overrides: {},
    preferences: {
      ...DEFAULT_PREFERENCES,
      maxPriceUsd: settings.preferences.maxPriceUsd,
      hidePassed: settings.preferences.hidePassed,
    },
  };
}

function hasOverrides({ roles, ...rest }: TemplateOverrides): boolean {
  return Object.values({ ...rest, ...roles }).some((v) => v !== undefined);
}

export function isRecommended(settings: DeckSettings): boolean {
  const { overrides, preferences } = settings;
  return (
    !hasOverrides(overrides) &&
    preferences.synergy === DEFAULT_PREFERENCES.synergy &&
    preferences.gameChangers === DEFAULT_PREFERENCES.gameChangers
  );
}

/**
 * Short notes on everything that differs from the defaults, e.g. ["Max. $5 per card", "More synergy"].
 * `budget: false` leaves the price limit out where it is shown on its own.
 */
export function describeSettings(settings: DeckSettings, { budget = true }: { budget?: boolean } = {}): string[] {
  const { overrides, preferences } = settings;
  const notes: string[] = [];
  if (hasOverrides(overrides)) notes.push("Custom targets");
  if (budget && preferences.maxPriceUsd !== null) notes.push(`Max. $${preferences.maxPriceUsd} per card`);
  if (preferences.synergy !== DEFAULT_PREFERENCES.synergy) {
    notes.push(SYNERGY_STEPS.find((s) => s.value === preferences.synergy)?.label ?? "Custom weighting");
  }
  if (preferences.gameChangers !== "neutral") notes.push(`${preferences.gameChangers === "prefer" ? "Prefer" : "Avoid"} Game Changers`);
  if (preferences.hidePassed) notes.push("Hiding passed cards");
  return notes;
}
