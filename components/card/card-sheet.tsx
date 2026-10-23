"use client";

import { useState } from "react";

import { EdhrecLink } from "@/components/edhrec-link";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Card } from "@/lib/cards/types";
import { edhrecCardUrl } from "@/lib/edhrec/links";
import { ROLE_LABELS } from "@/lib/tagging/roles";

import { CardImage } from "./card-image";

/**
 * A card big enough to read, with its roles, price and optional actions (`children`). Lists open it
 * when a card is tapped: touch screens have no hover preview.
 */
export function CardSheet({ card, onClose, children }: { card: Card | null; onClose: () => void; children?: React.ReactNode }) {
  // Keeps showing the last card while the dialog animates out.
  const [shown, setShown] = useState(card);
  if (card && card !== shown) setShown(card);

  return (
    <Dialog open={card !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        {shown && (
          <>
            <DialogHeader className="pr-8">
              <DialogTitle>{shown.name}</DialogTitle>
              <DialogDescription>{shown.typeLine}</DialogDescription>
            </DialogHeader>
            <div className="mx-auto w-[min(18rem,72vw)]">
              <CardImage card={shown} size="large" flippable eager />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {shown.gameChanger && <Badge>Game Changer</Badge>}
              {shown.roles
                .filter((r) => r !== "mld" && r !== "extraturn")
                .map((role) => (
                  <Badge key={role} variant="secondary">
                    {ROLE_LABELS[role]}
                  </Badge>
                ))}
              {shown.priceUsd !== null && <Badge variant="outline">${shown.priceUsd.toFixed(2)}</Badge>}
              <EdhrecLink href={edhrecCardUrl(shown.name)} className="px-1 text-xs text-muted-foreground">
                EDHREC
              </EdhrecLink>
            </div>
            {children && <div className="flex flex-wrap items-center justify-center gap-2">{children}</div>}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Whether the device has no mouse to hover with, so a tap should open the card instead. */
export function isTouchScreen(): boolean {
  return window.matchMedia("(pointer: coarse)").matches;
}
