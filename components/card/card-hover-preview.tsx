"use client";

import { cloneElement, useState } from "react";
import { createPortal } from "react-dom";

import type { CardDisplay } from "@/lib/cards/types";

import { CardImage } from "./card-image";

const PREVIEW_WIDTH = 260;

type HoverTarget = React.ReactElement<{
  onMouseMove?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
}>;

/** Shows a large card image next to the cursor while hovering the child element (mouse devices only). */
export function CardHoverPreview({
  card,
  children,
}: {
  card: CardDisplay;
  children: HoverTarget;
}) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  const trigger = cloneElement(children, {
    onMouseMove: (e: React.MouseEvent) => {
      children.props.onMouseMove?.(e);
      if (window.matchMedia("(pointer: fine)").matches) setPosition({ x: e.clientX, y: e.clientY });
    },
    onMouseLeave: (e: React.MouseEvent) => {
      children.props.onMouseLeave?.(e);
      setPosition(null);
    },
  });

  if (!position) return trigger;

  const left = position.x + 24 + PREVIEW_WIDTH > window.innerWidth ? position.x - PREVIEW_WIDTH - 24 : position.x + 24;
  const top = Math.min(Math.max(position.y - 180, 8), window.innerHeight - PREVIEW_WIDTH * 1.4 - 8);
  return (
    <>
      {trigger}
      {createPortal(
        <div className="pointer-events-none fixed z-50" style={{ left, top, width: PREVIEW_WIDTH }}>
          <CardImage card={card} eager />
        </div>,
        document.body,
      )}
    </>
  );
}
