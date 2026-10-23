"use client";

import { EnvelopeSimpleIcon, GithubLogoIcon, RedditLogoIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FEEDBACK, SITE } from "@/lib/site";

const EMAIL_HREF = `mailto:${FEEDBACK.email}?subject=${encodeURIComponent(`${SITE.name} feedback`)}`;

/** The ways to send feedback, behind whatever trigger `children` is. */
export function FeedbackDialog({ children }: { children: React.ReactElement }) {
  return (
    <Dialog>
      <DialogTrigger render={children} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Feedback</DialogTitle>
          <DialogDescription>Found a bug, a card that should not be there, or have an idea? I read all of it.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {FEEDBACK.reddit && (
            <Button nativeButton={false} render={<a href={FEEDBACK.reddit} target="_blank" rel="noreferrer" />}>
              <RedditLogoIcon /> Comment on Reddit
            </Button>
          )}
          <Button
            variant={FEEDBACK.reddit ? "outline" : "default"}
            nativeButton={false}
            render={<a href={FEEDBACK.issues} target="_blank" rel="noreferrer" />}
          >
            <GithubLogoIcon /> Open an issue on GitHub
          </Button>
          <Button variant="outline" nativeButton={false} render={<a href={EMAIL_HREF} />}>
            <EnvelopeSimpleIcon /> Send an email
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          For bugs, the commander and the page you were on help a lot. Decks stay in your browser; nothing is sent along.
        </p>
      </DialogContent>
    </Dialog>
  );
}
