import type { Color, CommanderSummary } from "@/lib/cards/types";
import type { ArchetypeId } from "@/lib/tagging/archetypes";

import type { FranchiseId } from "./franchises";

export type Track = "beginner" | "advanced";
export type Tempo = "fast" | "midrange" | "slow";
export type Complexity = "simple" | "medium" | "complex";
export type ColorCount = "mono" | "two" | "three-plus";
/** How the commander stack weighs popularity; switchable while swiping. */
export type PopularityMode = "popular" | "balanced" | "hidden";

/** What picking an answer says about the player. Effects of all picked answers are added up. */
export interface AnswerEffect {
  archetypes?: Partial<Record<ArchetypeId, number>>;
  /** Explicit color choice: commanders outside the chosen colors lose points. */
  color?: Color | "C";
  colorCount?: ColorCount;
  /** Soft color leaning from vibes, e.g. heroes lean white. Negative values lean away. */
  colorLean?: Partial<Record<Color, number>>;
  /** Creature types the player wants to lead (typal commanders score high). */
  tribes?: string[];
  /** Creature types that fit the vibe; commanders of these types score a little higher. */
  creatureLean?: string[];
  /** The player does not want a typal deck. */
  noTribe?: boolean;
  franchise?: FranchiseId;
  /** Magic sets whose commanders fit the vibe, e.g. Bloomburrow for "cozy". */
  sets?: string[];
  tempo?: Tempo;
  complexity?: Complexity;
}

export interface AnswerOption {
  id: string;
  label: string;
  description?: string;
  /** Scryfall image key of the card whose art illustrates the answer. */
  art?: string;
  /** Mana symbol shown instead of (or on top of) art, e.g. "W". */
  symbol?: string;
  /** Answers "none of these" for the whole question: never a card or tile of its own, a gate's "no" picks it. */
  exclusive?: boolean;
  effect: AnswerEffect;
}

/** How a question is put to the player as swipe cards. */
export type QuestionCard =
  /** One yes/no card per answer, the best fit for the answers so far first, until `max` yeses or `limit` cards. */
  | { kind: "yesno"; limit?: number }
  /** One card with two answers side by side: swipe toward one, or up for the one in between. */
  | { kind: "versus"; left: string; right: string; middle?: string }
  /** One card of small tiles to tap, for long lists. A gate first asks whether the question matters at all. */
  | { kind: "pick"; gate?: { title: string; description: string; art: string } };

export interface Question {
  id: string;
  title: string;
  /** A short hint on pick cards. */
  subtitle?: string;
  /** Maximum number of answers. */
  max: number;
  card: QuestionCard;
  options: AnswerOption[];
  /** A row of single-choice chips under the tiles of a pick card. */
  followUp?: Omit<Question, "followUp" | "card">;
}

/** Picked option ids per question id. */
export type Answers = Record<string, string[]>;

/** How a quiz card was answered: yes/no and gates, the sides of a versus card, done or skip on a pick card. */
export type QuizChoice = "yes" | "no" | "left" | "right" | "middle" | "done" | "skip";

/** One answered quiz card. The quiz answers are all swipes' answers added up in order. */
export interface QuizSwipe {
  card: string;
  question: string;
  choice: QuizChoice;
  answers: Answers;
}

export interface QuizProfile {
  track: Track;
  archetypes: Partial<Record<ArchetypeId, number>>;
  /** Explicitly chosen colors, or null when the player skipped the color question. */
  colors: Color[] | null;
  colorless: boolean;
  colorCount: ColorCount | null;
  colorLean: Partial<Record<Color, number>>;
  tribes: string[];
  creatureLean: string[];
  noTribe: boolean;
  franchises: FranchiseId[];
  sets: string[];
  tempo: Tempo | null;
  complexity: Complexity | null;
}

export type FitReasonKind =
  | "archetype"
  | "colors"
  | "tribe"
  | "franchise"
  | "world"
  | "tempo"
  | "complexity"
  | "popularity";

export interface FitReason {
  kind: FitReasonKind;
  text: string;
  points: number;
}

export interface ScoredCommander {
  commander: CommanderSummary;
  score: number;
  /** Strongest positive reasons, best first. */
  reasons: FitReason[];
}
