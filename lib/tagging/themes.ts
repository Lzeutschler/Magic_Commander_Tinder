export interface ThemeDefinition {
  id: string;
  label: string;
  blurb: string;
  patterns: RegExp[];
}

/**
 * Strategy themes detected from a commander's rules text. Patterns run against
 * lower-cased oracle text with reminder text removed.
 */
export const THEMES: ThemeDefinition[] = [
  {
    id: "tokens",
    label: "Tokens",
    blurb: "Go wide with armies of tokens",
    patterns: [/\bcreates?\b[^.]*\btokens?\b/, /\bpopulate\b/],
  },
  {
    id: "counters",
    label: "+1/+1 Counters",
    blurb: "Grow your creatures with counters",
    patterns: [/\+1\/\+1 counters?/, /\bproliferate\b/],
  },
  {
    id: "graveyard",
    label: "Graveyard",
    blurb: "Use your graveyard as a second hand",
    patterns: [/\bgraveyards?\b/],
  },
  {
    id: "spellslinger",
    label: "Spellslinger",
    blurb: "Chain instants and sorceries",
    patterns: [/\binstant (or|and) sorcery\b/, /\bnoncreature spells?\b/, /\bcopy (target|that) (instant|sorcery|spell)/],
  },
  {
    id: "artifacts",
    label: "Artifacts",
    blurb: "Build an artifact engine",
    patterns: [/\bartifacts?\b/],
  },
  {
    id: "enchantments",
    label: "Enchantments",
    blurb: "Enchantress value and auras",
    patterns: [/\benchantments?\b/, /\bauras?\b/],
  },
  {
    id: "lifegain",
    label: "Lifegain",
    blurb: "Gain life and turn it into power",
    patterns: [/\bwhenever you gain life\b/, /\byou gain \w+ life\b/, /\blife total\b/],
  },
  {
    id: "sacrifice",
    label: "Sacrifice",
    blurb: "Aristocrats: sacrifice for value",
    patterns: [/\bsacrifices? (a|another)\b/, /\bwhenever (a|another) (nontoken )?creature (you control )?dies\b/],
  },
  {
    id: "voltron",
    label: "Voltron",
    blurb: "Suit up one big threat",
    patterns: [/\bequip(ment|ped)?\b/, /\benchanted\b/, /\bdouble strike\b/],
  },
  {
    id: "landfall",
    label: "Lands",
    blurb: "Landfall and extra land drops",
    patterns: [/\blandfall\b/, /\bland enters\b/, /\badditional land\b/, /\blands? (you control|from your graveyard)\b/],
  },
  {
    id: "blink",
    label: "Blink",
    blurb: "Flicker creatures for repeated ETBs",
    patterns: [/\bexile\b[^.]*\breturn (it|that card|them|those cards) to the battlefield\b/, /\benters or leaves\b/],
  },
  {
    id: "mill",
    label: "Mill",
    blurb: "Empty libraries",
    patterns: [/\bmills?\b/],
  },
  {
    id: "combat",
    label: "Combat",
    blurb: "Attack, attack, attack",
    patterns: [/\bwhenever [^.]* attacks\b/, /\bcombat damage to a player\b/, /\badditional combat\b/],
  },
  {
    id: "draw",
    label: "Card Draw",
    blurb: "Draw lots of cards",
    patterns: [/\bwhenever you draw\b/, /\bdraws? (two|three|four|x) cards\b/],
  },
  {
    id: "politics",
    label: "Group Hug & Politics",
    blurb: "Make deals and share resources",
    patterns: [/\beach player (draws|may)\b/, /\btarget opponent (draws|gains|creates)\b/, /\bthe monarch\b/, /\bvote\b/, /\bgoad\b/],
  },
  {
    id: "control",
    label: "Control & Stax",
    blurb: "Lock the table down",
    patterns: [/\bcounter target\b/, /\bcan't (cast|attack|untap)\b/, /\bdon't untap\b/, /\bcost \{\d\} more\b/],
  },
  {
    id: "treasure",
    label: "Treasure",
    blurb: "Make treasure and ramp hard",
    patterns: [/\btreasures?\b/],
  },
  {
    id: "chaos",
    label: "Chaos",
    blurb: "Dice, coins and randomness",
    patterns: [/\broll (a|\w+) d\d+/, /\bflip a coin\b/, /\bat random\b/],
  },
  {
    id: "superfriends",
    label: "Superfriends",
    blurb: "Planeswalkers galore",
    patterns: [/\bplaneswalkers?\b/],
  },
  {
    id: "vehicles",
    label: "Vehicles",
    blurb: "Crew up and ride",
    patterns: [/\bvehicles?\b/, /\bcrew(s|ed)?\b/],
  },
  {
    id: "discard",
    label: "Discard & Wheels",
    blurb: "Discard, madness and wheels",
    patterns: [/\bdiscards?\b/],
  },
  {
    id: "flyers",
    label: "Flyers",
    blurb: "Rule the skies",
    patterns: [/\bcreatures? (you control )?with flying\b/],
  },
];

export function stripReminderText(text: string): string {
  return text.replace(/\([^)]*\)/g, "");
}

export function detectThemes(oracleText: string): string[] {
  const text = stripReminderText(oracleText).toLowerCase();
  return THEMES.filter((theme) => theme.patterns.some((re) => re.test(text))).map((t) => t.id);
}
