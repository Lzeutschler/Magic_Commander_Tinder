import { isLand } from "@/lib/cards/mana";
import type { Card } from "@/lib/cards/types";
import { deckStats, expandEntries } from "@/lib/decks/stats";
import { DECK_SIZE, type Deck } from "@/lib/decks/types";
import { seededRandom } from "@/lib/random";

import { fillBasics } from "./basics";
import { bracketViolation } from "./brackets";
import { scoreCandidate } from "./score";
import { deckTemplate, type DeckTemplate } from "./template";
import type { Candidate, CandidatePool } from "./types";

export type SwipeDecision = "pick" | "pass" | "maybe";
export type SwipePhase = "spells" | "lands" | "done";

export interface SwipeHistoryEntry {
  cardId: string;
  decision: SwipeDecision;
  phase: SwipePhase;
}

export interface SwipeSession {
  deckId: string;
  pool: Candidate[];
  basicLands: Card[];
  template: DeckTemplate;
  source: CandidatePool["source"];
  deckCount: number;
  phase: SwipePhase;
  history: SwipeHistoryEntry[];
  seed: number;
}

/** The next card is drawn at random from this many best-scored options so swiping feels fresh. */
const TOP_CHOICES = 5;

/** Starts swiping for `deck`; a deck that already has cards resumes in the matching phase. */
export function createSession(deck: Deck, pool: CandidatePool, seed: number): SwipeSession {
  const session: SwipeSession = {
    deckId: deck.id,
    pool: pool.candidates,
    basicLands: pool.basicLands,
    template: deckTemplate(deck.bracket, deck.commander.colorIdentity, pool.averageLands),
    source: pool.source,
    deckCount: pool.deckCount,
    phase: "spells",
    history: [],
    seed,
  };
  return { ...session, phase: nextPhase(session, deck) };
}

/** Candidates still on offer in the current phase that keep the deck within its bracket. */
function openCandidates(session: SwipeSession, deck: Deck): Candidate[] {
  if (session.phase === "done") return [];
  const seen = new Set(session.history.map((h) => h.cardId));
  const deckCards = expandEntries(deck.entries);
  const inDeck = new Set(deckCards.map((c) => c.id));
  const wantLands = session.phase === "lands";
  return session.pool.filter(
    (c) =>
      !seen.has(c.id) &&
      !inDeck.has(c.id) &&
      isLand(c) === wantLands &&
      bracketViolation(c, deckCards, deck.bracket) === null,
  );
}

export function rankCandidates(session: SwipeSession, deck: Deck): { candidate: Candidate; score: number }[] {
  const stats = deckStats(deck);
  return openCandidates(session, deck)
    .map((candidate) => ({ candidate, score: scoreCandidate(candidate, stats, session.template) }))
    .sort((a, b) => b.score - a.score);
}

export function nextCandidate(session: SwipeSession, deck: Deck): Candidate | null {
  const top = rankCandidates(session, deck).slice(0, TOP_CHOICES);
  if (!top.length) return null;

  // Weighted pick: better scores are likelier, deterministic for a given session state.
  const min = top[top.length - 1].score;
  const weights = top.map((t) => (t.score - min + 0.1) ** 2);
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = seededRandom(session.seed + session.history.length * 7919)() * total;
  for (let i = 0; i < top.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return top[i].candidate;
  }
  return top[0].candidate;
}

function nextPhase(session: SwipeSession, deck: Deck): SwipePhase {
  const stats = deckStats(deck);
  let phase = session.phase;
  if (phase === "spells" && (stats.nonlands >= DECK_SIZE - session.template.lands || !openCandidates(session, deck).length)) {
    phase = "lands";
  }
  if (phase === "lands") {
    const atTarget = stats.lands >= session.template.nonbasicLands || stats.total >= DECK_SIZE;
    if (atTarget || !openCandidates({ ...session, phase }, deck).length) phase = "done";
  }
  return phase;
}

export function decide(
  session: SwipeSession,
  deck: Deck,
  card: Candidate,
  decision: SwipeDecision,
): { session: SwipeSession; deck: Deck } {
  const nextDeck: Deck = {
    ...deck,
    entries: decision === "pick" ? [...deck.entries, { card: stripCandidate(card), quantity: 1 }] : deck.entries,
    maybe: decision === "maybe" ? [...deck.maybe, stripCandidate(card)] : deck.maybe,
    updatedAt: Date.now(),
  };
  const nextSession: SwipeSession = {
    ...session,
    history: [...session.history, { cardId: card.id, decision, phase: session.phase }],
  };
  return { session: { ...nextSession, phase: nextPhase(nextSession, nextDeck) }, deck: nextDeck };
}

export function undo(session: SwipeSession, deck: Deck): { session: SwipeSession; deck: Deck } {
  const last = session.history.at(-1);
  if (!last) return { session, deck };
  return {
    session: { ...session, history: session.history.slice(0, -1), phase: last.phase },
    deck: {
      ...deck,
      entries: last.decision === "pick" ? deck.entries.filter((e) => e.card.id !== last.cardId) : deck.entries,
      maybe: last.decision === "maybe" ? deck.maybe.filter((c) => c.id !== last.cardId) : deck.maybe,
      updatedAt: Date.now(),
    },
  };
}

export function skipToLands(session: SwipeSession, deck: Deck): SwipeSession {
  const skipped = { ...session, phase: "lands" as const };
  return { ...skipped, phase: nextPhase(skipped, deck) };
}

/** Completes the deck with basic lands. */
export function finish(session: SwipeSession, deck: Deck): Deck {
  return {
    ...deck,
    entries: fillBasics(deck.entries, deck.commander.colorIdentity, session.basicLands),
    updatedAt: Date.now(),
  };
}

/** Deck entries store plain cards, without the swipe scores. */
function stripCandidate(candidate: Candidate): Card {
  const { synergy: _synergy, inclusion: _inclusion, ...card } = candidate;
  return card;
}
