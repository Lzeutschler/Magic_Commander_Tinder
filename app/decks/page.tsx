import { Plus, Upload } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { DeckList } from "@/components/deck/deck-list";
import { ImportDialog } from "@/components/deck/import-dialog";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "My decks" };

export default function DecksPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">
            <span className="text-gold-gradient">My decks</span>
          </h1>
          <p className="text-sm text-muted-foreground">Saved in this browser.</p>
        </div>
        <div className="flex gap-2">
          <ImportDialog>
            <Button variant="outline">
              <Upload /> Import
            </Button>
          </ImportDialog>
          <Button nativeButton={false} render={<Link href="/build" />}>
            <Plus /> New deck
          </Button>
        </div>
      </header>
      <DeckList />
    </div>
  );
}
