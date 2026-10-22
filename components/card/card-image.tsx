"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";

import { cardImageUrl, type ImageSize } from "@/lib/cards/image";
import type { Card } from "@/lib/cards/types";
import { cn } from "@/lib/utils";

import { ManaCost } from "./mana";

interface CardImageProps {
  card: Pick<Card, "name" | "image" | "manaCost" | "typeLine" | "oracleText">;
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
    <div className={cn("group/card relative card-aspect overflow-hidden rounded-[4.75%] bg-muted shadow-lg shadow-black/40", className)}>
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
          className="absolute top-[9%] right-[6%] grid size-8 place-items-center rounded-full bg-black/60 text-white opacity-80 transition hover:opacity-100"
          aria-label="Flip card"
        >
          <RefreshCw className="size-4" />
        </button>
      )}
    </div>
  );
}

function TextCard({ card, className }: Pick<CardImageProps, "card" | "className">) {
  return (
    <div className={cn("card-aspect flex flex-col gap-2 overflow-hidden rounded-[4.75%] border-4 border-black bg-card p-3 text-xs", className)}>
      <div className="flex items-start justify-between gap-2 font-semibold">
        <span>{card.name}</span>
        <ManaCost cost={card.manaCost} />
      </div>
      <div className="border-y border-white/10 py-1 text-muted-foreground">{card.typeLine}</div>
      <p className="whitespace-pre-line">{card.oracleText}</p>
    </div>
  );
}
