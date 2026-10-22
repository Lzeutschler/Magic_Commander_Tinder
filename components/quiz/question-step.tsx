"use client";

import { useRef } from "react";

import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import type { Question } from "@/lib/quiz/types";
import { cn } from "@/lib/utils";

import { AnswerTile } from "./answer-tile";

/** Delay before a single-choice answer advances, so the selection is visible. */
const ADVANCE_DELAY_MS = 220;

/**
 * One quiz question. Single-choice questions advance on click; multi-choice ones toggle answers
 * (up to `max`, exclusive answers clear the rest) and advance with the Next button.
 */
export function QuestionStep({
  question,
  selected,
  followUpSelected = [],
  onChange,
  onFollowUpChange,
  onNext,
  onBack,
  progress,
  nextLabel = "Next",
}: {
  question: Question;
  selected: string[];
  followUpSelected?: string[];
  onChange: (optionIds: string[]) => void;
  onFollowUpChange?: (optionIds: string[]) => void;
  onNext: () => void;
  onBack?: () => void;
  progress?: { step: number; total: number };
  nextLabel?: string;
}) {
  const advancing = useRef<ReturnType<typeof setTimeout> | null>(null);
  const single = question.max === 1;
  const dense = question.options.length > 9;
  const large = question.options.length <= 2;
  // Color answers are a compact row of six on wide screens.
  const symbols = question.options.every((o) => o.symbol);

  const toggle = (optionId: string) => {
    if (single) {
      onChange([optionId]);
      if (advancing.current) clearTimeout(advancing.current);
      advancing.current = setTimeout(onNext, ADVANCE_DELAY_MS);
      return;
    }
    const option = question.options.find((o) => o.id === optionId)!;
    if (selected.includes(optionId)) return onChange(selected.filter((id) => id !== optionId));
    if (option.exclusive) return onChange([optionId]);
    const exclusive = new Set(question.options.filter((o) => o.exclusive).map((o) => o.id));
    // At the limit, the oldest answer makes room for the new one.
    const others = selected.filter((id) => !exclusive.has(id));
    onChange([...others.slice(Math.max(0, others.length - question.max + 1)), optionId]);
  };

  const canContinue = question.optional || selected.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 pt-6 pb-28 sm:pt-10">
      {progress && (
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 text-muted-foreground">
              <ArrowLeftIcon /> Back
            </Button>
          )}
          <div className="h-1.5 flex-1 overflow-hidden rounded-xs bg-ink shadow-[inset_0_1px_0_0_oklch(0_0_0/40%)]" aria-hidden>
            <div
              className="h-full bg-ember transition-[width] duration-500"
              style={{ width: `${(progress.step / progress.total) * 100}%` }}
            />
          </div>
          <span className="eyebrow text-muted-foreground tabular-nums" data-testid="quiz-progress">
            {progress.step} / {progress.total}
          </span>
        </div>
      )}

      <header className="space-y-2 text-center">
        <h1 className="text-4xl leading-tight font-extrabold sm:text-5xl">{question.title}</h1>
        {question.subtitle && <p className="mx-auto max-w-2xl text-muted-foreground">{question.subtitle}</p>}
      </header>

      <div
        role="group"
        aria-label={question.title}
        className={cn(
          "grid gap-3 sm:gap-4",
          large && "mx-auto w-full max-w-4xl sm:grid-cols-2",
          !large && question.options.length === 3 && "mx-auto w-full max-w-4xl sm:grid-cols-3",
          !large && question.options.length === 4 && "grid-cols-2 lg:grid-cols-4",
          !large && !dense && question.options.length > 4 && "grid-cols-2 sm:grid-cols-3",
          !large && !dense && question.options.length > 4 && question.options.length % 3 !== 0 && "lg:grid-cols-4",
          symbols && "lg:grid-cols-6",
          dense && "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6",
        )}
      >
        {question.options.map((option) => (
          <AnswerTile
            key={option.id}
            option={option}
            selected={selected.includes(option.id)}
            variant={large ? "large" : dense ? "dense" : symbols ? "tall" : question.options.length === 3 ? "wide" : "normal"}
            onClick={() => toggle(option.id)}
          />
        ))}
      </div>

      {question.followUp && onFollowUpChange && (
        <div className="flex flex-col items-center gap-3">
          <h2 className="eyebrow text-muted-foreground">{question.followUp.title}</h2>
          <div role="radiogroup" aria-label={question.followUp.title} className="flex flex-wrap justify-center gap-2">
            {question.followUp.options.map((option) => {
              const active = followUpSelected.includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onFollowUpChange(active ? [] : [option.id])}
                  className={cn(
                    "min-h-10 rounded-md border border-border bg-card px-4 py-1.5 text-sm font-medium shadow-sm transition hover:border-input hover:bg-accent",
                    active && "border-ember bg-ember/12 hover:border-ember hover:bg-ember/12",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!single && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-ink px-4 py-3 shadow-[0_-1px_0_0_oklch(0_0_0/50%)]">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">
              {selected.length ? `${selected.length} of ${question.max} picked` : question.optional ? "No preference? Just continue." : `Pick up to ${question.max}`}
            </span>
            <Button size="lg" onClick={onNext} disabled={!canContinue}>
              {selected.length === 0 && question.optional ? "Skip" : nextLabel}
              <ArrowRightIcon />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
