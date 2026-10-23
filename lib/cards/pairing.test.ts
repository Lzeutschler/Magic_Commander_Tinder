import { describe, expect, it } from "vitest";

import { asPairable, canPair, commandZoneName, isBackground, pairingLabel, pairingsOf, secondCommanderLabel } from "./pairing";

const card = (name: string, typeLine: string, oracleText: string) => asPairable({ name, typeLine, oracleText });

const tymna = card("Tymna the Weaver", "Legendary Creature — Human Cleric", "Lifelink\nPartner (You can have two commanders if both have partner.)");
const kraum = card("Kraum, Ludevic's Opus", "Legendary Creature — Zombie Horror", "Flying, haste\nPartner (You can have two commanders if both have partner.)");
const sophina = card(
  "Sophina, Spearsage Deserter",
  "Legendary Creature — Human Soldier",
  "Menace\nPartner—Friends forever (You can have two commanders if both have this ability.)",
);
const cecily = card("Cecily, Haunted Mage", "Legendary Creature — Human Wizard", "Partner—Friends forever (You can have two commanders if both have this ability.)");
const pir = card("Pir, Imaginative Rascal", "Legendary Creature — Human", "Partner with Toothy, Imaginary Friend (When this creature enters, …)");
const toothy = card("Toothy, Imaginary Friend", "Legendary Creature — Illusion", "Partner with Pir, Imaginative Rascal (When this creature enters, …)");
const wilson = card("Wilson, Refined Grizzly", "Legendary Creature — Bear Warrior", "Choose a Background (You can have a Background as a second commander.)\nReach, trample");
const giants = card("Raised by Giants", "Legendary Enchantment — Background", "Commander creatures you own have base power and toughness 10/10.");
const doctor = card("The Tenth Doctor", "Legendary Creature — Time Lord Doctor", "Allons-y! — Whenever you cast a spell, …");
const rose = card("Rose Tyler", "Legendary Creature — Human", "Doctor's companion (You can have two commanders if the other is the Doctor.)");
const amy = card(
  "Amy Pond",
  "Legendary Creature — Human",
  "Partner with Rory Williams (When this creature enters, …)\nDoctor's companion (You can have two commanders if the other is the Doctor.)",
);
const krenko = card("Krenko, Mob Boss", "Legendary Creature — Goblin Warrior", "{T}: Create X 1/1 red Goblin creature tokens.");

describe("pairing", () => {
  it("reads pairing abilities from the rules text", () => {
    expect(tymna.pairings).toEqual([{ kind: "partner", group: null }]);
    expect(sophina.pairings).toEqual([{ kind: "partner", group: "Friends forever" }]);
    expect(pir.pairings).toEqual([{ kind: "partner-with", name: "Toothy, Imaginary Friend" }]);
    expect(amy.pairings).toEqual([{ kind: "partner-with", name: "Rory Williams" }, { kind: "doctors-companion" }]);
    expect(giants.pairings).toEqual([{ kind: "background" }]);
    expect(doctor.pairings).toEqual([{ kind: "doctor" }]);
    expect(krenko.pairings).toEqual([]);
    // Mentioning partner in other rules text is not the ability.
    expect(pairingsOf({ typeLine: "Legendary Creature — Human", oracleText: "Whenever you cast a creature spell with doctor's companion, draw a card." })).toEqual([]);
  });

  it("pairs only commanders whose abilities match", () => {
    expect(canPair(tymna, kraum)).toBe(true);
    expect(canPair(sophina, cecily)).toBe(true);
    expect(canPair(tymna, sophina)).toBe(false);
    expect(canPair(pir, toothy)).toBe(true);
    expect(canPair(pir, tymna)).toBe(false);
    expect(canPair(wilson, giants)).toBe(true);
    expect(canPair(giants, wilson)).toBe(true);
    expect(canPair(tymna, giants)).toBe(false);
    expect(canPair(doctor, rose)).toBe(true);
    expect(canPair(amy, doctor)).toBe(true);
    expect(canPair(doctor, doctor)).toBe(false);
    expect(canPair(tymna, tymna)).toBe(false);
    expect(canPair(krenko, kraum)).toBe(false);
  });

  it("names the second commander slot and the pair", () => {
    expect(isBackground(giants)).toBe(true);
    expect(pairingLabel(sophina)).toBe("Partner—Friends forever");
    expect(pairingLabel(pir)).toBe("Partner with Toothy");
    expect(pairingLabel(doctor)).toBeNull();
    expect(secondCommanderLabel(wilson)).toBe("Background");
    expect(secondCommanderLabel(rose)).toBe("Doctor");
    expect(secondCommanderLabel(doctor)).toBe("Companion");
    expect(commandZoneName([wilson, giants])).toBe("Wilson & Raised by Giants");
  });
});
