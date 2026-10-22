import { ImageResponse } from "next/og";

import { BRAND_COLORS, FlameMark } from "@/lib/brand";
import { SITE } from "@/lib/site";

export const alt = "Commander Tinder — swipe your way to a Commander deck";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          gap: 28,
          color: BRAND_COLORS.text,
          backgroundColor: BRAND_COLORS.background,
          backgroundImage:
            "radial-gradient(ellipse 80% 70% at 50% -10%, rgba(76, 70, 150, 0.6), transparent 70%), radial-gradient(ellipse 60% 50% at 100% 110%, rgba(110, 50, 120, 0.45), transparent 70%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <FlameMark size={96} />
          <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: 2, color: BRAND_COLORS.goldLight }}>
            {SITE.name}
          </div>
        </div>
        <div style={{ fontSize: 44, lineHeight: 1.25, maxWidth: 900 }}>Swipe your way to a Commander deck.</div>
        <div style={{ fontSize: 28, color: "rgba(243, 239, 230, 0.7)" }}>
          Pick a commander · swipe through cards that fit · goldfish it
        </div>
      </div>
    ),
    size,
  );
}
