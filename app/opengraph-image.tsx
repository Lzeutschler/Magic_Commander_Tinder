import { ImageResponse } from "next/og";

import { BRAND_COLORS, BrandMarkImage, brandFonts } from "@/lib/brand";
import { cardImageUrl } from "@/lib/cards/image";
import { SHOWCASE_COMMANDERS } from "@/lib/cards/showcase";
import { SITE_IMAGE } from "@/lib/metadata";
import { scryfallImageDataUrl } from "@/lib/server/scryfall-image";
import { SITE } from "@/lib/site";

export const alt = SITE_IMAGE.alt;
export const size = SITE_IMAGE.size;
export const contentType = SITE_IMAGE.contentType;

// Read at module level, as in the Next.js docs, so the image is rendered once at build time.
const fonts = await brandFonts();

/** What sets the site apart, one chip each. */
const POINTS = ["Roles and curve on target", "Bracket-aware", "Goldfish in your browser"];

/** The fanned cards: left, right, then the middle one on top. */
const FAN = [
  { index: 0, left: 0, top: 46, rotate: -11 },
  { index: 2, left: 196, top: 46, rotate: 11 },
  { index: 1, left: 98, top: 0, rotate: 0 },
];

/** Headline and selling points on the left, three commanders fanned out on the right. */
export default async function OpengraphImage() {
  const cards = await Promise.all(SHOWCASE_COMMANDERS.map((c) => scryfallImageDataUrl(cardImageUrl(c.image, "normal"))));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 40,
          padding: "0 64px 0 80px",
          fontFamily: "Archivo",
          color: BRAND_COLORS.text,
          backgroundColor: BRAND_COLORS.background,
          backgroundImage: `linear-gradient(180deg, ${BRAND_COLORS.surface} 0%, ${BRAND_COLORS.background} 70%)`,
          borderBottom: `14px solid ${BRAND_COLORS.brand}`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <BrandMarkImage size={64} />
            <div style={{ display: "flex", fontFamily: "Alegreya", fontSize: 46, fontWeight: 800 }}>{SITE.name}</div>
          </div>
          <div style={{ display: "flex", fontFamily: "Alegreya", fontSize: 60, fontWeight: 800, lineHeight: 1.04 }}>
            {`${SITE.tagline}.`}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {POINTS.map((point) => (
              <div
                key={point}
                style={{
                  display: "flex",
                  padding: "8px 16px",
                  borderRadius: 8,
                  backgroundColor: BRAND_COLORS.ink,
                  fontSize: 22,
                  fontWeight: 600,
                  color: BRAND_COLORS.brandLight,
                }}
              >
                {point}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", position: "relative", width: 456, height: 420 }}>
          {FAN.map(({ index, left, top, rotate }) =>
            cards[index] ? (
              <img
                key={index}
                src={cards[index]}
                alt=""
                width={260}
                height={362}
                style={{
                  position: "absolute",
                  left,
                  top,
                  transform: `rotate(${rotate}deg)`,
                  borderRadius: 13,
                  boxShadow: "0 18px 36px rgba(0,0,0,0.6)",
                }}
              />
            ) : null,
          )}
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
