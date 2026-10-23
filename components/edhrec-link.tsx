import { ArrowUpRightIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

/**
 * A link to the EDHREC page our numbers come from. Opens in a new tab with `noopener` only, not
 * `noreferrer`, so EDHREC can see the visits we send them.
 */
export function EdhrecLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className={cn("inline-flex items-center gap-0.5 underline decoration-border underline-offset-2 hover:text-foreground hover:decoration-current", className)}
    >
      {children}
      <ArrowUpRightIcon className="size-3 shrink-0" aria-hidden />
    </a>
  );
}
