import type { ArchetypeId } from "@/lib/tagging/archetypes";

export type Color = "W" | "U" | "B" | "R" | "G";

/** Functional roles a card can fill in a deck, derived from Scryfall Tagger oracle tags. */
export type Role =
  | "ramp"
  | "draw"
  | "removal"
  | "boardwipe"
  | "counterspell"
  | "tutor"
  | "protection"
  | "recursion"
  | "wincon"
  | "mld"
  | "extraturn";

export interface CardImage {
  /** Path fragment shared by every size and face, e.g. "8/e/8ee443cc-e17a-…". */
  key: string;
  version: string;
  doubleFaced: boolean;
}

export interface Card {
  id: string;
  oracleId: string;
  name: string;
  manaCost: string;
  cmc: number;
  typeLine: string;
  oracleText: string;
  colorIdentity: Color[];
  producedMana: string[];
  image: CardImage | null;
  edhrecRank: number | null;
  gameChanger: boolean;
  roles: Role[];
  priceUsd: number | null;
}

export interface TokenCard {
  id: string;
  name: string;
  typeLine: string;
  oracleText: string;
  colors: Color[];
  power: string | null;
  toughness: string | null;
  image: CardImage | null;
}

export type PartnerKind =
  | "partner"
  | "partner-with"
  | "friends-forever"
  | "background"
  | "doctors-companion";

export interface CommanderSummary {
  id: string;
  name: string;
  /** EDHREC page slug, e.g. "atraxa-praetors-voice". */
  slug: string;
  /** Scryfall set code of the printing Scryfall shows for this card, e.g. "ltr". */
  set: string;
  manaCost: string;
  cmc: number;
  typeLine: string;
  oracleText: string;
  colorIdentity: Color[];
  image: CardImage | null;
  edhrecRank: number | null;
  priceUsd: number | null;
  gameChanger: boolean;
  themes: string[];
  /** Creature types the commander cares about in its rules text (typal synergy). */
  tribes: string[];
  /** The commander's own creature types. */
  creatureTypes: string[];
  partner: PartnerKind | null;
  /** Total EDHREC decks, known for the most popular commanders of each color identity. */
  edhrecDecks: number | null;
  /** EDHREC decks per archetype, for commanders among a theme's top commanders. */
  edhrecThemes: Partial<Record<ArchetypeId, number>>;
  /** How strongly the commander plays each archetype, 0..1 (see lib/tagging/archetypes.ts). */
  archetypes: Partial<Record<ArchetypeId, number>>;
}
