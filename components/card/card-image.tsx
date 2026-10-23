"use client";

import { useState } from "react";

import { ArrowsClockwiseIcon } from "@/components/icons";
import { cardImageUrl, type ImageSize } from "@/lib/cards/image";
import type { CardDisplay } from "@/lib/cards/types";
import { cn } from "@/lib/utils";

import { ManaCost } from "./mana";

interface CardImageProps {
  card: CardDisplay;
  size?: ImageSize;
  className?: string;
  /** Show a flip button for double-faced cards. */
  flippable?: boolean;
  eager?: boolean;
  draggable?: boolean;
}

/** A Magic card at the official 63×88 ratio, with a text fallback while Scryfall has no image. */
export function CardImage({ card, size = "normal", className, flippable, eager, draggable = false }: CardImageProps) {
  const [face, setFace] = useState<"front" | "back">("front");
  const [failed, setFailed] = useState(false);

  if (!card.image || failed) return <TextCard card={card} className={className} />;

  return (
    <div className={cn("group/card relative card-aspect overflow-hidden rounded-[4.75%] bg-muted shadow-lg", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- Scryfall serves pre-sized images */}
      <img
        src={cardImageUrl(card.image, size, face)}
        alt={card.name}
        loading={eager ? "eager" : "lazy"}
        draggable={draggable}
        onError={() => setFailed(true)}
        className="size-full object-cover select-none"
      />
      {flippable && card.image.doubleFaced && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setFace((f) => (f === "front" ? "back" : "front"));
          }}
          className="absolute top-[9%] right-[6%] grid size-10 place-items-center rounded-full border border-white/25 bg-ink/80 text-foreground shadow-md transition hover:bg-ink hover:text-brand"
          aria-label="Flip card"
        >
          <ArrowsClockwiseIcon className="size-5" />
        </button>
      )}
    </div>
  );
}

function TextCard({ card, className }: Pick<CardImageProps, "card" | "className">) {
  return (
    <div className={cn("card-aspect flex flex-col gap-2 overflow-hidden rounded-[4.75%] border-[5px] border-ink bg-[#d9dde6] p-3 text-xs text-ink", className)}>
      <div className="flex items-start justify-between gap-2 font-semibold">
        <span>{card.name}</span>
        <ManaCost cost={card.manaCost} />
      </div>
      <div className="border-y border-ink/20 py-1 text-ink/70">{card.typeLine}</div>
      <p className="whitespace-pre-line">{card.oracleText}</p>
    </div>
  );
}
