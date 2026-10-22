import { cn } from "@/lib/utils";

/** Long-form text for the legal and about pages, styled on top of the shared `panel` surface. */
export function Prose({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "panel space-y-4 p-6 text-sm leading-relaxed text-muted-foreground sm:p-8",
        "[&_h2]:pt-4 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_h2:first-child]:pt-0",
        "[&_h3]:pt-2 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-foreground",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        "[&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5",
        "[&_a:not([data-slot])]:text-foreground [&_a:not([data-slot])]:underline [&_a:not([data-slot])]:underline-offset-2 [&_a:not([data-slot]):hover]:text-gold",
        className,
      )}
      {...props}
    />
  );
}

export function PageHeader({ title, lang, children }: { title: string; lang?: string; children?: React.ReactNode }) {
  return (
    <header className="space-y-2">
      <h1 lang={lang} className="text-2xl font-bold break-words hyphens-auto sm:text-4xl">
        <span className="text-gold-gradient">{title}</span>
      </h1>
      {children && <div className="text-sm text-muted-foreground">{children}</div>}
    </header>
  );
}

/** Postal address block; `address` keeps the semantics for assistive tech without italics. */
export function Address({ lines }: { lines: string[] }) {
  return (
    <address className="not-italic text-foreground">
      {lines.map((line) => (
        <span key={line} className="block">
          {line}
        </span>
      ))}
    </address>
  );
}

export function ExternalLink({ href, children }: { href: string; children?: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children ?? href.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
    </a>
  );
}
