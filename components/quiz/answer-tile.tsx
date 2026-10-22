"use client";

import { Check, Shuffle } from "lucide-react";

import { ManaSymbol } from "@/components/card/mana";
import { artCropUrl } from "@/lib/cards/image";
import type { AnswerOption } from "@/lib/quiz/types";
import { cn } from "@/lib/utils";

export type TileVariant = "large" | "normal" | "wide" | "tall" | "dense";

/** An answer as an art-crop tile; `dense` tiles show only the label. */
export function AnswerTile({
  option,
  selected,
  variant = "normal",
  onClick,
}: {
  option: AnswerOption;
  selected: boolean;
  variant?: TileVariant;
  onClick: () => void;
}) {
  const dense = variant === "dense";
  const large = variant === "large";
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "group relative isolate flex overflow-hidden rounded-xl border-2 border-white/10 bg-card text-left shadow-lg shadow-black/30 transition outline-none",
        "hover:-translate-y-0.5 hover:border-white/30 focus-visible:border-gold/70",
        {
          large: "aspect-[4/3] sm:aspect-[16/10]",
          normal: "aspect-[4/3]",
          wide: "aspect-[2/1] sm:aspect-[4/3]",
          tall: "aspect-[4/3] lg:aspect-[3/4]",
          dense: "aspect-[5/4]",
        }[variant],
        selected && "border-gold shadow-[0_0_28px] shadow-gold/25 hover:border-gold",
      )}
    >
      {option.art ? (
        // eslint-disable-next-line @next/next/no-img-element -- Scryfall serves pre-sized art crops
        <img
          src={artCropUrl(option.art)}
          alt=""
          loading="lazy"
          draggable={false}
          className="absolute inset-0 -z-10 size-full object-cover transition duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/[0.08] to-transparent">
          <Shuffle className={cn("absolute top-3 left-3 text-muted-foreground/70", dense ? "size-5" : "size-7")} />
        </div>
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/35 to-black/0" />

      {option.symbol && (
        <ManaSymbol symbol={option.symbol} className={cn("absolute top-2.5 left-2.5 drop-shadow-lg", dense ? "size-6" : "size-8")} />
      )}
      {selected && (
        <span className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-gold text-black shadow-md">
          <Check className="size-4" strokeWidth={3} />
        </span>
      )}

      <span className={cn("mt-auto flex flex-col gap-0.5", dense ? "p-2" : "p-3 sm:p-4")}>
        <span className={cn("font-heading leading-tight font-bold text-white drop-shadow", dense ? "text-xs sm:text-sm" : large ? "text-lg sm:text-2xl" : "text-sm sm:text-base")}>
          {option.label}
        </span>
        {option.description && !dense && (
          <span className={cn("line-clamp-2 text-white/75", large ? "text-sm sm:text-base" : "text-xs")}>{option.description}</span>
        )}
      </span>
    </button>
  );
}
