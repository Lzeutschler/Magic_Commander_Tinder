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
  "wincon",
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
  wincon: "Finisher",
  mld: "Mass Land Denial",
  extraturn: "Extra Turn",
};

/**
 * Scryfall Tagger oracle tags that grant each role. A tag also covers all of its descendant tags;
 * `exclude` subtracts descendants, and a card carrying any `veto` tag (or its descendants) never
 * gets the role.
 *
 * - draw counts card advantage, not card selection: cantrips, loots, rummages and eggs only replace
 *   themselves, while Fact or Fiction-style effects sit under `card-advantage`, not `draw`.
 * - tutor skips land tutors (Cultivate) and the destination tags (`tutor-to-hand`) that land tutors share.
 * - ramp skips one-shot rituals and Path to Exile-style removal that ramps the opponent.
 */
export const ROLE_TAGS: Record<Role, { include: string[]; exclude?: string[]; veto?: string[] }> = {
  ramp: { include: ["ramp", "mana-rock", "mana-dork"], exclude: ["ritual"], veto: ["donate-rampant-growth"] },
  draw: {
    include: ["card-advantage"],
    exclude: ["cantrip", "delayed-cantrip", "loot", "rummage", "brainstorm", "regrowth", "land-or-hand"],
    veto: ["egg"],
  },
  removal: { include: ["removal"], exclude: ["sweeper"] },
  boardwipe: { include: ["sweeper"] },
  counterspell: { include: ["counterspell"] },
  tutor: { include: ["tutor"], exclude: ["tutor-land", "tutor-to"] },
  protection: { include: ["protection"] },
  recursion: { include: ["recursion"] },
  wincon: { include: ["alternate-win-condition", "overrun", "extra-combat-phase"] },
  mld: { include: ["mass-land-denial"] },
  extraturn: { include: ["extra-turn"] },
};

/** Fallback for cards Tagger has not tagged yet (usually brand-new sets). */
const ROLE_PATTERNS: Record<Role, RegExp[]> = {
  ramp: [/\badd \{[wubrgc]\}/, /\badd (one|two|three) mana\b/, /search your library for (a|up to \w+) basic land/],
  draw: [/\bdraws? (two|three|four|five|x|that many) cards\b/, /\bwhenever [^.]*, (you may )?draw a card\b/],
  removal: [/\b(destroy|exile) target (creature|artifact|enchantment|planeswalker|permanent|nonland)/],
  boardwipe: [/\b(destroy|exile) all (creatures|nonland permanents|artifacts|enchantments)/, /\ball creatures get -\d/],
  counterspell: [/\bcounter target (spell|creature spell|noncreature spell)/],
  tutor: [/search your library for an? (card|creature|instant|sorcery|artifact|enchantment)\b/],
  protection: [/\b(hexproof|indestructible) until end of turn\b/],
  recursion: [/\breturn target [^.]*card from your graveyard\b/],
  wincon: [/\byou win the game\b/, /\bcreatures you control get \+\w+\/\+\w+ and gain trample\b/, /\badditional combat phase\b/],
  mld: [/\bdestroy all lands\b/],
  extraturn: [/\btake an extra turn\b/],
};

export function rolesFromText(oracleText: string, isLand: boolean): Role[] {
  const text = oracleText.toLowerCase();
  return ROLES.filter(
    (role) => !(role === "ramp" && isLand) && ROLE_PATTERNS[role].some((re) => re.test(text)),
  );
}
