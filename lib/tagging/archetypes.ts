import { stripReminderText } from "./themes";

export const ARCHETYPE_IDS = [
  "tokens",
  "aristocrats",
  "voltron",
  "spellslinger",
  "reanimator",
  "lands",
  "counters",
  "blink",
  "control",
  "stax",
  "grouphug",
  "goad",
  "typal",
  "artifacts",
  "enchantress",
  "lifegain",
  "combo",
  "ramp",
  "stompy",
  "mill",
  "wheels",
  "superfriends",
  "chaos",
  "theft",
  "aggro",
  "burn",
  "treasure",
  "vehicles",
] as const;

export type ArchetypeId = (typeof ARCHETYPE_IDS)[number];

export interface ArchetypeDefinition {
  id: ArchetypeId;
  label: string;
  /** Scryfall Tagger oracle tags on the commander itself. */
  tags: string[];
  /** Tag prefixes, e.g. "reanimate-" matches "reanimate-creature". */
  tagPrefixes?: string[];
  /** EDHREC theme pages (json.edhrec.com/pages/tags/{slug}.json) whose top commanders play this archetype. */
  edhrec: string[];
  /** Fallback patterns for lower-cased rules text without reminder text. */
  patterns: RegExp[];
}

export const ARCHETYPES: ArchetypeDefinition[] = [
  {
    id: "tokens",
    label: "Tokens",
    tags: ["repeatable-creature-tokens", "synergy-token", "synergy-token-creature", "token-doubler", "token-increaser", "tokenfall"],
    edhrec: ["tokens", "go-wide", "populate"],
    patterns: [/\bcreates? [^.]*creature tokens?\b/, /\bpopulate\b/, /\btokens? you control\b/],
  },
  {
    id: "aristocrats",
    label: "Aristocrats",
    tags: [
      "sacrifice-outlet-creature",
      "repeatable-sacrifice-outlet",
      "free-sacrifice-outlet",
      "sacrifice-outlet-universal",
      "sacrifice-outlet-token",
      "death-trigger",
      "your-sacrifice-matters",
      "blood-artist-ability",
      "opponent-sacrifice-matters",
    ],
    edhrec: ["aristocrats", "sacrifice"],
    patterns: [/\bsacrifice (a|another) creature\b/, /\bwhenever (a|another) (nontoken )?creature (you control )?dies\b/],
  },
  {
    id: "voltron",
    label: "Voltron",
    tags: ["synergy-equipment", "synergy-aura", "quick-equip", "cost-reducer-equip-ability", "quick-enchant", "synergy-equipment-legendary"],
    tagPrefixes: ["tutor-artifact-equipment"],
    edhrec: ["voltron", "equipment", "auras"],
    patterns: [/\bequipped\b/, /\benchanted creature\b/, /\bequipment\b/, /\bauras? you control\b/],
  },
  {
    id: "spellslinger",
    label: "Spellslinger",
    tags: [
      "synergy-instant",
      "synergy-sorcery",
      "copy-instant",
      "copy-sorcery",
      "copy-spell",
      "cost-reducer-instant-sorcery",
      "prowess-like",
      "second-spell-matters",
    ],
    edhrec: ["spellslinger", "spell-copy", "cantrips"],
    patterns: [/\binstant (or|and) sorcery\b/, /\bnoncreature spells?\b/, /\bcopy (target|that) (instant|sorcery|spell)/],
  },
  {
    id: "reanimator",
    label: "Graveyard",
    tags: [
      "mill-self",
      "cards-in-graveyard-matter",
      "castable-from-graveyard",
      "gives-castable-from-graveyard",
      "activate-from-graveyard",
      "card-types-in-graveyard-matter",
      "synergy-graveyard-cast",
      "leaves-graveyard-trigger",
      "mass-reanimation",
      "reanimate-creature",
      "reanimate-cast",
      "reanimate-self",
      "reanimate-from-any",
      "reanimate-permanent",
      "reanimate-nonland",
      "regrowth-creature",
    ],
    tagPrefixes: ["graveyard-fuel"],
    edhrec: ["reanimator", "graveyard", "self-mill", "dredge"],
    patterns: [/\bfrom your graveyard\b/, /\breturn [^.]*from [^.]*graveyard to the battlefield\b/, /\bcards? in your graveyard\b/],
  },
  {
    id: "lands",
    label: "Lands",
    tags: [
      "landfall",
      "landfall-other",
      "land-count-matters",
      "play-additional-land",
      "extra-land",
      "sneak-land",
      "reanimate-land",
      "lands-in-graveyard-matter",
      "synergy-land-graveyard",
      "animate-land",
      "sacrifice-outlet-land",
      "multi-land-ramp",
      "lands-matter",
    ],
    tagPrefixes: ["tutor-land-to-battlefield"],
    edhrec: ["landfall", "lands-matter"],
    patterns: [/\blandfall\b/, /\badditional lands?\b/, /\bwhenever a land (you control )?enters\b/, /\blands? from your graveyard\b/],
  },
  {
    id: "counters",
    label: "+1/+1 Counters",
    tags: [
      "gives-pp-counters",
      "gives-pp-counters-to-all",
      "pp-counters-matter",
      "counters-matter",
      "counter-doubler",
      "counter-increaser",
      "repeatable-proliferate",
      "synergy-proliferate",
      "move-counters",
      "share-counters",
    ],
    edhrec: ["plus-1-plus-1-counters", "counters-matter", "proliferate"],
    patterns: [/\+1\/\+1 counters? on (each|another|target)\b/, /\bproliferate\b/, /\bwith (a|one or more) \+1\/\+1 counters?\b/],
  },
  {
    id: "blink",
    label: "Blink & ETB",
    tags: ["flicker-creature", "flicker-slow", "flicker-permanent", "flicker-nonland", "trigger-doubler"],
    edhrec: ["blink", "etb"],
    patterns: [/\bexile\b[^.]*\breturn (it|that card|them|those cards) to the battlefield\b/, /\benters or leaves\b/],
  },
  {
    id: "control",
    label: "Control",
    tags: ["counterspell-reusable", "counterspell-ability", "counterspell-automatic", "synergy-counterspell", "tapper-creature", "hate-instant", "hate-sorcery"],
    edhrec: ["control", "counterspells", "tempo"],
    patterns: [/\bcounter target\b/, /\btap target\b/],
  },
  {
    id: "stax",
    label: "Stax",
    tags: [
      "hatebear",
      "hatebird",
      "doesn-t-untap",
      "tax-attack",
      "exile-with-tax",
      "mass-land-denial",
      "lockdown-land",
      "freeze-nonland",
      "hate-activation",
      "hate-flash",
      "hate-off-turn-cast",
      "hate-free-spell",
      "hate-tutor",
      "hate-ramp",
      "hate-nonbasic-land",
      "hate-noncreature",
      "hate-full-hand",
      "hate-attacker",
    ],
    edhrec: ["stax", "hatebears", "pillow-fort", "prison"],
    patterns: [/\bcan't (cast|attack|untap|search)\b/, /\bdon't untap\b/, /\bcosts? \{\d\} more\b/],
  },
  {
    id: "grouphug",
    label: "Group Hug & Politics",
    tags: ["group-hug", "selective-group-hug", "monarch-matters", "synergy-vote", "donate", "donate-token", "donate-mana"],
    edhrec: ["group-hug", "politics", "monarch"],
    patterns: [/\beach player (draws|may)\b/, /\bthe monarch\b/, /\bvote\b/, /\btarget opponent (draws|creates|gains)\b/],
  },
  {
    id: "goad",
    label: "Goad",
    tags: ["force-attacker", "forced-attacker", "synergy-goad"],
    edhrec: ["forced-combat"],
    patterns: [/\bgoad\b/, /\battacks each combat if able\b/],
  },
  {
    id: "typal",
    label: "Typal",
    tags: ["typal-choose"],
    edhrec: [],
    patterns: [],
  },
  {
    id: "artifacts",
    label: "Artifacts",
    tags: [
      "synergy-artifact",
      "synergy-artifact-creature",
      "repeatable-artifact-tokens",
      "sacrifice-outlet-artifact",
      "artifact-count-matters",
      "reanimate-artifact",
      "copy-artifact",
      "animate-artifact",
      "affinity-for-artifacts",
      "cost-reducer-artifact",
      "artifactify",
    ],
    edhrec: ["artifacts", "affinity"],
    patterns: [/\bartifacts? you control\b/, /\bartifact spells?\b/, /\bwhenever an artifact\b/],
  },
  {
    id: "enchantress",
    label: "Enchantress",
    tags: ["synergy-enchantment", "synergy-aura", "enchantment-engine", "repeatable-enchantment-tokens", "cost-reducer-enchantment", "enchantmentize", "synergy-enchantment-creature"],
    edhrec: ["enchantress", "auras"],
    patterns: [/\benchantment spells?\b/, /\benchantments? you control\b/, /\bconstellation\b/],
  },
  {
    id: "lifegain",
    label: "Lifegain",
    tags: ["lifegain-matters", "pridemate", "lifegain-to-damage", "lifegain-increaser", "lifelink-counter"],
    edhrec: ["lifegain", "lifedrain"],
    patterns: [/\bwhenever you gain life\b/, /\bif you would gain life\b/],
  },
  {
    id: "combo",
    label: "Combo & Storm",
    tags: ["storm-count-matters", "gives-storm", "extra-untap", "untapper-creature", "untapper-permanent"],
    edhrec: ["combo", "storm"],
    patterns: [/\bstorm\b/, /\buntap (it|target|another|all)\b/],
  },
  {
    id: "ramp",
    label: "Ramp & Big Mana",
    tags: ["ramp", "land-ramp", "adds-multiple-mana", "high-mana-value-matters", "x-cost-matters", "cost-reducer", "mana-producer"],
    edhrec: ["ramp", "big-mana", "x-spells"],
    patterns: [/\badd (\{\w\}){2,}/, /\bmana value \d or greater\b/, /\bsearch your library for [^.]*lands?\b/],
  },
  {
    id: "stompy",
    label: "Stompy",
    tags: ["power-matters", "power-doubler", "power-matters-total", "greatest-power-matters", "hate-low-power", "scales-with-power"],
    edhrec: ["stompy", "power-matters"],
    patterns: [/\bpower \d or greater\b/, /\bgreatest power\b/, /\bdouble the power\b/],
  },
  {
    id: "mill",
    label: "Mill",
    tags: ["mill-opponent", "mill-any", "mill-each", "synergy-mill"],
    edhrec: ["mill"],
    patterns: [/\b(target|each) (player|opponent) mills\b/, /\bopponents? mills?\b/],
  },
  {
    id: "wheels",
    label: "Wheels & Discard",
    tags: ["wheel-one-sided", "wheel-symmetrical", "miniwheel", "draw-to-seven", "discard", "second-draw-matters", "third-draw-matters", "draw-hate"],
    edhrec: ["wheels", "discard"],
    patterns: [/\beach player discards\b/, /\bdiscards? (their|his or her) hand\b/, /\bwhenever an opponent draws\b/, /\btarget opponent discards\b/],
  },
  {
    id: "superfriends",
    label: "Superfriends",
    tags: ["synergy-planeswalker", "protects-planeswalker", "cost-reducer-planeswalker"],
    edhrec: ["planeswalkers"],
    patterns: [/\bplaneswalkers? you control\b/, /\bloyalty abilit(y|ies)\b/],
  },
  {
    id: "chaos",
    label: "Chaos",
    tags: ["coin-flip", "coin-flips-matter", "synergy-dice", "random-discard", "discard-outlet-random"],
    edhrec: ["chaos", "coin-flip", "die-roll"],
    patterns: [/\broll (a|\w+) d\d+/, /\bflip a coin\b/, /\bat random\b/],
  },
  {
    id: "theft",
    label: "Theft",
    tags: ["nightveil-theft", "synergy-theft", "reanimate-from-opponent", "gives-castable-from-exile"],
    tagPrefixes: ["theft-"],
    edhrec: ["theft"],
    patterns: [/\bgain control of\b/, /\byou don't own\b/, /\bcards? (an opponent owns|your opponents own)\b/],
  },
  {
    id: "aggro",
    label: "Aggro & Extra Combat",
    tags: ["attacking-matters", "extra-combat-phase", "power-boost-to-all", "overrun", "synergy-solo-attack"],
    edhrec: ["aggro", "extra-combats", "attack-triggers"],
    patterns: [/\badditional combat\b/, /\bwhenever (one or more )?creatures you control attack\b/],
  },
  {
    id: "burn",
    label: "Burn & Drain",
    tags: ["burn-player", "burn-player-each", "pinger", "drain-life", "synergy-burn", "group-slug", "punisher", "opponent-loses-life", "life-loss-matters"],
    edhrec: ["burn", "pingers", "group-slug", "lifedrain"],
    patterns: [/\bdeals? \d+ damage to each opponent\b/, /\beach opponent loses \d+ life\b/],
  },
  {
    id: "treasure",
    label: "Treasure",
    tags: ["repeatable-treasures", "synergy-treasure"],
    edhrec: ["treasure"],
    patterns: [/\btreasures?\b/],
  },
  {
    id: "vehicles",
    label: "Vehicles",
    tags: ["synergy-vehicle", "crewless-vehicle", "cost-reducer-vehicle", "animate-vehicle", "tutor-artifact-vehicle"],
    edhrec: ["vehicles"],
    patterns: [/\bvehicles?\b/, /\bcrew(s|ed)?\b/],
  },
];

export const ARCHETYPE_LABELS = Object.fromEntries(ARCHETYPES.map((a) => [a.id, a.label])) as Record<ArchetypeId, string>;

/** Affinity an archetype gets from each source, 0..1. EDHREC deck shares can raise it further. */
export const TAGGER_AFFINITY = 0.6;
export const PATTERN_AFFINITY = 0.4;

/** Maps a commander's Tagger tags to the archetypes they signal. */
export function archetypesFromTags(slugs: Iterable<string>): Set<ArchetypeId> {
  // Typal tags are matched per creature type through confirmedTribes(); typal-choose is generic.
  const found = new Set<ArchetypeId>();
  for (const slug of slugs) {
    for (const archetype of ARCHETYPES) {
      if (archetype.tags.includes(slug) || archetype.tagPrefixes?.some((p) => slug.startsWith(p))) found.add(archetype.id);
    }
  }
  return found;
}

/**
 * Creature types a commander really builds around. Rules text alone over-reports ("non-Human",
 * "create a 1/1 Elf Warrior token"), so when Tagger reviewed the card it must confirm the type.
 */
export function confirmedTribes(detected: string[], tagSlugs: Set<string> | null): string[] {
  if (!tagSlugs) return detected;
  return detected.filter((type) => tagSlugs.has(`typal-${type.toLowerCase()}`));
}

export function archetypesFromText(oracleText: string): Set<ArchetypeId> {
  const text = stripReminderText(oracleText).toLowerCase();
  return new Set(ARCHETYPES.filter((a) => a.patterns.some((re) => re.test(text))).map((a) => a.id));
}

/**
 * Turns a commander's EDHREC theme counts into affinities. Only some decks carry a theme tag on EDHREC,
 * so counts are compared with the commander's own strongest theme: that one scores 1, a theme half as
 * common 0.65, and stray themes of very popular commanders fall below the Tagger signal.
 */
export function edhrecAffinity(themeDecks: number, strongestThemeDecks: number): number {
  if (strongestThemeDecks <= 0) return 0;
  return 0.3 + 0.7 * Math.min(1, themeDecks / strongestThemeDecks);
}

/** Merges every source into one affinity per archetype; the strongest signal wins. */
export function combineArchetypes(input: {
  tagger: Set<ArchetypeId> | null;
  text: Set<ArchetypeId>;
  typal: boolean;
  edhrecThemes: Partial<Record<ArchetypeId, number>>;
}): Partial<Record<ArchetypeId, number>> {
  const affinity: Partial<Record<ArchetypeId, number>> = {};
  const raise = (id: ArchetypeId, value: number) => {
    affinity[id] = Math.max(affinity[id] ?? 0, value);
  };
  // Text patterns are noisy, so only use them for commanders Tagger has not reviewed.
  if (input.tagger === null) for (const id of input.text) raise(id, PATTERN_AFFINITY);
  for (const id of input.tagger ?? []) raise(id, TAGGER_AFFINITY);
  if (input.typal) raise("typal", 0.9);
  const strongest = Math.max(0, ...Object.values(input.edhrecThemes));
  for (const [id, decks] of Object.entries(input.edhrecThemes) as [ArchetypeId, number][]) {
    raise(id, edhrecAffinity(decks, strongest));
  }
  for (const id of Object.keys(affinity) as ArchetypeId[]) affinity[id] = Math.round(affinity[id]! * 100) / 100;
  return affinity;
}
