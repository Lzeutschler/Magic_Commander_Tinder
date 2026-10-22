import type { Metadata } from "next";
import Link from "next/link";

import { DeckList } from "@/components/deck/deck-list";
import { ImportDialog } from "@/components/deck/import-dialog";
import { PlusIcon, UploadSimpleIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "My decks" };

export default function DecksPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10">
      <PageHeader
        eyebrow="Your library"
        title="My decks"
        description="Saved in this browser."
        actions={
          <>
            <ImportDialog>
              <Button variant="outline">
                <UploadSimpleIcon /> Import
              </Button>
            </ImportDialog>
            <Button nativeButton={false} render={<Link href="/build" />}>
              <PlusIcon /> New deck
            </Button>
          </>
        }
      />
      <DeckList />
    </div>
  );
}
