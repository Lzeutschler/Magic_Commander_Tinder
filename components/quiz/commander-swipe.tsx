"use client";

import { ListChecks, Loader2, RotateCcw, Sparkles, SquarePen } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { CardHoverPreview } from "@/components/card/card-hover-preview";
import { ColorIdentity, ManaCost } from "@/components/card/mana";
import { SwipeButtons, SwipeStack, useSwipeKeys } from "@/components/swipe/swipe-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { identityName } from "@/lib/cards/colors";
import { cardImageUrl } from "@/lib/cards/image";
import type { SwipeDecision } from "@/lib/deckbuilder/session";
import { FRANCHISE_LABELS, franchiseOf } from "@/lib/quiz/franchises";
import { QUESTIONS } from "@/lib/quiz/questions";
import { topArchetypes } from "@/lib/quiz/scoring";
import type { PopularityMode, ScoredCommander, Track } from "@/lib/quiz/types";
import { ARCHETYPE_LABELS } from "@/lib/tagging/archetypes";
import { cn } from "@/lib/utils";
import { useQuizStore } from "@/stores/quiz";

import { matchPercent, useQuizRanking } from "./use-quiz-ranking";

const POPULARITY_OPTIONS: { id: PopularityMode; label: string }[] = [
  { id: "popular", label: "Popular" },
  { id: "balanced", label: "Balanced" },
  { id: "hidden", label: "Hidden gems" },
];

export function CommanderSwipe({ track }: { track: Track }) {
  const { ranked, byId, topScore, isLoading, error } = useQuizRanking(track);
  const decisions = useQuizStore((s) => s.decisions);
  const limit = useQuizStore((s) => s.limit);
  const decide = useQuizStore((s) => s.decide);
  const undoDecision = useQuizStore((s) => s.undo);
  const showShortlist = useQuizStore((s) => s.showShortlist);
  const keepSwiping = useQuizStore((s) => s.keepSwiping);
  const [lastDecision, setLastDecision] = useState<SwipeDecision | null>(null);

  const decided = useMemo(() => new Set(decisions.map((d) => d.commanderId)), [decisions]);
  const queue = useMemo(() => ranked.filter((r) => !decided.has(r.commander.id)), [ranked, decided]);
  const roundDone = decisions.length >= limit || (ranked.length > 0 && queue.length === 0);
  const current = roundDone ? null : (queue[0] ?? null);
  const shortlist = decisions.filter((d) => d.decision !== "pass").map((d) => ({ ...d, scored: byId.get(d.commanderId) }));

  // Warm the image cache for the next few commanders.
  useEffect(() => {
    for (const { commander } of queue.slice(1, 6)) {
      if (commander.image) new Image().src = cardImageUrl(commander.image, "large");
    }
  }, [queue]);

  const decideCurrent = (decision: SwipeDecision) => {
    if (!current) return;
    setLastDecision(decision);
    decide(current.commander.id, decision);
  };
  const undo = () => {
    setLastDecision(null);
    undoDecision();
  };
  useSwipeKeys(decideCurrent, undo);

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="size-8 animate-spin text-gold" />
        Finding commanders that fit you…
      </div>
    );
  }
  if (error) return <p className="p-8 text-center text-destructive">Could not load commanders: {error.message}</p>;

  return (
    <div className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-6 lg:grid-cols-[280px_1fr_320px]">
      <aside className="order-3 space-y-5 lg:order-1">
        <AnswerSummary track={track} />
      </aside>

      <section className="order-1 flex flex-col items-center gap-5 select-none lg:order-2">
        <div className="flex w-full max-w-md flex-col items-center gap-3">
          <PopularityToggle />
          <p className="text-sm text-muted-foreground tabular-nums" data-testid="commander-count">
            {roundDone ? "Round complete" : `Commander ${decisions.length + 1} of ${limit}`}
          </p>
        </div>

        {current ? (
          <>
            <SwipeStack card={current.commander} cardKey={current.commander.id} lastDecision={lastDecision} onDecision={decideCurrent} />
            <SwipeButtons onDecision={decideCurrent} onUndo={undo} canUndo={decisions.length > 0} pickLabel="Shortlist" />
            <p className="hidden text-xs text-muted-foreground sm:block">Right = shortlist · Up = maybe · Left = pass · Z to undo</p>
          </>
        ) : (
          <RoundDone
            seen={decisions.length}
            shortlisted={shortlist.length}
            canContinue={queue.length > 0}
            onShortlist={showShortlist}
            onKeepSwiping={keepSwiping}
            onUndo={undo}
          />
        )}
      </section>

      <aside className="order-2 space-y-5 lg:order-3">
        {current && <WhyThisFits scored={current} topScore={topScore} />}

        <div className="panel space-y-3 p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Your shortlist</span>
            <span className="text-xs text-muted-foreground" data-testid="shortlist-count">
              {shortlist.length}
            </span>
          </div>
          {shortlist.length === 0 ? (
            <p className="text-xs text-muted-foreground">Swipe right on commanders you like.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {shortlist
                .slice(-6)
                .reverse()
                .map(({ commanderId, decision, scored }) =>
                  scored ? (
                    <CardHoverPreview key={commanderId} card={scored.commander}>
                      <li className="flex items-center justify-between gap-2 rounded px-1.5 py-1 hover:bg-white/5">
                        <span className={cn("truncate", decision === "maybe" && "text-maybe")}>{scored.commander.name}</span>
                        <ColorIdentity colors={scored.commander.colorIdentity} />
                      </li>
                    </CardHoverPreview>
                  ) : null,
                )}
            </ul>
          )}
          <Button variant="outline" className="w-full" onClick={showShortlist} disabled={shortlist.length === 0}>
            <ListChecks /> Review shortlist
          </Button>
        </div>
      </aside>
    </div>
  );
}

function WhyThisFits({ scored, topScore }: { scored: ScoredCommander; topScore: number }) {
  const { commander, reasons } = scored;
  const franchise = franchiseOf(commander.set);
  return (
    <div className="panel space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-heading text-lg leading-tight font-bold">{commander.name}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{commander.typeLine}</p>
        </div>
        <ManaCost cost={commander.manaCost} className="shrink-0 pt-1" />
      </div>
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-gold/10 px-3 py-1.5 text-center">
          <div className="font-heading text-2xl font-bold text-gold">{matchPercent(scored.score, topScore)}%</div>
          <div className="text-[10px] tracking-wider text-muted-foreground uppercase">match</div>
        </div>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ColorIdentity colors={commander.colorIdentity} />
            {identityName(commander.colorIdentity)}
          </div>
          {commander.edhrecDecks !== null && <div>{commander.edhrecDecks.toLocaleString("en-US")} decks on EDHREC</div>}
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">Why this fits</h3>
        <ul className="space-y-1.5 text-sm" data-testid="fit-reasons">
          {(reasons.length ? reasons.map((r) => r.text) : ["A solid all-rounder for your answers"]).map((text) => (
            <li key={text} className="flex gap-2">
              <Sparkles className="mt-0.5 size-3.5 shrink-0 text-gold" />
              {text}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {topArchetypes(commander).map((id) => (
          <Badge key={id} variant="secondary">
            {ARCHETYPE_LABELS[id]}
          </Badge>
        ))}
        {franchise !== "magic" && <Badge className="bg-gold/20 text-gold">{FRANCHISE_LABELS[franchise]}</Badge>}
        {commander.partner && <Badge variant="outline">Partner</Badge>}
      </div>
    </div>
  );
}

function PopularityToggle() {
  const popularity = useQuizStore((s) => s.popularity);
  const setPopularity = useQuizStore((s) => s.setPopularity);
  return (
    <div role="radiogroup" aria-label="Popularity" className="inline-flex rounded-full border border-white/10 bg-card/60 p-1 text-sm">
      {POPULARITY_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={popularity === option.id}
          onClick={() => setPopularity(option.id)}
          className={cn(
            "rounded-full px-3 py-1 text-muted-foreground transition hover:text-foreground",
            popularity === option.id && "bg-gold/15 text-gold",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function AnswerSummary({ track }: { track: Track }) {
  const answers = useQuizStore((s) => s.answers);
  const goToStep = useQuizStore((s) => s.goToStep);
  const restart = useQuizStore((s) => s.restart);
  const questions = QUESTIONS[track];

  return (
    <div className="panel space-y-4 p-5">
      <h2 className="font-heading font-bold">Your answers</h2>
      <ul className="space-y-2.5 text-sm">
        {questions.map((q, i) => {
          const labels = (answers[q.id] ?? []).map((id) => q.options.find((o) => o.id === id)?.label).filter(Boolean);
          const followUp = q.followUp && answers[q.followUp.id]?.[0];
          const followUpLabel = followUp ? q.followUp!.options.find((o) => o.id === followUp)?.label : null;
          return (
            <li key={q.id}>
              <button type="button" onClick={() => goToStep(i)} className="group w-full text-left">
                <div className="text-[11px] tracking-wide text-muted-foreground uppercase group-hover:text-foreground">{q.title}</div>
                <div className="text-foreground/90">
                  {labels.length ? labels.join(", ") : "No preference"}
                  {followUpLabel && followUpLabel !== "Any" ? ` · ${followUpLabel}` : ""}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-col gap-2">
        <Button variant="outline" onClick={() => goToStep(0)}>
          <SquarePen /> Change answers
        </Button>
        <Button variant="ghost" onClick={restart} className="text-muted-foreground">
          <RotateCcw /> Start over
        </Button>
      </div>
    </div>
  );
}

function RoundDone({
  seen,
  shortlisted,
  canContinue,
  onShortlist,
  onKeepSwiping,
  onUndo,
}: {
  seen: number;
  shortlisted: number;
  canContinue: boolean;
  onShortlist: () => void;
  onKeepSwiping: () => void;
  onUndo: () => void;
}) {
  return (
    <div className="panel flex w-full max-w-md flex-col items-center gap-4 p-8 text-center">
      <Sparkles className="size-10 text-gold" />
      <h2 className="text-2xl font-bold">{shortlisted ? "Nice picks!" : "Nothing caught your eye?"}</h2>
      <p className="text-muted-foreground">
        You looked at {seen} commanders and kept {shortlisted}.{" "}
        {shortlisted ? "Choose one from your shortlist to build a deck." : "Keep swiping or change your answers."}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="ghost" onClick={onUndo}>
          Undo
        </Button>
        {canContinue && (
          <Button variant="outline" onClick={onKeepSwiping}>
            Keep swiping
          </Button>
        )}
        <Button onClick={onShortlist} disabled={!shortlisted}>
          <ListChecks /> Review shortlist
        </Button>
      </div>
    </div>
  );
}
