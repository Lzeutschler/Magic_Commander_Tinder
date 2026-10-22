"use client";

import { ManaSymbol } from "@/components/card/mana";
import { CheckIcon, ShuffleIcon } from "@/components/icons";
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
        "group relative isolate flex overflow-hidden rounded-xl border-2 border-border bg-card text-left shadow-md transition",
        "hover:-translate-y-0.5 hover:border-input",
        {
          large: "aspect-[4/3] sm:aspect-[16/10]",
          normal: "aspect-[4/3]",
          wide: "aspect-[2/1] sm:aspect-[4/3]",
          tall: "aspect-[4/3] lg:aspect-[3/4]",
          dense: "aspect-[5/4]",
        }[variant],
        selected && "border-brand shadow-[inset_0_0_0_1px_var(--brand),0_2px_0_0_oklch(0_0_0/50%)] hover:border-brand",
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
        <div className="absolute inset-0 -z-10 bg-[repeating-linear-gradient(60deg,rgb(142_162_255/8%)_0_1px,transparent_1px_10px)]">
          <ShuffleIcon className={cn("absolute top-3 left-3 text-muted-foreground/70", dense ? "size-5" : "size-7")} />
        </div>
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/45 to-ink/0" />

      {option.symbol && (
        <ManaSymbol symbol={option.symbol} className={cn("absolute top-2.5 left-2.5 drop-shadow-lg", dense ? "size-6" : "size-8")} />
      )}
      {selected && (
        <span className="absolute top-2 right-2 grid size-7 place-items-center rounded-sm bg-brand text-ink shadow-md">
          <CheckIcon className="size-4" />
        </span>
      )}

      <span className={cn("mt-auto flex flex-col gap-0.5", dense ? "p-2" : "p-3 sm:p-4")}>
        <span className={cn("font-heading leading-tight font-bold text-foreground drop-shadow-[0_1px_1px_oklch(0_0_0/80%)]", dense ? "text-sm sm:text-base" : large ? "text-xl sm:text-3xl" : "text-base sm:text-lg")}>
          {option.label}
        </span>
        {option.description && !dense && (
          <span className={cn("line-clamp-2 text-foreground/80", large ? "text-sm sm:text-base" : "text-xs sm:text-sm")}>{option.description}</span>
        )}
      </span>
    </button>
  );
}
