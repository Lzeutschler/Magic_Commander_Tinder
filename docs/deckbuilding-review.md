# Deck Matchmaker: Review aus Spielersicht

Stand: Oktober 2026. Geprüft wurde der Code auf `main` (Stand Commit `3921873`). Dazu kam eine
Simulation: Der Algorithmus hat für acht Commander mit echten EDHREC-Pools je ein Deck gebaut und
dabei immer die erste Empfehlung genommen. Die Commander waren Krenko (B2), Lathril (B2), Atraxa
(B3), Light-Paws (B3), Sythis (B3), The Ur-Dragon (B3), Edgar Markov (B4) und Kinnan (B5).
Außerdem habe ich Stichproben von etwa 120 echten Karten in `data/cards.json` gegen die
Scryfall-Tagger-Hierarchie geprüft.

Maßstäbe:
- **Command-Zone-Template**: etwa 10 Ramp, 10–12 Card Advantage, 10–12 gezielte Interaktion,
  3–5 Board Wipes, 36–38 Länder.
- **8x8-Methode**: 35 Länder plus 8 Kategorien à 8 Karten.
- **EDHREC-Durchschnittsdecks** des jeweiligen Commanders.
- **Frank Karstens Land-Regression für 99-Karten-Decks**:
  `Länder ≈ 31,42 + 3,13 × Ø-Manawert − 0,28 × billige Ramp/Draw (MV ≤ 2)`.
- **Commander Brackets (Beta)** in der aktuellen Fassung:
  - Update vom 21.10.2025: Tutor-Beschränkung gestrichen, Bracket 2 ist nicht mehr an Precons
    gekoppelt, Spieldauer pro Bracket, zehn Game Changer entfernt.
  - Update vom 09.02.2026: Farewell und Biorhythm sind neu auf der Liste. Seitdem gibt es
    53 Game Changer und keine weiteren Änderungen.

Legende: 🔴 falsch oder deutlich schädlich · 🟠 fehlt, mit spürbaren Folgen · 🟡 kleinere Lücke ·
🟢 gut so. ✅ heißt in diesem Branch umgesetzt.

---

## 1. Priorisierte Befunde

### 🔴 1.1 Pflicht-Staples fallen durch, vor allem in hohen Brackets ✅

In der Simulation fehlten im Kinnan-cEDH-Deck **Sol Ring (99 % Inclusion), Command Tower (98 %) und
Gaea's Cradle (69 %)**. Bei Sythis fehlte Sol Ring (55 %), bei Lathril Arcane Signet (57 %).
Ursachen:
- Die Kurven-Strafe für einen vollen Slot (bis −0,8) und die Strafe für eine volle Rolle (−0,15)
  treffen eine Karte mit 99 % Inclusion genauso hart wie eine 5-%-Karte. Kinnans Deck hatte den
  ≤1-Slot schnell mit Moxen gefüllt, danach war Sol Ring chancenlos.
- Bei Ländern zählt nur `synergy + 0,8 × inclusion`. Command Tower hat Synergie ~0, weil es *jeder*
  spielt, und unterliegt deshalb Nischenländern.

**Umgesetzt:** Kurven- und Rollen-Strafen werden mit `1 − inclusion²` gedämpft. Eine Karte, die
praktisch jedes Deck spielt, wird also kaum noch bestraft. Zusätzlich gibt es einen Staple-Bonus
ab 60 % Inclusion.

### 🔴 1.2 Kein Gegensteuern bei zu viel Ramp, kein Erzwingen bei zu wenig ✅

Simulationsergebnisse (Ist/Ziel):

| Commander | Ramp | Draw | Interaction |
|---|---|---|---|
| The Ur-Dragon | **19**/10 | 10/10 | 9/9 |
| Kinnan | **23**/14 | 10/12 | 13/14 |
| Lathril | 13/10 | 11/10 | 8/8 |
| Edgar Markov | **8/12** | 10/11 | 9/11 |
| Light-Paws | **5/10** | 9/10 | 8/9 |

Ursachen:
- „Rolle voll“ kostet nur −0,15. Das gleicht ein bisschen Synergie aus, mehr nicht.
- Der Bonus für fehlende Rollen hängt nicht davon ab, wie viele Slots noch frei sind. Bei
  3 freien Slots und 4 fehlenden Ramp-Karten drängt der Algorithmus nicht stärker als am Anfang.

**Umgesetzt:**
- *Dringlichkeit*: offenes Rollen-Defizit ÷ freie Spell-Slots. Steigt sie, wächst der Bonus für
  Rollenkarten, und Karten ohne fehlende Rolle bekommen einen Malus.
- *Sättigung*: Jede Karte über dem Ziel kostet mehr als die vorige. Bei Board Wipes ist die Strafe
  am härtesten.

### 🔴 1.3 Rollen-Erkennung: systematische Fehlzuordnungen ✅

Stichproben aus `data/cards.json`:

| Karte | vorher | Problem |
|---|---|---|
| Cultivate, Kodama's Reach, Rampant Growth | ramp **+ tutor** | Land-Tutoren zählen als Tutor. Das verfälscht die Tutor-Dichte. Grund: `tutor-to-hand` liegt *unter* `tutor`, nicht unter `tutor-land`. |
| Path to Exile | **ramp** + removal | `donate-rampant-growth` hängt unter `land-ramp`. Das Ramp ist aber für den Gegner. |
| Opt, Ponder, Preordain, Consider, Brainstorm | **draw** | Cantrips ersetzen sich nur selbst und bringen keinen Kartenvorteil. Sie füllen den Draw-Slot, ohne Karten zu ziehen. |
| Faithless Looting | **draw** | Looting/Rummaging ist Kartenfilterung, kein Kartenvorteil. |
| Mind Stone, Commander's Sphere | ramp **+ draw** | „Egg“-Draw ist ein Cantrip. |
| Fact or Fiction, Impulse-Effekte | **keine Rolle** | `impulse` und `fact-or-fiction` hängen unter `card-advantage`, nicht unter `draw`. Echter Kartenvorteil wurde also nicht erkannt. |
| Dark Ritual | ramp | Einmaliges Ritual, kein dauerhaftes Ramp. Das Command-Zone-Template zählt es nicht. |
| Thassa's Oracle, Craterhoof, Approach, Triumph of the Hordes | **keine Rolle** | Es gibt keine Kategorie „Finisher“. |

**Umgesetzt:**
- *Draw*: neue Basis `card-advantage`, ohne `cantrip`, `loot`, `rummage`, `brainstorm`,
  `regrowth` und Egg-Karten.
- *Tutor*: ohne `tutor-land` und die reinen Ziel-Tags `tutor-to-*`.
- *Ramp*: ohne `ritual` und `donate-rampant-growth`.
- *Neue Rolle `wincon`* („Finisher“): `alternate-win-condition`, `overrun`,
  `extra-combat-phase`.
- Die Kartendaten werden mit Schema-Version 3 neu gebaut.

### 🟠 1.4 Commander-Bedürfnisse werden nicht erkannt ✅

Die Zielwerte hängen nur am Bracket, das Template ist für alle Commander gleich. Das passt nicht
zu echter Deckbau-Praxis:
- **Light-Paws** (Auren-Voltron) spielt laut EDHREC ~20 Protection-Karten und kaum Ramp.
  Protection kam im Template überhaupt nicht vor.
- **The Ur-Dragon** (Ø-MV 4,3) braucht deutlich mehr Ramp als 10.
- **Krenko** spielt kaum Board Wipes (0,9 im Schnitt), das Template wollte 3.

Erkennen lässt sich das aus den Daten, die schon da sind. Die Summe der Inclusion-Werte aller
Pool-Karten einer Rolle ergibt, wie viele Karten dieser Rolle das EDHREC-Durchschnittsdeck spielt.
Dieser Wert wird hochgerechnet, weil der Pool nur die Top-Karten enthält.

**Umgesetzt:**
- Ziel = ½ Bracket-Template + ½ EDHREC-Ist, mit Leitplanken (z.B. Ramp 6–18).
- Neue Template-Rollen **Protection** und **Finisher**.
- Das Kurven-Profil wird aus dem EDHREC-Ø-Manawert vorgeschlagen.

### 🟠 1.5 Landzahl ignoriert Kurve und Bracket ✅

`deckTemplate` übernahm den EDHREC-Durchschnitt und klemmte ihn auf 30–40. Bracket und Kurve
spielten keine Rolle. Kinnan meldete 25 Länder und bekam 30. Die Ur-Dragon bekam 36 Länder trotz
Ø-MV 4,3. Karstens Formel ergibt für sie ~41.

**Umgesetzt:**
- Landzahl = Mittel aus EDHREC-Schnitt und Karsten-Schätzung (auf dem EDHREC-Profil), mit
  Grenzen je Bracket (B1–2: 33–40, B3: 32–39, B4: 30–38, B5: 26–34).
- Der Editor zeigt zusätzlich die Karsten-Empfehlung für das *tatsächliche* Deck.

### 🟠 1.6 Keine Combo-Prüfung ✅

Die Brackets sagen: B1–2 keine 2-Karten-Infinite-Combos, B3 keine frühen 2-Karten-Combos. Der
Swipe bot munter Kiki-Jiki + Helm of the Host (Krenko B2) oder Dramatic Reversal + Isochron
Scepter an.

**Umgesetzt:** Commander Spellbook (`/find-my-combos`) läuft einmal pro Pool serverseitig und
liefert alle Combos innerhalb des Pools (~2 s, 24 h gecacht, ohne Netz einfach leer). Regeln:
- B1–2: keine Karte, die eine 2-Karten-Combo vervollständigt. Der Commander zählt als Teil.
- B3: keine *frühe* 2-Karten-Combo, also zusammen ≤ 6 Mana oder von Spellbook als „Ruthless“
  markiert.
- B4–5: Karten, die eine Combo vervollständigen, werden bevorzugt („Completes a combo with …“).
- Der Editor listet die Combos des Decks und meldet Verstöße.

### 🟠 1.7 Mana-Basis: Fetches gelten als farblos, Basics ignorieren Nonbasic-Quellen ✅

- Scryfall liefert für Fetchländer (Misty Rainforest, Evolving Wilds, Fabled Passage) kein
  `produced_mana`. Sie zählten deshalb als farblos: kein Fixing-Bonus und keine Farbquelle in der
  Statistik.
- Der Fixing-Bonus zählte alle produzierten Farben, auch solche außerhalb der Identität.
  City of Brass galt so in Mono-Rot als 5-Farb-Fixer.
- Reine Farblos-Länder (Rogue's Passage, Reliquary Tower) bekommen in 3–5-Farb-Decks keinen
  Malus. Erfahrene Spieler sind dort sehr zurückhaltend, weil jede farblose Quelle die
  Farbkonstanz kostet.
- `fillBasics` verteilt Basics nur nach Pips und ignoriert, welche Farben die Nonbasics schon
  liefern. Mit 6 Dual-Lands U/B und Pips 50/50 bekommt das Deck trotzdem 50/50 Basics.

**Umgesetzt:**
- `landColors()` erkennt Fetches über den Oracle-Text.
- Der Fixing-Bonus zählt nur Farben der Identität.
- Farblos-Malus ab zwei Farben.
- Basics füllen gezielt die Farben auf, deren Anteil an den Quellen hinter ihrem Pip-Anteil
  zurückliegt.

### 🟡 1.8 Bracket-Regeln: Limits stimmen, Texte sind veraltet ✅ (teilweise)

- 🟢 Game Changer 0/0/3/∞/∞ ist korrekt. Die Liste kommt aus Scryfalls `game_changer`-Flag und
  hatte zum Prüfzeitpunkt 53 Karten, inklusive Farewell und Biorhythm. Sie bleibt also aktuell,
  ohne dass jemand eine Liste pflegen muss.
- 🟢 Mass Land Denial ist in B1–3 verboten. Extra Turns: B1 keine, B2–3 wenige und nicht
  gekettet. Das Limit von 1 ist konservativ, aber regelkonform.
- 🟡 Tutoren: Die offizielle Beschränkung ist seit Oktober 2025 gestrichen. Die Dichte prägt
  trotzdem das Spielgefühl. **Umgesetzt** als Einstellung „Max. Tutoren“ (Vorgabe B1 1, B2 2,
  B3 4, B4 8, B5 ohne Limit) statt als Bracket-Regel. Land-Tutoren zählen nicht mehr mit,
  siehe 1.3.
- 🟡 Die Beschreibungen nannten B2 noch „Precon power level“. **Umgesetzt**: Die Texte nennen
  jetzt die erwartete Spieldauer (B1 ≥ 9 Züge, B2 ≥ 8, B3 ≥ 6, B4 ≥ 4).

### 🟡 1.9 Swipe-Ablauf

- 🟢 Die Reihenfolge Spells → Nonbasics → Basics nach Pips entspricht der Profi-Praxis: erst
  Plan und Funktion, dann Mana-Basis.
- 🟢 Die gewichtete Zufallswahl aus den Top 5 hält das Swipen frisch, ohne Murks vorzuschlagen.
- 🟠 Innerhalb der Spells gab es keine Dramaturgie. Ein Profi legt erst Plan und Synergie fest
  und füllt dann die Pflicht-Slots. **Umgesetzt** über die Dringlichkeit (1.2): Am Anfang dominiert
  die Synergie, gegen Ende werden fehlende Rollen erzwungen.
- 🟠 Finisher fehlten als Kategorie. **Umgesetzt** (1.3/1.4): Ziel B1–3 3, B4 4, B5 2.
- 🟡 Einstellungen geändert, aber die Phase bleibt stehen. Wer z.B. die Landzahl erhöht, muss
  sofort in die Land-Phase wechseln. **Umgesetzt**: Die Phase wird bei jeder Änderung neu
  berechnet.
- 🟡 Fetch- und Dual-Lands nach Budget: Bisher kamen teure Duals (Atraxa-Simulation: alle Shocks
  und Triomes, Deck ~445 $), egal wie hoch das Budget war. **Umgesetzt**: Budget-Grenze pro Karte.
  Karten ohne Preis gelten als erlaubt.
- 🟡 Fallback-Pool: Bei Commandern ohne EDHREC-Daten fehlten Protection-Staples und Finisher.
  **Umgesetzt**: Der Fallback nimmt jetzt auch die beliebtesten Protection- und Finisher-Karten
  auf.

### 🟡 1.10 Editor-Statistiken ✅ (teilweise)

- 🔴 Die Rollenziele kamen aus `deckTemplate(bracket, colors, null)`, also ohne EDHREC-Landzahl und
  ohne die Einstellungen des Decks. Im Editor standen damit andere Ziele als beim Swipen.
  **Umgesetzt**: Der Editor nutzt dieselben Ziele (Empfehlung + Einstellungen).
- 🟠 Für einen erfahrenen Spieler fehlten:
  - Karstens Land-Empfehlung für die tatsächliche Kurve,
  - Tutor-Zähler gegen das Limit,
  - Protection/Finisher,
  - Combos,
  - Interaktion ≤ 2 MV und Ramp ≤ 2 MV (Tempo-Kennzahlen),
  - Farbquellen in Bezug zu den Pips.

  **Umgesetzt** bis auf eine echte Karsten-Quellen-Tabelle pro Farbe. Es gibt eine einfache
  Quellen-vs.-Pips-Warnung.
- 🟢 Kurve, Typen, Pips/Quellen und Preis sind sinnvoll.

### 🟡 1.11 Daten

- 🟡 Preise: `oracle_cards` nimmt den Preis der „repräsentativen“ Druckversion. Für manche Karten
  (Chaos Warp, Swiftfoot Boots, Fellwar Stone, Mind Stone) ist der dort `null`. Der günstigste
  Druck ginge nur über den viel größeren `default_cards`-Bulk. *Nicht umgesetzt*. Das
  Budget-Filter lässt preislose Karten durch.
- 🟢 `game_changer` direkt von Scryfall ist die richtige Quelle.

---

## 2. Was gut ist (nicht anfassen)

- EDHREC-Bracket-Seite zuerst, Fallback auf die Gesamtseite unter 40 Decks. Das ist statistisch
  sauber.
- Bracket-Prüfung als harter Filter vor dem Scoring. Regelwidrige Vorschläge sind unmöglich.
- Undo, Maybe-Liste und „Skip to lands“ sind genau die Werkzeuge, die man beim Bauen braucht.
- Tagger-Tags statt Regex als primäre Quelle, Regex nur als Fallback für brandneue Karten.
- Kurvenziel als Zielhistogramm statt nur Ø-MV.

---

## 3. Neue Einstellungen (Teil 2)

Gespeichert pro Deck (`deck.settings`, Persist-Version 2 mit Migration). Erreichbar im
Build-Setup („Advanced settings“) und während des Swipens (Dialog). Jede Änderung wirkt auf
den nächsten Vorschlag.

| Einstellung | Wirkung |
|---|---|
| Lands / davon Nonbasics | Teilt die 99 in Spell- und Land-Slots. Die Phase wird sofort neu berechnet. |
| Ramp, Card Draw, Interaction, Board Wipes, Protection, Finishers | Rollenziele für Bonus, Dringlichkeit und Sättigung |
| Max. Tutoren | harter Filter |
| Kurven-Profil (Low / Balanced / High) | verschiebt das Zielhistogramm, zeigt den Ziel-Ø-MV |
| Synergie ↔ Staples | Gewichtung EDHREC-Synergie gegen Inclusion |
| Budget pro Karte | harter Filter (Karten ohne Preis erlaubt) |
| Game Changer: bevorzugen / neutral / meiden | Bonus bzw. Filter, immer innerhalb des Bracket-Limits |
| Früher abgelehnte Karten ausblenden | blendet Karten aus, die man für diesen Commander schon einmal nach links geswipet hat, auch in anderen Decks |

„Reset to recommendation“ setzt alle Zielwerte und das Kurven-Profil auf die Empfehlung aus
Template und EDHREC zurück. Budget und Ausblenden bleiben erhalten, weil sie persönliche Vorgaben
sind. Präferenzen (Budget, Gewichtung, Game Changer, Ausblenden) werden beim nächsten neuen Deck
vorausgefüllt.

---

## 4. Simulation nach den Änderungen

Gleiche acht Pools, gleiche Methode (immer die erste Empfehlung nehmen):

| Commander | Ramp vorher (Ist/Ziel) | Ramp nachher | Weitere Effekte |
|---|---|---|---|
| The Ur-Dragon (B3) | 19/10 | 15/15 | 39 statt 36 Länder, Kurven-Profil „High“ |
| Kinnan (B5) | 23/14 | 22/20 | Sol Ring, Command Tower und Gaea's Cradle sind jetzt drin |
| Edgar Markov (B4) | 8/12 | 10/10 | Basics folgen den Pips (17 Swamps, 1 Plains) statt pauschal verteilt |
| Light-Paws (B3) | 5/10 | 7/7 | Protection-Ziel 12 statt keines, Kurven-Profil „Low“ |
| Lathril (B2) | 13/10 | 14/14 | |
| Krenko (B2) | 8/10 | 8/8 | Board-Wipe-Ziel 2 statt 3, Interaction 11 |

Alle Rollenziele werden jetzt erreicht oder liegen höchstens eine Karte darüber. Einzige Ausnahme
sind Finisher bei Light-Paws, weil der EDHREC-Pool dort schlicht keine enthält.

---

## 5. Offene Folgeideen

1. Günstigster Preis über `default_cards` (1.11).
2. Karsten-Quellen-Tabelle pro Farbe und Pip-Intensität (z.B. `{W}{W}` auf Turn 2 braucht mehr
   Quellen als `{2}{W}` auf Turn 4).
3. Partner/Background: zwei Commander-Profile zusammenführen.
