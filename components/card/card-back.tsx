import { Flame } from "lucide-react";

import { cn } from "@/lib/utils";

/** The app's own card back (the official Magic card back is not used). */
export function CardBack({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "card-aspect grid place-items-center overflow-hidden rounded-[4.75%] border-[3px] border-[oklch(0.45_0.08_75)] shadow-lg shadow-black/50",
        className,
      )}
      style={{
        background:
          "radial-gradient(circle at 50% 40%, oklch(0.42 0.12 290), oklch(0.22 0.07 280) 55%, oklch(0.13 0.03 270))",
      }}
    >
      <div className="grid size-1/2 place-items-center rounded-full border border-gold/40 bg-black/20">
        <Flame className="size-1/2 text-gold/80" />
      </div>
    </div>
  );
}
