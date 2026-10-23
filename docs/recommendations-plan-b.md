# Plan B: Eigene Kartenempfehlungen, falls EDHREC Nein sagt

## Context

Brewmance holt heute pro Commander die Karten mit `synergy`/`inclusion`, die Themes, die Deckzahlen pro Bracket und die durchschnittliche Landzahl live von `json.edhrec.com`. Zur Build-Zeit kommen dazu Archetyp-Affinitäten und Deckzahlen für das Quiz. EDHRECs AGB (seit 2024-08-06) verbieten automatisierte Abrufe, Weitergabe und den Bau „ähnlicher oder konkurrierender“ Seiten. Die Anfrage an contact@edhrec.com läuft noch. Dieser Plan beschreibt, wie wir vergleichbare Empfehlungen selbst und legal berechnen können, falls die Antwort Nein ist.

**Wichtigster Befund:** EDHREC, Archidekt und Commander Spellbook gehören alle zu **Space Cow Media** (CEO Don Miner, EDHREC-Gründer). Sagt EDHREC Nein, ist Archidekt als Datenquelle sehr wahrscheinlich ebenfalls zu. Die einzige große Deckquelle außerhalb dieser Firma ist **Moxfield**. Ohne Moxfield haben wir anfangs nur **Tausende statt Millionen** Decks. Der Plan muss deshalb mit wenig Daten gut funktionieren und darf erst später auf viel Daten setzen.

---

## 1. Wie EDHREC funktioniert (Recherche, verifiziert)

**Datenbasis**
- Etwa 10 Mio. eindeutige Decks aus den letzten 2 Jahren, aus Archidekt, Moxfield und Scryfall. Täglich gesammelt, in Postgres gespeichert, 2026 auf AWS-Pipelines umgebaut.
- Früher kamen Decks auch von TappedOut, MTGGoldfish, Deckstats und AetherHub. TappedOut hat EDHREC 2019 ausgesperrt.
- Filter: Nur legale Decks (100 Karten, Color Identity, Banlist). Duplikate werden per Deck-ID entfernt.
- Der Original-Bot hat außerdem fast gleiche Decks entfernt: Teilen zwei Decks mehr als 70 % ihrer Karten, wird das ältere gelöscht.

**Kennzahlen (gegen Live-JSON nachgerechnet, stimmen auf alle Stellen)**
```
potential_decks(A, C) = Decks von Commander C, die Karte A spielen KÖNNTEN
                        (Color Identity passt, Deck nach A's Preview-Datum aktualisiert, aktive Filter)
inclusion = num_decks / potential_decks                       # p_cmd
p_base    = Anteil der Decks derselben Color Identity, die A spielen
synergy   = p_cmd − p_base                                    # −1 … +1
lift      = p_cmd / p_base                                    # seit Okt 2026 auf Commander-Seiten
```
- „Top Cards“ sind nach `inclusion` sortiert. „High Synergy“ (heute „High Lift“) ist nach synergy bzw. lift sortiert.
- Card-zu-Card-Lift: `P(A∩B) / (P(A)·P(B))`, berechnet nur über Decks, deren Farben beide Karten erlauben.

**Themes:** Handgeschriebene Regeln pro Theme, also Schwellwerte auf Kartenzählungen („nicht wissenschaftlich“, laut FAQ). Kein Machine Learning, keine User-Tags.
**Budget:** Die billigsten bzw. teuersten 10 % der Decks eines Commanders.
**Brackets:** Es zählen nur Decks, bei denen der User das Bracket selbst gesetzt hat (bei Atraxa etwa 22 % der Decks).
**Salt:** Jährliche Umfrage (Skala 0–4, Durchschnitt). Haben wir nicht, brauchen wir nicht.
**Combos:** Kommen von Commander Spellbook, das nutzen wir bereits.

**Recs-Tool / Original-Algorithmus** (Don Miners Bot, MIT-Lizenz; Kopie in `github.com/bmanturner/edhrec-web` → `core.py`)
- User-basiertes kNN: Ähnlichkeit = Anzahl gemeinsamer Nicht-Land-Karten.
  - × 1,2 bei gleichem Commander, × Recency-Faktor (keine Strafe bis 90 Tage, danach Abfall mit 0,99^(Tage/366)).
  - Das Ergebnis wird quadriert, dann werden die Top 15 Nachbardecks genommen.
- Vorschläge: Karten der Nachbarn, gewichtet nach Ähnlichkeit. Kürzungsvorschläge: eigene Karten, die die Nachbarn nicht spielen.
- `kmeans.py` hat die Decks eines Commanders in Archetypen geclustert.

---

## 2. Legale Datenquellen (Ranking)

| Quelle | Status | Menge | Nutzen |
|---|---|---|---|
| **Moxfield** (Key per support@moxfield.com / Discord) | Legal nur mit Key; Cloudflare blockt Scripts | Sehr groß | **Hauptziel.** Unabhängig von EDHREC, vergibt nachweislich Keys (MPC Autofill, Dez 2024) |
| **Eigene User** (Opt-in „Deck anonym teilen“) | Sauber | Klein, wächst | Langfristig unabhängig |
| **Topdeck.gg API** (kostenloser Key, Attribution Pflicht) | Dokumentiert, 100 req/min | Zehntausende Turnierlisten | Gut für cEDH / Bracket 5; Listen oft als Moxfield-Links |
| **MTGJSON** (MIT) | Sauber | 198 Commander-Precons | Startbasis für Bracket 2 |
| **cEDH Decklist Database** (MIT) | Sauber | Einige hundert | Ergänzung für cEDH |
| **Scryfall** `oracle_cards` + `oracle_tags` | Nutzen wir schon | Nur Kartendaten | Rollen, Themes, inhaltsbasierte Empfehlungen |
| **Commander Spellbook** `variants.json` / API | MIT (Code), nutzen wir schon | Combos | Unverändert |
| Archidekt | AGB verbieten Bots; Schwesterfirma von EDHREC | Riesig | Nur mit schriftlicher Erlaubnis, bei Nein von EDHREC unwahrscheinlich |
| MTGGoldfish, TappedOut, Deckstats, AetherHub, MTGTop8, Melee, HF `moxfield-dump` | AGB verbieten es oder Daten sind gescrapt | — | **Nicht nutzen.** Cloudflare nie umgehen |

**Rechtliche Kurzfassung (DE/EU, keine Rechtsberatung)**
- Eine einzelne Deckliste ist kaum urheberrechtlich geschützt.
- Das echte Risiko ist das **Datenbankherstellerrecht** (§ 87b UrhG): Es verbietet, wesentliche Teile einer Datenbank zu übernehmen, auch durch wiederholtes, systematisches Kopieren kleiner Teile.
- Die Ausnahme für Text- und Data-Mining (§ 44b/§ 87c UrhG) greift nicht, wenn die Seite das ausgeschlossen hat. Ob AGB-Text als maschinenlesbarer Vorbehalt zählt, ist umstritten.
- Deshalb: Nur mit Erlaubnis oder eigenen Daten arbeiten. Nur **Aggregate** veröffentlichen (Prozentwerte), nie Rohlisten anderer Seiten weitergeben.

---

## 3. Zielarchitektur (alles kostenlos)

```
 Quellen                 Pipeline (GitHub Actions, wöchentlich)            App (Vercel Hobby)
 ─────────               ──────────────────────────────────────            ───────────────────
 Moxfield (Key)  ─┐      ingest → normalisieren (oracle_id) →             public/data/recs/
 Topdeck.gg      ─┤      validieren (100 Karten, Identity, Banlist) →     {commander}.json
 MTGJSON precons ─┼──▶   dedupen (Hash + 70 %-Overlap) →           ──▶   (statisch, CDN)
 eigene User     ─┘      DuckDB/Parquet → Statistik → JSON-Shards
     ▲                                                                     lib/recs/ Provider:
     └── Opt-in-Endpoint (Vercel Route → Neon Postgres Free) ◀──────────── edhrec | brewmance | off
```

**Warum diese Datenbanken**
- **DuckDB + Parquet** für die Auswertung: Eine einzelne Datei, läuft lokal und in GitHub Actions, kostet nichts. Co-Occurrence- und Inclusion-Abfragen über 100k+ Decks sind damit reines SQL und dauern Sekunden. Die Rohdecks liegen als Parquet in einem privaten Speicher (Actions-Cache bzw. Release-Asset eines privaten Repos), **nicht im Deployment**.
- **Neon Postgres (Free, über den Vercel Marketplace)** nur für eingehende User-Decks: 0,5 GB reichen für mehr als 1 Mio. Decks als `int[]` von Karten-Indizes.
- **Ausgabe als statisches JSON** wie das bestehende `public/data/commanders.json`: Kein Laufzeit-Upstream, kein Rate-Limit, und das Vercel-CDN cacht. Es bekommen nur Commander eine Datei, die mindestens N Decks haben. Pro Datei etwa 300 Karten × (Kartenindex, inclusion, synergy), also nur wenige KB.

---

## 4. Algorithmen (Stufe für Stufe, auch bei wenig Daten tragfähig)

**Stufe 0 – ohne Deckdaten (inhaltsbasiert)**
- `fallbackCandidates` in `lib/server/candidates.ts:126` gibt es schon (Regex-Themes, Tribes, `edhrecRank`). Verbessern:
  - Rollen und Themes über Scryfall-Tagger (`lib/tagging/roles.ts`, `lib/tagging/archetypes.ts`) statt Regex.
  - Score = Tag-Überschneidung zwischen Commander und Karte (gewichtet wie TF-IDF), dazu Popularität.
- **Achtung:** `edhrec_rank` kommt zwar über Scryfall, stammt aber aus EDHREC. Er läuft unter Scryfalls Policy und ist vermutlich okay. Für vollständige Unabhängigkeit ersetzen wir ihn später durch einen eigenen Popularitätsrang (Anteil der Decks, die die Karte spielen).

**Stufe 1 – Commander-Statistik (EDHREC-Formel 1:1 nachgebaut)**
- `potential_decks`: Nur Decks zählen, deren Identity die Karte erlaubt und die nach dem Release der Karte zuletzt aktualisiert wurden (Release-Datum aus Scryfall).
- `inclusion`, `synergy` und `lift` wie in Abschnitt 1, wobei `p_base` pro Color Identity berechnet wird.
- **Wenig Daten → Bayes-Glättung (das ist entscheidend):**
  ```
  p_cmd_smooth = (num_decks + α · p_prior) / (potential_decks + α)      α ≈ 20
  p_prior      = gewichteter Mix aus: ähnliche Commander (gleiche Identity + geteilte Archetyp-Tags)
                 → Archetyp-Rate in der Identity → p_base
  ```
  - Ein Commander mit 12 Decks erbt so vernünftige Werte von „Tokens in Selesnya“ und rauscht nicht.
  - Ab etwa 200 Decks dominieren die echten Daten.
- Durchschnittliche Länder: Median der Landzahl in den Decks des Commanders.
- `MIN_BRACKET_SAMPLE` (40) bleibt als Schwelle für Bracket-Seiten.

**Stufe 2 – Themes und Brackets ohne User-Tags**
- Themes: Regel-Klassifikator auf Tagger-Zählungen pro Deck (z. B. ≥ 12 Karten mit `otag:token-generator` ⇒ Tokens). Das ist dieselbe Idee wie bei EDHREC. Die Definitionen kommen aus `lib/tagging/archetypes.ts` (Feld `edhrec:` fällt weg).
- Bracket: Vom User gesetztes Bracket, sonst eine Heuristik nach den offiziellen Regeln: Anzahl Game Changer (`game_changer` haben wir schon), dazu 2-Karten-Combos aus Spellbook, Extra Turns und Mass Land Denial. Alternativ `estimate-bracket` von Spellbook.

**Stufe 3 – Deck-basierte Empfehlungen („Recs“) und Card-zu-Card-Lift**
- Card-zu-Card-Lift innerhalb einer Identity, nur für Karten mit mindestens 30 Decks (Paare sparse in DuckDB).
- Damit wird der Swipe-Stapel adaptiv: Nach jedem Rechts-Swipe steigen Karten mit hohem Lift zu den schon gewählten Karten.
- Alternativ Miners kNN aus `core.py` nachbauen (Ähnlichkeit gemeinsamer Karten, k = 15). Lohnt sich erst ab etwa 10k Decks.

**Qualitätsmessung**
- Hold-out-Test: Aus echten Decks 10 Karten entfernen, prüfen, wie viele davon in den Top 50 der Empfehlungen landen (Recall@50).
- Vergleichswert: Das Paper bzw. Modell `nsaroiu/mtg-deck-completion` kommt auf 0,36–0,57.

---

## 5. Umsetzung in Phasen

**Phase A – sofort, unabhängig von EDHRECs Antwort (etwa 1 Tag)** ✅ erledigt am 2026-10-23
- Umsetzung: `lib/recs/source.ts` (`RECS_SOURCE`, Standard `edhrec`, unbekannte Werte = `off`), `lib/recs/provider.ts` (`loadCommanderStats`), `lib/recs/types.ts` (`CommanderStats`). Getestet mit dem Playwright-Smoke-Test bei `RECS_SOURCE=off`.
- Die Quelle `brewmance` kommt mit Phase D dazu, als weiterer `case` in `loadCommanderStats`.
1. Provider-Abstraktion `lib/recs/`, die einen neutralen Typ `CommanderStats` liefert (heute `EdhrecCommanderPage`, `lib/edhrec/types.ts:22-46`). `loadPage` in `lib/server/candidates.ts:35` ruft dann den Provider auf statt direkt `fetchCommanderPage`.
2. Env-Flag `RECS_SOURCE=edhrec|brewmance|off` als Off-Switch. Bei `off` läuft alles über den Fallback.
3. Build-Scrape in `scripts/build-card-db.ts:294-340` hinter dasselbe Flag legen.
4. `source`-Texte in der UI neutral halten („N EDHREC decks“ → je nach Quelle). Betroffen sind `swipe-screen.tsx`, `commander-setup.tsx` und `bracket-picker.tsx`.

**Phase B – Daten anfragen (parallel, nur Mails)**
- Moxfield: support@moxfield.com bzw. Discord. Inhalt: nicht-kommerziell, nur Aggregate, keine Weitergabe von Listen, ≤ 30 req/min, Backlink.
- Topdeck.gg: Key auf `/developers` holen, Attribution im Footer und auf der About-Seite.
- Archidekt nur fragen, falls EDHRECs Nein sich ausdrücklich nicht auf Archidekt bezieht.

**Phase C – Pipeline (etwa 3–5 Tage)**
- `scripts/recs/ingest-*.ts` pro Quelle → `normalize.ts` (Namen → `oracle_id` über `data/cards.json`) → `validate.ts` → `dedupe.ts` → `stats.ts` (DuckDB-SQL) → `emit.ts` (JSON-Shards nach `public/data/recs/`).
- Start mit MTGJSON-Precons und Topdeck-Listen, damit die Pipeline end-to-end steht, bevor Moxfield antwortet.
- GitHub Action analog zu `.github/workflows/refresh-card-data.yml`, wöchentlich. Die Rohdaten bleiben außerhalb des Repos.

**Phase D – App auf eigene Daten umstellen (etwa 1–2 Tage)**
- Provider `brewmance` liest `public/data/recs/{slug}.json`. `template.ts` (`profilePool`, `EDHREC_BLEND`) und `score.ts` bleiben unverändert, weil die Felder gleich heißen.
- Quiz: `edhrecThemes` / `edhrecDecks` (`lib/cards/types.ts:88-91`) aus den eigenen Daten befüllen.

**Phase E – Eigene User als Datenquelle (etwa 2 Tage)**
- Beim Fertigstellen eines Decks ein Opt-in-Button „Deck anonym teilen, um Empfehlungen zu verbessern“. Kein Default-Häkchen.
- Gespeichert werden nur Commander-ID, Karten-IDs, Bracket und Monat. Kein Name, kein Freitext, keine IP in der DB. Dedupe per Hash, Rate-Limit.
- Datenschutzerklärung (`app/datenschutz/page.tsx`) ergänzen.
- Optional: Aggregat-Datensatz unter CC BY 4.0 veröffentlichen, nach dem Vorbild von 17lands.

---

## 6. Ehrliche Erwartung

| Szenario | Decks | Qualität |
|---|---|---|
| Nur Stufe 0 (keine Decks) | 0 | Brauchbar für Staples und Rollen, schwach bei Nischen-Synergien |
| Precons + Topdeck + erste User | ~5–30k | Gut bei Top-Commandern und cEDH, mit Glättung okay für den Rest |
| + Moxfield-Key | 100k+ | Nah an EDHREC |

## Kritische Dateien
- `lib/server/candidates.ts` (Provider-Aufruf, Fallback), `lib/edhrec/fetch-commander.ts`, `lib/edhrec/types.ts`
- `scripts/build-card-db.ts` (Build-Scrape, Tagger-Indizes wiederverwenden)
- `lib/tagging/archetypes.ts`, `lib/tagging/roles.ts` (Theme-Regeln, Rollen)
- `lib/deckbuilder/template.ts`, `lib/deckbuilder/score.ts` (bleiben, konsumieren dieselben Felder)
- neu: `lib/recs/`, `scripts/recs/`, `public/data/recs/`

## Verifikation
- Phase A: `RECS_SOURCE=off pnpm dev`. Swipe-Stapel und Commander-Setup laufen ohne einen einzigen Request an `json.edhrec.com` (Network-Tab bzw. Server-Logs prüfen). Den bestehenden Playwright-Smoke-Test mit dem Flag laufen lassen.
- Phase C: Für Atraxa mit Precon- und Topdeck-Daten `inclusion` und `synergy` berechnen und mit Stichproben vergleichen. Den Recall@50-Hold-out-Test als Script mitliefern.
- Phase D: Eine Swipe-Session mit `RECS_SOURCE=brewmance` im Browser-Preview, mit Screenshot.

## Nächster Schritt
Phase B (Mails an Moxfield und Topdeck.gg), sobald klar ist, wie EDHREC antwortet.
