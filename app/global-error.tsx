"use client";

import "./globals.css";

/** Replaces the root layout when it fails, so it brings its own document and only relies on global CSS. */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="flex min-h-full flex-col items-center justify-center gap-5 px-4 text-center font-sans">
        <title>Something went wrong · Commander Tinder</title>
        <h1 className="text-2xl font-bold">Commander Tinder hit a snag</h1>
        <p className="max-w-md text-muted-foreground">
          The app could not load. Your decks are stored in your browser and are safe. Please try again in a moment.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => retry()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
          >
            Try again
          </button>
          {/* A full page load, since the client router is part of what failed. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-muted">
            Back to the start
          </a>
        </div>
      </body>
    </html>
  );
}
