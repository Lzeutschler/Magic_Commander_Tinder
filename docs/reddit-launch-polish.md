# Reddit-Launch: priorisierte Polish-Liste

Stand: 23.10.2026, Commit `a9b8515`. Getestet wurde ein lokaler Production-Build (`pnpm build && pnpm start`)
im Browser, auf dem Desktop (800×600) und mit Handy-Größe (375×812). Durchgespielt wurden Startseite,
Commander-Wahl, ein komplettes Deck per Swipe (Krenko, Bracket 2), der Deck-Editor, das Einsteiger-Quiz bis
zur Ergebnisliste und Goldfish mit Mulligan und den ersten Zügen. Nicht getestet: ein echtes Handy mit
Touch-Gesten und der In-App-Browser der Reddit-App.

Größen: **S** = unter einer Stunde, **M** = ein halber Tag, **L** = ein Tag oder mehr. ✅ = umgesetzt.

---

## Worin Brewmance sich abhebt

| | Brewmance | Zwipe | EDHMatch / EDH Compass | Moxfield / Archidekt |
| --- | --- | --- | --- | --- |
| Swipe-Deckbau | ✅ | ✅ | – | – |
| Deck bleibt beim Swipen ausgewogen (Rollen, Kurve) | ✅ | – | – | – |
| Bracket-Regeln (Game Changer, Combos, Extra Turns) | ✅ | – | – | Prüfung erst im fertigen Deck |
| Commander-Quiz | ✅ mit Einsteiger-Weg (Vibes, Franchises) | – | ✅, Ergebnisse als Liste | – |
| Goldfish | ✅ wie in Arena | – | – | ✅ |
| Plattform | Web, ohne Account | iOS/Android, mit Account | Web | Web, mit Account |

Ein „Tinder für Karten“ gibt es mit Zwipe schon. Neu ist bei Brewmance das Zusammenspiel: **Man swipet, und
das Deck bleibt dabei spielbar und im gewählten Bracket.** Dazu kommt der durchgehende Ablauf von Quiz über
Swipe bis Goldfish im Browser. Die Liste unten ist danach sortiert, wie sichtbar genau das für jemanden wird,
der von Reddit kommt, meistens auf dem Handy.

---

## P0: vor dem Post

### 1. Goldfish auf dem Handy: Starthand lässt sich nicht behalten (M) ✅

Bei 375×812 liegt der Button „Keep 7“ bei y = 807–855, also unterhalb des Bildschirms, und die Seite scrollt
nicht. Die sieben Karten brechen in vier Reihen um, weil ihre Breite über `clamp(110px, min(12.5vw, 30vh), 240px)`
(`components/goldfish/mulligan-overlay.tsx`) auf dem Handy bei 110 px hängen bleibt. Die Überschrift
überlappt außerdem die Werkzeugleiste. Wer vom Handy aus Goldfish öffnet, kommt nicht über den Mulligan hinaus.

- Overlay mit `overflow-y-auto` und die Buttons unten fixieren.
- Auf schmalen Bildschirmen die Hand als überlappenden Fächer oder kleineres Raster zeigen.
- Den Spieltisch selbst auf dem Handy nicht umbauen, sondern einen ehrlichen Hinweis zeigen: „Goldfish works
  best on a tablet or computer“.

Umgesetzt: Auf dem Handy liegt die Starthand in einer Reihe, die man seitlich wischt. Das Overlay scrollt, wenn
der Platz nicht reicht, und zeigt den Hinweis zum größeren Bildschirm. Die Werkzeugleiste ist auf dem Handy eine
einzige, seitlich wischbare Zeile, sodass der Tisch mehr Höhe bekommt.

### 2. Swipen auf dem Handy: der eigentliche Unterschied ist unsichtbar (M) ✅

Auf dem Handy füllen Karte und Buttons den ersten Bildschirm. Darunter folgt der komplette Deck-Fortschritt
(Rollen, Kurve, Einstellungen), und ganz unten, rund zwei Bildschirme tiefer, kommt die Erklärung zur Karte:
Synergie, „Your deck needs board wipes (0/3)“, Rolle und Preis. Beim Swipen sieht man also nur eine Karte,
genau wie bei Zwipe. Auch der Hinweis zu den Gesten ist auf dem Handy ausgeblendet (`hidden … sm:block` in
`components/swipe/swipe-screen.tsx:214`), sodass niemand erfährt, dass nach oben wischen „Maybe“ bedeutet.

- Zwischen Karte und Buttons eine kompakte Zeile: Rolle, Synergie und der wichtigste Grund, z. B.
  „Board Wipe · +50 % · deck needs wipes 0/3“.
- Oben eine schmale Fortschrittsleiste: „23/99 · Ramp 4/8 · Draw 2/9 …“, die sich antippen und aufklappen lässt.
- Beim ersten Swipe einmalig die Gesten erklären (rechts, links, hoch), danach nicht mehr.

Umgesetzt (unterhalb von `lg`): Über der Karte stehen Zähler und Phase (vor dem ersten Swipe die Gesten) sowie
die sechs Rollen-Balken in zwei Reihen. Unter den Buttons stehen Synergie, Popularität, Rolle, Preis und bis zu
zwei deckbezogene Gründe. Die Karte ist dafür auf dem Handy etwas kleiner. Bei 375×812 passt alles auf einen
Bildschirm, bei 375×667 ist der zweite Grund knapp abgeschnitten.

### 3. Decks teilen (M–L) ✅

Ein Deck kann man heute nur als Text kopieren oder als Datei herunterladen. Auf Reddit verbreitet sich ein
Tool aber über Links wie „Schaut mal, was ich in fünf Minuten gebraut habe“. Dafür braucht es kein Backend:

- Das Deck komprimiert in die URL schreiben, z. B. `/d#…`. Dahinter liegt eine schreibgeschützte Ansicht mit den
  Buttons „Goldfish this deck“ und „Copy to my decks“.
- Dazu ein Vorschaubild pro geteiltem Deck (Commander-Art, Bracket, Kurve), damit der Link auf Reddit und
  Discord gut aussieht. Das geht nur, wenn die Deckdaten in Pfad oder Query stehen und nicht im Hash, weil der
  Server den Hash nie sieht. Dafür reicht eine kompakte Kodierung, z. B. Scryfall-IDs als Base64.

Umgesetzt: „Share“ im Deck-Editor erzeugt `/d/<code>` (Kartennamen, deflate, base64url, rund 1 KB für 99 Karten)
und kopiert den Link. Auf Touch-Geräten öffnet sich stattdessen das System-Teilen-Menü. Die Seite zeigt Liste und
Statistik und bietet „Goldfish this deck“, „Save to my decks“ und „Export“. Dazu gibt es ein Vorschaubild mit
Commander, Bracket, Rollen und Kurve. Reddit- und Discord-Bots bekommen die OG-Tags direkt im `<head>`, und
geteilte Decks sind auf `noindex` gesetzt.

### 4. Live schalten und auf echten Geräten testen (S)

Die Seite läuft auf Vercel, eine eigene Domain kommt noch. Ohne `NEXT_PUBLIC_SITE_URL` nimmt die App Vercels
Produktions-Domain (`VERCEL_PROJECT_PRODUCTION_URL`), und das ist automatisch die eigene Domain, sobald eine
verbunden ist. Offen ist der Test auf echten Geräten: auf einem iPhone (Safari und der In-App-Browser der
Reddit-App) sowie einem Android-Gerät ein Deck swipen, teilen und goldfishen. Das Ziehen mit dem Finger und das
System-Teilen-Menü konnte ich nicht prüfen.

---

## P1: den Unterschied zeigen

### 5. Startseite und Vorschaubild: mit dem Unterschied aufmachen (S) ✅

Die Überschrift „Swipe right on your next Commander deck“ und das Open-Graph-Bild (nur Text) erzählen genau
die Geschichte, die Zwipe schon hat. Vorschlag:

- **Überschrift:** „Swipe your way to a balanced, bracket-legal Commander deck“
- **Unterzeile:** „Ramp, draw, removal and curve stay on target. Game Changers and two-card combos stay
  within your bracket. Then goldfish it, right in your browser, no account.“
- **OG-Bild:** Karten-Fächer oder Kessel plus drei kurze Punkte (Balanced · Bracket-aware · Goldfish).
  Auf Reddit ist das Vorschaubild oft das Erste, was jemand sieht.

Umgesetzt: `SITE.tagline` ist jetzt „Swipe your way to a balanced, bracket-legal Commander deck“ und steht so in
der Überschrift, im Vorschaubild und im Alt-Text. Unterzeile und `SITE.description` nennen Rollen, Kurve und
Bracket. Das Vorschaubild hat links Slogan und drei Stichpunkte, rechts einen Fächer aus Atraxa, The Ur-Dragon und
Edgar Markov. Es wird beim Build einmal gerendert. Die Karten kommen über `scryfallImageDataUrl` mit eigenem
User-Agent, weil Scryfall Anfragen mit generischem User-Agent ablehnt.

### 6. Commander-Wahl auf dem Handy: „Start swiping“ liegt zu tief (S) ✅

Nach der Wahl des Commanders steht der Start-Button bei etwa 1.900 px, also nach rund 2,3 Bildschirmen
Scrollen über Kartenbild, fünf Brackets und Themes. Auf dem Handy den Button unten fixieren und das
Kartenbild kleiner machen.

Umgesetzt: Unterhalb von `sm` ist der Button eine fixierte Leiste am unteren Rand, und das Kartenbild ist 160 statt
224 px breit. Das gilt auch für den Deckstart aus der Quiz-Shortlist.

### 7. Quiz-Ergebnis teilbar machen (M) ✅

Kein anderes Quiz hat den Einsteiger-Weg mit Franchises (Herr der Ringe, Final Fantasy, Marvel …) und das
direkte Weiterswipen ins Deck. Ein „My commander match: Sauron, the Dark Lord (96 %)“ mit Bild und Link zum
Quiz wäre der einfachste Weg, dass Leute es in ihre Pod-Chats weitergeben.

Umgesetzt: „Share“ auf der Shortlist erzeugt `/q/<code>` mit bis zu acht Commandern, jeweils mit Match-Prozent und
zwei Gründen. Der Commander, der gerade angezeigt wird, steht vorne. Die Seite zeigt den besten Treffer groß, die
übrigen darunter, und bietet „Find your own commander“ sowie „Build …“. Die Build-Links (`/build?commander=…`)
belegen die Commander-Wahl vor. Das Vorschaubild zeigt Name, Prozent, Gründe und einen Fächer der drei besten
Treffer. Deck- und Quiz-Links nutzen jetzt denselben Kodierer (`lib/share/code.ts`).

### 8. Feedback-Kanal sichtbar machen (S) ✅

Feedback geht heute nur per E-Mail, und die Adresse steht versteckt auf der About-Seite. Für den Launch einen
„Feedback“-Link in Header oder Footer setzen, der zum Reddit-Thread, zu GitHub Issues oder zu einem einfachen
Formular führt. In der ersten Woche kommt dort das wertvollste Material an.

Umgesetzt: „Feedback“ steht im Header (ab `sm`) und im Footer und öffnet einen Dialog mit „Open an issue on GitHub“
und „Send an email“. **Nach dem Post** in `lib/site.ts` die Thread-URL bei `FEEDBACK.reddit` eintragen. Dann bietet
der Dialog „Comment on Reddit“ als ersten Weg an.

---

## P2: kleinere Fehler und Feinschliff

### 9. Falscher Text bei einem fertigen Deck (S) ✅

Wer ein fertiges Deck über „Swipe more cards“ wieder öffnet, liest „63 spells and 36 nonbasic lands picked“.
Die 30 Standardländer werden dabei als Nicht-Standardländer gezählt (`components/swipe/swipe-screen.tsx:322`).

### 10. Cache vorwärmen und sich bei EDHREC und Spellbook vorstellen (S) ✅ teilweise

Die erste Karte kam lokal mit kaltem Cache nach etwa 3 Sekunden. Danach sind EDHREC und Commander Spellbook
einen Tag lang gecacht (`"use cache"` plus CDN), das ist gut. Ein Reddit-Ansturm verteilt sich aber auf
viele verschiedene Commander:

- Nach dem Deploy die beliebtesten rund 200 Commander für die Brackets 2 und 3 einmal über `/api/candidates`
  abrufen. Das macht den ersten Besuch schneller und erspart EDHREC eine Lastspitze.
- Den User-Agent um eine Kontaktadresse ergänzen, z. B. `Brewmance/0.1 (+https://…)`, damit EDHREC und
  Spellbook sich melden können, statt einfach zu blocken.
- Optional EDHREC vorab kurz Bescheid geben, weil die App deren inoffizielles JSON nutzt.

Umgesetzt: Alle Anfragen an EDHREC, Commander Spellbook und Scryfall (auch im Daten-Build) senden
`Brewmance/0.1 <info@45level.com> (+<Seiten-URL>)` (`USER_AGENT` in `lib/site.ts`).

Nicht umgesetzt, mit neuem Befund: Laut Next.js-Doku lebt `"use cache"` auf Serverless nur im Speicher einer
Instanz und hält dort kaum über einzelne Anfragen hinaus. Den eigentlichen Schutz liefert der CDN-Cache von
`/api/candidates` (`s-maxage` einen Tag), und der gilt pro Vercel-Region. Ein Warm-up-Skript, das von
Deutschland aus läuft, würde nur die europäische Region füllen und US-Besuchern nicht helfen. Darum gibt es
keins. Der wirksame Hebel wäre `"use cache: remote"` in `fetchCommanderPage` und `findCombos`: ein von
Vercel bereitgestellter, über alle Instanzen geteilter Cache. Dann ruft jeder Commander/Bracket/Theme EDHREC
höchstens einmal am Tag ab, weltweit. Vorher die Limits für den Runtime Cache auf dem Hobby-Plan prüfen. Die
konnte ich nicht verlässlich klären, und auf Hobby lässt sich kein Zusatzvolumen kaufen.

### 11. Commander-Daten verkleinern (S–M) ✅

`public/data/commanders.json` ist 2,7 MB groß (600 KB gzip) und wird auf `/build` und `/quiz` geladen. Im WLAN
fällt das nicht auf, im Mobilfunk schon. Felder kürzen oder die Quiz-Felder in eine eigene Datei auslagern.

Umgesetzt: Der Regeltext (39 % der Datei) und der EDHREC-Slug sind raus. Das Quiz bekommt die Regel-Komplexität
schon beim Build als Zahl (`complexity`). Vorher 2,7 MB, 592 KB gzip und 382 KB Brotli, jetzt 1,9 MB, 336 KB gzip
und 245 KB Brotli. Die Schema-Version des Daten-Builds steht auf 4, damit lokale Daten neu erzeugt werden.

---

## Vor dem Posten entscheiden

- **Impressum:** ✅ geklärt. Die Adresse ist die Geschäftsadresse von 45level und darf so stehen bleiben.
- **Reichweite messen:** Wunsch: keine Kosten, wenn überhaupt Google Analytics. Google Analytics setzt Cookies und
  überträgt Daten in die USA. In Deutschland braucht das praktisch immer ein Einwilligungs-Banner und eine
  angepasste Datenschutzerklärung, und das „no cookies, no banner“ der Seite fiele weg. Kostenlos und ohne Banner
  ginge Vercel Web Analytics: Auf Hobby sind 50.000 Events im Monat frei, danach pausiert die Erfassung, Kosten
  entstehen keine. Die Datenschutzerklärung müsste trotzdem einen Absatz dazu bekommen. Entscheidung offen.
- **Domain:** ✅ `https://www.brewmance.app` ist verbunden, `brewmance.app` leitet per 308 dorthin. Canonical,
  `og:url` und Vorschaubilder zeigen schon auf www, ohne weitere Einstellung.
- **EDHREC:** Die Nutzungsbedingungen (gültig seit 06.08.2024) verbieten automatisierte Anfragen an die Seite,
  das Weiterverbreiten der Inhalte und den Zugriff, um eine ähnliche oder konkurrierende Seite zu bauen. Ein
  offizielles API gibt es nicht. Brewmance liest deren internes JSON und verstößt damit streng genommen gegen die
  Bedingungen. Viele Community-Tools machen es trotzdem, aber ein Reddit-Launch macht es sichtbar. Vor dem Post
  EDHREC anschreiben und um Erlaubnis bitten. Bis zur Antwort hilft ein Schalter, mit dem sich EDHREC sofort
  abschalten lässt (die App hat schon eine eigene Bewertung als Ersatz). Dazu sichtbare Links zurück zu den
  EDHREC-Seiten. Keine Rechtsberatung.

  Stand: Die Rücklinks sind eingebaut. Die Deck-Anzahl im Swipe-Panel, in der Commander-Wahl und im Quiz verlinkt
  auf die Commander-Seite, passend gefiltert nach Bracket und Theme. Jede vorgeschlagene Karte verlinkt auf ihre
  Kartenseite. Editor, geteilte Decks und geteilte Quiz-Ergebnisse haben „Compare on EDHREC“. Alle Links nutzen
  `rel="noopener"` ohne `noreferrer`, damit EDHREC die Besuche sieht. Die Mail an contact@edhrec.com ist
  entworfen. Der Abschalt-Schalter ist gebaut: `RECS_SOURCE=off` in Vercel setzen und neu deployen (siehe README).

  ✅ Geklärt (23.10.2026): EDHREC erlaubt die Nutzung mit höchstens 1 Anfrage pro Sekunde und einem User-Agent
  mit Kontakt-Mail. Beides ist umgesetzt, Details in `docs/edhrec-data-policy.md`. Nach dem Launch EDHREC unter
  edhrec@edhrec.com den Link schicken.

## Für den Post selbst

- Ein kurzes Bildschirmvideo oder GIF vom Swipen, auf dem sich die Rollen-Balken füllen, sagt mehr als jeder Text.
- Zwipe von dir aus erwähnen und in einem Satz sagen, was anders ist. Das wird sowieso jemand fragen, und so
  wirkt es ehrlich statt überrascht.
- Vorher die Regeln zu Eigenwerbung in r/EDH und r/magicTCG lesen. Die habe ich nicht geprüft.

---

## Sinnvolle Reihenfolge

1. Mobile-Fixes (1, 2, 6), weil der Großteil der Reddit-Besucher auf dem Handy kommt.
2. Startseite und OG-Bild (5) sowie Feedback-Link (8): wenig Aufwand, direkte Wirkung beim Post.
3. Decks teilen (3), danach Quiz teilen (7): das, was Leute zurückbringt.
4. Deploy, Gerätetest, Cache vorwärmen (4, 10), dann posten.
5. P2-Punkte nebenbei.
