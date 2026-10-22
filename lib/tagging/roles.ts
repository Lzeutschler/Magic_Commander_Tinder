import type { Role } from "@/lib/cards/types";

export const ROLES: Role[] = [
  "ramp",
  "draw",
  "removal",
  "boardwipe",
  "counterspell",
  "tutor",
  "protection",
  "recursion",
  "mld",
  "extraturn",
];

export const ROLE_LABELS: Record<Role, string> = {
  ramp: "Ramp",
  draw: "Card Draw",
  removal: "Removal",
  boardwipe: "Board Wipe",
  counterspell: "Counterspell",
  tutor: "Tutor",
  protection: "Protection",
  recursion: "Recursion",
  mld: "Mass Land Denial",
  extraturn: "Extra Turn",
};

/**
 * Scryfall Tagger oracle tags that grant each role. A tag also covers all of its
 * descendant tags; `exclude` subtracts descendants (e.g. sweepers are not spot removal).
 */
export const ROLE_TAGS: Record<Role, { include: string[]; exclude?: string[] }> = {
  ramp: { include: ["ramp", "mana-rock", "mana-dork"] },
  draw: { include: ["draw", "impulsive-draw", "repeatable-card-advantage"] },
  removal: { include: ["removal"], exclude: ["sweeper"] },
  boardwipe: { include: ["sweeper"] },
  counterspell: { include: ["counterspell"] },
  tutor: { include: ["tutor"], exclude: ["tutor-land"] },
  protection: { include: ["protection"] },
  recursion: { include: ["recursion"] },
  mld: { include: ["mass-land-denial"] },
  extraturn: { include: ["extra-turn"] },
};

/** Fallback for cards Tagger has not tagged yet (usually brand-new sets). */
const ROLE_PATTERNS: Record<Role, RegExp[]> = {
  ramp: [/\badd \{[wubrgc]\}/, /\badd (one|two|three) mana\b/, /search your library for (a|up to \w+) basic land/],
  draw: [/\bdraws? (a|two|three|four|\w+) cards?\b/],
  removal: [/\b(destroy|exile) target (creature|artifact|enchantment|planeswalker|permanent|nonland)/],
  boardwipe: [/\b(destroy|exile) all (creatures|nonland permanents|artifacts|enchantments)/, /\ball creatures get -\d/],
  counterspell: [/\bcounter target (spell|creature spell|noncreature spell)/],
  tutor: [/search your library for an? (card|creature|instant|sorcery|artifact|enchantment)\b/],
  protection: [/\b(hexproof|indestructible) until end of turn\b/],
  recursion: [/\breturn target [^.]*card from your graveyard\b/],
  mld: [/\bdestroy all lands\b/],
  extraturn: [/\btake an extra turn\b/],
};

export function rolesFromText(oracleText: string, isLand: boolean): Role[] {
  const text = oracleText.toLowerCase();
  return ROLES.filter(
    (role) => !(role === "ramp" && isLand) && ROLE_PATTERNS[role].some((re) => re.test(text)),
  );
}
