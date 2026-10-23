"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ShareNetworkIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { encodeSharedDeck } from "@/lib/deck-io/share";
import type { Deck } from "@/lib/decks/types";

/** Copies a link that carries the whole deck; phones open the system share sheet instead. */
export function ShareButton({ deck }: { deck: Deck }) {
  const [url, setUrl] = useState<string | null>(null);

  // Built ahead of the click: Safari only allows sharing and copying right inside the click handler.
  useEffect(() => {
    let current = true;
    encodeSharedDeck(deck).then((code) => {
      if (current) setUrl(`${window.location.origin}/d/${code}`);
    });
    return () => {
      current = false;
    };
  }, [deck]);

  const share = async () => {
    if (!url) return;
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title: deck.name, url });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied", { description: "Anyone with the link can see, goldfish and copy this deck." });
    } catch {
      toast.error("Could not copy the link");
    }
  };

  return (
    <Button variant="outline" onClick={share} disabled={!url}>
      <ShareNetworkIcon /> Share
    </Button>
  );
}
