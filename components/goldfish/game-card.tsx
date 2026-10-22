"use client";

import { useDraggable } from "@dnd-kit/core";
import { motion } from "motion/react";

import { CardBack } from "@/components/card/card-back";
import { CardImage } from "@/components/card/card-image";
import { cardImageUrl } from "@/lib/cards/image";
import type { GameCard } from "@/lib/goldfish/types";
import { cn } from "@/lib/utils";

export interface CardHandlers {
  onClick?: (card: GameCard) => void;
  onContextMenu?: (card: GameCard, position: { x: number; y: number }) => void;
  onHover?: (card: GameCard | null) => void;
}

/**
 * A card in the sandbox. Width comes from the surrounding `--card-w` CSS variable so each zone
 * can size its cards; tapped cards turn sideways.
 */
export function GameCardView({
  card,
  handlers,
  className,
  draggable = true,
}: {
  card: GameCard;
  handlers: CardHandlers;
  className?: string;
  draggable?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.instanceId,
    disabled: !draggable,
  });
  const counters = Object.entries(card.counters);

  return (
    <motion.div
      ref={setNodeRef}
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: isDragging ? 0.3 : 1, scale: 1, rotate: card.tapped ? 90 : 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
      className={cn(
        "relative shrink-0 cursor-pointer touch-none select-none",
        card.tapped && "mx-[calc(var(--card-w)*0.2)]",
        className,
      )}
      style={{ width: "var(--card-w)" }}
      onClick={() => handlers.onClick?.(card)}
      onContextMenu={(e) => {
        e.preventDefault();
        handlers.onContextMenu?.(card, { x: e.clientX, y: e.clientY });
      }}
      onMouseEnter={() => handlers.onHover?.(card)}
      onMouseLeave={() => handlers.onHover?.(null)}
      data-card-name={card.faceDown ? undefined : card.card.name}
      {...attributes}
      {...listeners}
    >
      <CardFace card={card} />
      {(counters.length > 0 || card.isToken) && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[12%] flex flex-wrap justify-center gap-1">
          {counters.map(([kind, amount]) => (
            <span key={kind} className="rounded-sm bg-ink/90 px-1.5 py-0.5 text-xs font-bold text-ember tabular-nums shadow-xs ring-1 ring-ember/60">
              {kind === "+1/+1" ? `+${amount}/+${amount}` : `${amount} ${kind}`}
            </span>
          ))}
          {card.isToken && <span className="eyebrow rounded-sm bg-ink/85 px-1.5 py-0.5 text-[10px] text-muted-foreground">token</span>}
        </div>
      )}
    </motion.div>
  );
}

export function CardFace({ card }: { card: GameCard }) {
  if (card.faceDown) return <CardBack />;
  if (card.flipped && card.card.image?.doubleFaced) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Scryfall serves pre-sized images
      <img
        src={cardImageUrl(card.card.image, "normal", "back")}
        alt={card.card.name}
        draggable={false}
        className="card-aspect w-full rounded-[4.75%] object-cover shadow-lg"
      />
    );
  }
  return <CardImage card={card.card} />;
}
