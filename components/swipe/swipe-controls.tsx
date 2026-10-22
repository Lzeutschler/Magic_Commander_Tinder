"use client";

import { Heart, Star, Undo2, X } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useEffect } from "react";

import { CardBack } from "@/components/card/card-back";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Card } from "@/lib/cards/types";
import type { SwipeDecision } from "@/lib/deckbuilder/session";
import { cn } from "@/lib/utils";

import { SwipeCard } from "./swipe-card";

/** Card stack with the top card draggable. `lastDecision` steers the exit animation. */
export function SwipeStack({
  card,
  cardKey,
  lastDecision,
  onDecision,
}: {
  card: Pick<Card, "name" | "image" | "manaCost" | "typeLine" | "oracleText">;
  cardKey: string;
  lastDecision: SwipeDecision | null;
  onDecision: (decision: SwipeDecision) => void;
}) {
  return (
    <div className="relative aspect-[488/680] w-[min(340px,80vw,calc((100dvh-16rem)*0.7176))] min-w-48">
      <CardBack className="absolute inset-0 translate-x-3 translate-y-3 rotate-3 opacity-50" />
      <CardBack className="absolute inset-0 translate-x-1.5 translate-y-1.5 rotate-1 opacity-80" />
      <AnimatePresence custom={lastDecision} initial={false}>
        <SwipeCard key={cardKey} card={card} onDecision={onDecision} />
      </AnimatePresence>
    </div>
  );
}

/** Undo, pass, maybe and pick buttons below a swipe stack. */
export function SwipeButtons({
  onDecision,
  onUndo,
  canUndo,
  pickLabel = "Pick",
}: {
  onDecision: (decision: SwipeDecision) => void;
  onUndo: () => void;
  canUndo: boolean;
  pickLabel?: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <RoundButton label="Undo (Z)" onClick={onUndo} disabled={!canUndo} className="size-11">
        <Undo2 className="size-5" />
      </RoundButton>
      <RoundButton label="Pass (←)" onClick={() => onDecision("pass")} className="size-16 border-pass/60 text-pass hover:bg-pass/15">
        <X className="size-8" />
      </RoundButton>
      <RoundButton label="Maybe (↑)" onClick={() => onDecision("maybe")} className="size-12 border-maybe/60 text-maybe hover:bg-maybe/15">
        <Star className="size-5" />
      </RoundButton>
      <RoundButton label={`${pickLabel} (→)`} onClick={() => onDecision("pick")} className="size-16 border-pick/60 text-pick hover:bg-pick/15">
        <Heart className="size-8" />
      </RoundButton>
    </div>
  );
}

/** ← pass, ↑ maybe, → pick, Z or Backspace undo — ignored while typing in a field. */
export function useSwipeKeys(onDecision: (decision: SwipeDecision) => void, onUndo: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea")) return;
      if (e.key === "ArrowRight") onDecision("pick");
      else if (e.key === "ArrowLeft") onDecision("pass");
      else if (e.key === "ArrowUp") onDecision("maybe");
      else if (e.key === "Backspace" || e.key.toLowerCase() === "z") onUndo();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
}

function RoundButton({
  label,
  className,
  children,
  ...props
}: { label: string } & React.ComponentProps<"button">) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={label}
            className={cn(
              "grid place-items-center rounded-full border-2 border-white/15 bg-card/80 shadow-lg shadow-black/40 transition hover:scale-110 active:scale-95 disabled:pointer-events-none disabled:opacity-40",
              className,
            )}
            {...props}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
