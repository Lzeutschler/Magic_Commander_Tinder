import { ImageResponse } from "next/og";

import { BRAND_COLORS, BrandMarkImage, brandFonts } from "@/lib/brand";
import { cardImageUrl } from "@/lib/cards/image";
import { frontFaceName } from "@/lib/cards/names";
import { scryfallImageDataUrl } from "@/lib/server/scryfall-image";
import { loadSharedQuiz } from "@/lib/server/shared-quiz";
import { SITE } from "@/lib/site";

export const alt = "Commander matches from the Brewmance quiz";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const fonts = await brandFonts();

/** Card positions in the fan: second and third match behind, the best match in the middle on top. */
const FAN = [
  { match: 1, left: 0, top: 46, rotate: -11 },
  { match: 2, left: 196, top: 46, rotate: 11 },
  { match: 0, left: 98, top: 0, rotate: 0 },
];

/** The best match with its reasons on the left, the top three commanders fanned out on the right. */
export default async function SharedQuizImage({ params }: { params: Promise<{ code: string }> }) {
  const quiz = await loadSharedQuiz((await params).code);
  const top = quiz?.matches[0];
  const cards = await Promise.all(
    (quiz?.matches ?? []).slice(0, 3).map((m) => (m.card.image ? scryfallImageDataUrl(cardImageUrl(m.card.image, "normal")) : null)),
  );
  const more = (quiz?.matches.length ?? 0) - 1;

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
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <BrandMarkImage size={48} />
            <div style={{ display: "flex", fontFamily: "Alegreya", fontSize: 34, fontWeight: 800 }}>{SITE.name}</div>
          </div>
          <div style={{ display: "flex", fontSize: 26, fontWeight: 600, color: BRAND_COLORS.muted }}>My Commander match</div>
          <div
            style={{
              display: "flex",
              fontFamily: "Alegreya",
              fontSize: top && frontFaceName(top.card.name).length > 24 ? 52 : 64,
              fontWeight: 800,
              lineHeight: 1.04,
              maxHeight: 140,
              overflow: "hidden",
            }}
          >
            {top ? frontFaceName(top.card.name) : "Find your commander"}
          </div>
          {top && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", fontSize: 34, fontWeight: 600, color: BRAND_COLORS.brand }}>{`${top.percent}% match`}</div>
              {top.reasons.map((reason) => (
                // A dot, not a check mark: the Open Graph fonts have no "✓".
                <div key={reason} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 24, color: BRAND_COLORS.muted }}>
                  <div style={{ display: "flex", width: 9, height: 9, borderRadius: 5, backgroundColor: BRAND_COLORS.brand }} />
                  <div style={{ display: "flex" }}>{reason}</div>
                </div>
              ))}
              {more > 0 && (
                <div style={{ display: "flex", fontSize: 22, color: BRAND_COLORS.brandLight }}>
                  {`+ ${more} more on the shortlist`}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: "flex", position: "relative", width: 456, height: 420 }}>
          {FAN.map(({ match, left, top: y, rotate }) =>
            cards[match] ? (
              <img
                key={match}
                src={cards[match]}
                alt=""
                width={260}
                height={362}
                style={{
                  position: "absolute",
                  left: cards.length === 1 ? 98 : left,
                  top: y,
                  transform: `rotate(${cards.length === 1 ? 0 : rotate}deg)`,
                  borderRadius: 13,
                  boxShadow: "0 18px 36px rgba(0,0,0,0.6)",
                }}
              />
            ) : null,
          )}
        </div>
      </div>
    ),
    // The code fixes the result, so the CDN can keep the image instead of rendering it for every crawler.
    { ...size, fonts, headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000" } },
  );
}
