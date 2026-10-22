"use client";

import { useState } from "react";
import { toast } from "sonner";

import { CopyIcon, DownloadSimpleIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { EXPORT_FORMATS, deckFileName, exportDeck, type ExportFormat } from "@/lib/deck-io/export";
import type { Deck } from "@/lib/decks/types";
import { cn } from "@/lib/utils";

export function ExportDialog({ deck, children }: { deck: Deck; children: React.ReactElement }) {
  const [format, setFormat] = useState<ExportFormat>("sections");
  const text = exportDeck(deck, format);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    toast.success("Deck list copied");
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const link = Object.assign(document.createElement("a"), { href: url, download: deckFileName(deck) });
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog>
      <DialogTrigger render={children} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Export deck</DialogTitle>
          <DialogDescription>Paste this list into Moxfield, Archidekt, MTG Arena or any deck site.</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          {EXPORT_FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFormat(f.id)}
              className={cn(
                "min-h-10 flex-1 rounded-md border border-border bg-card px-3 py-2 text-left text-sm shadow-sm transition hover:border-input hover:bg-accent",
                format === f.id && "border-brand bg-brand/12 hover:border-brand hover:bg-brand/12",
              )}
            >
              <div className="font-medium">{f.label}</div>
              <div className="text-xs text-muted-foreground">{f.hint}</div>
            </button>
          ))}
        </div>
        <Textarea readOnly value={text} className="h-64 font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={download}>
            <DownloadSimpleIcon /> Download .txt
          </Button>
          <Button onClick={copy}>
            <CopyIcon /> Copy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
