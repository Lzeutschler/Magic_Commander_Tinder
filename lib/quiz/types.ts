import type { Color, CommanderSummary } from "@/lib/cards/types";
import type { ArchetypeId } from "@/lib/tagging/archetypes";

import type { FranchiseId } from "./franchises";

export type Track = "beginner" | "advanced";
export type Tempo = "fast" | "midrange" | "slow" | "reactive";
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
  /** Picking it clears the other answers, e.g. "No preference". */
  exclusive?: boolean;
  effect: AnswerEffect;
}

export interface Question {
  id: string;
  title: string;
  subtitle: string;
  /** Maximum number of answers; 1 means single choice that advances on click. */
  max: number;
  /** Multi-choice questions may be skipped with no answer. */
  optional?: boolean;
  options: AnswerOption[];
  /** A second, smaller single-choice row on the same screen. */
  followUp?: Omit<Question, "followUp">;
}

/** Picked option ids per question id. */
export type Answers = Record<string, string[]>;

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
