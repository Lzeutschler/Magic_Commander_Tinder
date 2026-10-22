import { ImageResponse } from "next/og";

import { BRAND_COLORS, BrandMarkImage, brandFonts } from "@/lib/brand";

export const alt = "Commander Tinder — swipe your way to a Commander deck";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Read at module level, as in the Next.js docs, so the image is rendered once at build time.
const fonts = await brandFonts();

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
          fontFamily: "Archivo",
          color: BRAND_COLORS.text,
          backgroundColor: BRAND_COLORS.background,
          backgroundImage: `linear-gradient(180deg, ${BRAND_COLORS.surface} 0%, ${BRAND_COLORS.background} 70%)`,
          borderBottom: `14px solid ${BRAND_COLORS.ember}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <BrandMarkImage size={88} />
          <div style={{ display: "flex", fontFamily: "Alegreya", fontSize: 64, fontWeight: 800 }}>
            Commander&nbsp;<span style={{ color: BRAND_COLORS.ember }}>Tinder</span>
          </div>
        </div>
        <div style={{ display: "flex", fontFamily: "Alegreya", fontSize: 76, fontWeight: 800, lineHeight: 1.02, maxWidth: 980 }}>
          Swipe your way to a Commander deck.
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: 2.5,
            textTransform: "uppercase",
            color: BRAND_COLORS.muted,
          }}
        >
          Pick a commander · swipe through cards · goldfish it
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
