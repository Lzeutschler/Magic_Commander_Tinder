"use client";

import { useEffect } from "react";

import { CircleNotchIcon } from "@/components/icons";
import { artCropUrl } from "@/lib/cards/image";
import { QUESTIONS, TRACK_QUESTION } from "@/lib/quiz/questions";
import type { Track } from "@/lib/quiz/types";
import { useQuizHydrated, useQuizStore } from "@/stores/quiz";

import { CommanderSwipe } from "./commander-swipe";
import { QuestionStep } from "./question-step";
import { Shortlist } from "./shortlist";

/** The quiz flow: experience level → seven questions → commander swipe → shortlist → deck. */
export function QuizScreen() {
  const hydrated = useQuizHydrated();
  const track = useQuizStore((s) => s.track);
  const phase = useQuizStore((s) => s.phase);
  const chooseTrack = useQuizStore((s) => s.chooseTrack);

  if (!hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <CircleNotchIcon className="size-8 animate-spin text-ember" />
      </div>
    );
  }

  if (!track) {
    return (
      <QuestionStep
        question={TRACK_QUESTION}
        selected={[]}
        onChange={([id]) => chooseTrack(id as Track)}
        onNext={() => {}}
      />
    );
  }
  if (phase === "swipe") return <CommanderSwipe track={track} />;
  if (phase === "shortlist") return <Shortlist track={track} />;
  return <QuestionFlow track={track} />;
}

function QuestionFlow({ track }: { track: Track }) {
  const questions = QUESTIONS[track];
  const step = useQuizStore((s) => Math.min(s.step, questions.length - 1));
  const answers = useQuizStore((s) => s.answers);
  const answer = useQuizStore((s) => s.answer);
  const goToStep = useQuizStore((s) => s.goToStep);
  const back = useQuizStore((s) => s.back);
  const startSwiping = useQuizStore((s) => s.startSwiping);

  const question = questions[step];
  const last = step === questions.length - 1;

  // Load the next question's art while this one is answered.
  useEffect(() => {
    for (const option of questions[step + 1]?.options ?? []) {
      if (option.art) new Image().src = artCropUrl(option.art);
    }
  }, [questions, step]);

  const next = () => {
    window.scrollTo({ top: 0 });
    if (last) startSwiping();
    else goToStep(step + 1);
  };

  return (
    <QuestionStep
      key={question.id}
      question={question}
      selected={answers[question.id] ?? []}
      followUpSelected={question.followUp ? (answers[question.followUp.id] ?? []) : []}
      onChange={(ids) => answer(question.id, ids)}
      onFollowUpChange={question.followUp ? (ids) => answer(question.followUp!.id, ids) : undefined}
      onNext={next}
      onBack={back}
      progress={{ step: step + 1, total: questions.length }}
      nextLabel={last ? "Show my commanders" : "Next"}
    />
  );
}
