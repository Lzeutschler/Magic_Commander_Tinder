import { stripReminderText } from "./themes";

export interface TribeDefinition {
  /** Creature type as printed on cards. */
  type: string;
  plural: string;
}

const tribe = (type: string, plural = `${type}s`): TribeDefinition => ({ type, plural });

/** Popular creature types for typal decks and the quiz. */
export const TRIBES: TribeDefinition[] = [
  tribe("Angel"),
  tribe("Vampire"),
  tribe("Dragon"),
  tribe("Elf", "Elves"),
  tribe("Zombie"),
  tribe("Goblin"),
  tribe("Dinosaur"),
  tribe("Cat"),
  tribe("Wizard"),
  tribe("Merfolk", "Merfolk"),
  tribe("Sliver"),
  tribe("Human"),
  tribe("Knight"),
  tribe("Soldier"),
  tribe("Warrior"),
  tribe("Pirate"),
  tribe("Spirit"),
  tribe("Demon"),
  tribe("Beast"),
  tribe("Elemental"),
  tribe("Faerie"),
  tribe("Rat"),
  tribe("Squirrel"),
  tribe("Dog"),
  tribe("Bird"),
  tribe("Snake"),
  tribe("Hydra"),
  tribe("Insect"),
  tribe("Spider"),
  tribe("Horror"),
  tribe("Eldrazi", "Eldrazi"),
  tribe("Dwarf", "Dwarves"),
  tribe("Giant"),
  tribe("Ninja"),
  tribe("Rogue"),
  tribe("Cleric"),
  tribe("Shaman"),
  tribe("Druid"),
  tribe("Treefolk", "Treefolk"),
  tribe("Fungus", "Fungi"),
  tribe("Saproling"),
  tribe("Werewolf", "Werewolves"),
  tribe("Wolf", "Wolves"),
  tribe("Sphinx", "Sphinxes"),
  tribe("God"),
  tribe("Golem"),
  tribe("Myr", "Myr"),
  tribe("Ally", "Allies"),
  tribe("Assassin"),
  tribe("Samurai", "Samurai"),
  tribe("Frog"),
  tribe("Rabbit"),
  tribe("Otter"),
  tribe("Mouse", "Mice"),
  tribe("Bat"),
  tribe("Lizard"),
  tribe("Turtle"),
  tribe("Kraken"),
  tribe("Octopus", "Octopi"),
  tribe("Serpent"),
  tribe("Phyrexian", "Phyrexians"),
  tribe("Construct"),
  tribe("Artificer"),
  tribe("Monk"),
  tribe("Berserker"),
  tribe("Minotaur"),
  tribe("Ooze"),
];

const TRIBE_PATTERNS = TRIBES.map((t) => ({
  type: t.type,
  re: new RegExp(`\\b(${t.type}|${t.plural})\\b`),
}));

/** Creature types from the front face of a type line ("Legendary Creature — Elf Druid" → ["Elf", "Druid"]). */
export function creatureTypes(typeLine: string): string[] {
  const front = typeLine.split(" // ")[0];
  if (!front.includes("Creature")) return [];
  const [, subtypes = ""] = front.split(" — ");
  return subtypes.split(" ").filter(Boolean);
}

/** Tribes the rules text mentions, e.g. "Other Elves you control get +1/+1" → ["Elf"]. */
export function detectTribes(oracleText: string, cardName: string): string[] {
  // Remove the card's own name so "Krenko" style names never count as a tribe mention.
  const text = stripReminderText(oracleText).split(cardName).join("");
  return TRIBE_PATTERNS.filter(({ re }) => re.test(text)).map(({ type }) => type);
}
