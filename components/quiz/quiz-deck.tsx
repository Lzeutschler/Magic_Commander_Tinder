"use client";

import { AnimatePresence } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { CardBack } from "@/components/card/card-back";
import { HeartBurst } from "@/components/cauldron";
import { ArrowLeftIcon, ArrowRightIcon, ArrowUpIcon, ArrowUUpLeftIcon, HeartIcon, XIcon } from "@/components/icons";
import { RoundButton, useSwipeKeys } from "@/components/swipe/swipe-controls";
import { Button } from "@/components/ui/button";
import { artCropUrl } from "@/lib/cards/image";
import { deckProgress, nextCard, swipeFor, trackCard, type QuizCard } from "@/lib/quiz/deck";
import { QUESTIONS } from "@/lib/quiz/questions";
import type { Answers, Question, QuizChoice, Track } from "@/lib/quiz/types";
import { cn } from "@/lib/utils";
import { useQuizStore } from "@/stores/quiz";

import { QuizMatch } from "./quiz-match";
import { QuizSwipeCard, type SwipeDirection } from "./quiz-card";

/** Delay before a single-choice pick card flies off, so the tapped tile shows as picked. */
const AUTO_DONE_MS = 260;

const DIRECTIONS: Partial<Record<QuizChoice, SwipeDirection>> = {
  yes: "right",
  right: "right",
  done: "right",
  no: "left",
  left: "left",
  skip: "left",
  middle: "up",
};

/** The quiz as a deck of swipe cards: the track choice first, then cards that adapt to every answer. */
export function QuizDeck({ track }: { track: Track | null }) {
  const swipes = useQuizStore((s) => s.swipes);
  const chooseTrack = useQuizStore((s) => s.chooseTrack);
  const swipe = useQuizStore((s) => s.swipe);
  const undoSwipe = useQuizStore((s) => s.undoSwipe);
  const card = useMemo(() => (track ? nextCard(track, swipes) : trackCard()), [track, swipes]);

  const [last, setLast] = useState<{ card: string; choice: QuizChoice } | null>(null);
  const [picks, setPicks] = useState<{ card: string; answers: Answers }>({ card: "", answers: {} });
  const [hinted, setHinted] = useState<string[]>([]);
  const autoDone = useRef<ReturnType<typeof setTimeout> | null>(null);
  const picked = card && picks.card === card.id ? picks.answers : {};

  // Warm the art of the cards that can come next.
  useEffect(() => {
    const next = !card
      ? []
      : !track
        ? [nextCard("beginner", []), nextCard("advanced", [])]
        : choicesOf(card).map((choice) => nextCard(track, [...swipes, swipeFor(card, choice)]));
    for (const art of next.flatMap(artOf)) new Image().src = artCropUrl(art);
  }, [card, track, swipes]);

  const answer = (choice: QuizChoice) => {
    if (!card || !choicesOf(card).includes(choice)) return;
    if (choice === "done" && !picked[card.question.id]?.length) return;
    setLast({ card: card.id, choice });
    const hint = hintFor(card);
    setHinted((hints) => (hints.includes(hint) ? hints : [...hints, hint]));
    if (!track) {
      if (card.kind === "versus") chooseTrack((choice === "left" ? card.left : card.right).id as Track);
      return;
    }
    swipe(swipeFor(card, choice, picked));
  };
  const undo = () => {
    setLast(null);
    if (track) undoSwipe();
  };
  const toggle = (question: Pick<Question, "id" | "max" | "options">, optionId: string) => {
    if (!card) return;
    const current = picked[question.id] ?? [];
    const next = current.includes(optionId)
      ? current.filter((id) => id !== optionId)
      : [...current.slice(Math.max(0, current.length - question.max + 1)), optionId];
    const answers = { ...picked, [question.id]: next };
    setPicks({ card: card.id, answers });
    // A single-choice list is answered by the tap itself.
    if (autoDone.current) clearTimeout(autoDone.current);
    if (card.kind === "pick" && question.id === card.question.id && card.question.max === 1 && next.length) {
      autoDone.current = setTimeout(() => {
        setLast({ card: card.id, choice: "done" });
        swipe(swipeFor(card, "done", answers));
      }, AUTO_DONE_MS);
    }
  };

  useSwipeKeys((decision) => {
    if (!card) return;
    const kind = card.kind;
    if (decision === "pick") answer(kind === "versus" ? "right" : kind === "pick" ? "done" : "yes");
    else if (decision === "pass") answer(kind === "versus" ? "left" : kind === "pick" ? "skip" : "no");
    else answer("middle");
  }, undo);

  if (!card) return <QuizMatch track={track!} />;

  const progress = track ? deckProgress(track, card) : { step: 0, total: QUESTIONS.advanced.length };
  const exit = last ? (DIRECTIONS[last.choice] ?? null) : null;
  const canFinish = card.kind !== "pick" || (picked[card.question.id]?.length ?? 0) > 0;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center gap-4 px-4 pt-4 pb-8 select-none sm:gap-5 sm:pt-6">
      <div className="flex w-full items-center gap-3">
        <Button variant="ghost" size="sm" onClick={undo} disabled={!track} className="-ml-2 text-muted-foreground">
          <ArrowUUpLeftIcon /> Undo
        </Button>
        <div className="flex flex-1 gap-1" aria-hidden="true">
          {Array.from({ length: progress.total }, (_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full bg-ink shadow-[inset_0_1px_0_0_oklch(0_0_0/40%)] transition-colors duration-500",
                i < progress.step - 1 && "bg-brand",
                i === progress.step - 1 && "bg-brand/45",
              )}
            />
          ))}
        </div>
        <span className="ui-label w-10 text-right text-muted-foreground tabular-nums" data-testid="quiz-progress">
          {track ? `${progress.step} / ${progress.total}` : ""}
        </span>
      </div>

      <div className="relative aspect-[488/680] w-[min(400px,88vw,calc((100dvh-17rem)*0.7176))] min-w-60">
        <CardBack className="absolute inset-0 translate-x-3 translate-y-3 rotate-3 opacity-50" />
        <CardBack className="absolute inset-0 translate-x-1.5 translate-y-1.5 rotate-1 opacity-80" />
        <AnimatePresence custom={exit} initial={false}>
          <QuizSwipeCard
            key={card.id}
            card={card}
            picked={picked}
            onToggle={toggle}
            onSwipe={(direction) => answer(choiceFor(card, direction))}
          />
        </AnimatePresence>
        {last && (last.choice === "yes" || last.choice === "done") && <HeartBurst key={last.card} />}
      </div>

      <CardButtons card={card} canFinish={canFinish} onAnswer={answer} />
      {!hinted.includes(hintFor(card)) && <p className="text-center text-xs text-muted-foreground">{hintFor(card)}</p>}
    </div>
  );
}

function CardButtons({
  card,
  canFinish,
  onAnswer,
}: {
  card: QuizCard;
  canFinish: boolean;
  onAnswer: (choice: QuizChoice) => void;
}) {
  if (card.kind === "versus") {
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-2">
        <div className="grid w-full grid-cols-2 gap-2">
          <Button variant="outline" size="lg" onClick={() => onAnswer("left")} className="h-auto min-h-12 justify-start py-2 text-left whitespace-normal">
            <ArrowLeftIcon className="text-brand" /> {card.left.label}
          </Button>
          <Button variant="outline" size="lg" onClick={() => onAnswer("right")} className="h-auto min-h-12 justify-end py-2 text-right whitespace-normal">
            {card.right.label} <ArrowRightIcon className="text-brand" />
          </Button>
        </div>
        {card.middle && (
          <Button variant="ghost" size="sm" onClick={() => onAnswer("middle")} className="text-muted-foreground">
            <ArrowUpIcon className="text-maybe" /> {card.middle.label}
          </Button>
        )}
      </div>
    );
  }
  const pick = card.kind === "pick";
  return (
    <div className="flex items-center gap-6">
      <RoundButton label={pick ? "Skip (←)" : "No (←)"} onClick={() => onAnswer(pick ? "skip" : "no")} className="size-16 border-pass/70 text-pass hover:bg-pass/15">
        <XIcon className="size-8" />
      </RoundButton>
      {!(pick && card.question.max === 1) && (
        <RoundButton
          label={pick ? "Done (→)" : "Yes (→)"}
          onClick={() => onAnswer(pick ? "done" : "yes")}
          disabled={!canFinish}
          className="size-16 border-pick/70 text-pick hover:bg-pick/15"
        >
          <HeartIcon className="size-8" />
        </RoundButton>
      )}
    </div>
  );
}

/** How to answer the card; each hint shows until the first card it explains is answered. */
function hintFor(card: QuizCard): string {
  if (card.kind === "versus") return card.middle ? "Swipe toward your pick, or up for the one in between" : "Swipe toward your pick";
  if (card.kind === "pick") return card.question.max === 1 ? "Tap the one that speaks to you" : "Tap your favorites, then the heart";
  return "Swipe right for yes, left for no";
}

function choicesOf(card: QuizCard): QuizChoice[] {
  if (card.kind === "versus") return card.middle ? ["left", "right", "middle"] : ["left", "right"];
  if (card.kind === "pick") return ["done", "skip"];
  return ["yes", "no"];
}

function choiceFor(card: QuizCard, direction: SwipeDirection): QuizChoice {
  if (card.kind === "versus") return direction === "up" ? "middle" : direction;
  return direction === "right" ? "yes" : "no";
}

/** Art crops a card shows, to load them ahead. */
function artOf(card: QuizCard | null): string[] {
  if (!card) return [];
  const arts =
    card.kind === "yesno"
      ? [card.option.art]
      : card.kind === "gate"
        ? [card.art]
        : card.kind === "versus"
          ? [card.left.art, card.right.art]
          : card.question.options.map((o) => o.art);
  return arts.filter((art): art is string => Boolean(art));
}
