import { ImageResponse } from "next/og";

import { BRAND_COLORS, BrandMarkImage, brandFonts } from "@/lib/brand";
import { cardImageUrl } from "@/lib/cards/image";
import { BRACKET_INFO } from "@/lib/deckbuilder/brackets";
import { TEMPLATE_ROLE_LABELS, type TemplateRole } from "@/lib/deckbuilder/template";
import { deckStats } from "@/lib/decks/stats";
import { SITE } from "@/lib/site";
import { loadSharedDeck } from "@/lib/server/shared-deck";

export const alt = "A Commander deck shared from Brewmance";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const fonts = await brandFonts();

/** Curve labels in characters the Open Graph fonts have ("≤" is missing). */
const CURVE = ["0–1", "2", "3", "4", "5", "6+"];

/** The roles shown on the image, with labels short enough for one row. */
const ROLES: [TemplateRole, string][] = [
  ["ramp", TEMPLATE_ROLE_LABELS.ramp],
  ["draw", "Draw"],
  ["interaction", TEMPLATE_ROLE_LABELS.interaction],
  ["boardwipe", "Wipes"],
];

/** Commander art on the left; name, bracket, roles and curve on the right, so a link preview reads like a deck. */
export default async function SharedDeckImage({ params }: { params: Promise<{ code: string }> }) {
  const deck = await loadSharedDeck((await params).code);
  const stats = deck ? deckStats(deck) : null;
  const maxCurve = Math.max(1, ...(stats?.curve ?? []));
  const art = deck?.commander.image ? await imageDataUrl(cardImageUrl(deck.commander.image, "normal")) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 56,
          padding: "0 64px",
          fontFamily: "Archivo",
          color: BRAND_COLORS.text,
          backgroundColor: BRAND_COLORS.background,
          backgroundImage: `linear-gradient(180deg, ${BRAND_COLORS.surface} 0%, ${BRAND_COLORS.background} 70%)`,
          borderBottom: `14px solid ${BRAND_COLORS.brand}`,
        }}
      >
        {art && (
          <img
            src={art}
            alt=""
            width={384}
            height={535}
            style={{ borderRadius: 18, boxShadow: "0 18px 40px rgba(0,0,0,0.6)" }}
          />
        )}

        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <BrandMarkImage size={48} />
            <div style={{ display: "flex", fontFamily: "Alegreya", fontSize: 34, fontWeight: 800 }}>{SITE.name}</div>
          </div>

          <div
            style={{
              display: "flex",
              fontFamily: "Alegreya",
              fontSize: (deck?.name.length ?? 0) > 26 ? 54 : 68,
              fontWeight: 800,
              lineHeight: 1.04,
              maxHeight: 150,
              overflow: "hidden",
            }}
          >
            {deck ? deck.name : "A Commander deck"}
          </div>

          {deck && stats ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div style={{ display: "flex", fontSize: 28, fontWeight: 600, color: BRAND_COLORS.brand }}>
                {`Bracket ${deck.bracket} · ${BRACKET_INFO[deck.bracket].name} · ${stats.total + 1} cards`}
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                {ROLES.map(([role, label]) => (
                  <div
                    key={role}
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 10,
                      padding: "8px 16px",
                      borderRadius: 8,
                      backgroundColor: BRAND_COLORS.ink,
                      fontSize: 22,
                    }}
                  >
                    <span style={{ color: BRAND_COLORS.muted }}>{label}</span>
                    <span style={{ fontWeight: 600 }}>{stats.roles[role]}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 120 }}>
                {stats.curve.map((count, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div
                      style={{
                        width: 56,
                        height: Math.max(4, (count / maxCurve) * 84),
                        borderRadius: "4px 4px 0 0",
                        backgroundColor: BRAND_COLORS.brand,
                      }}
                    />
                    <div style={{ display: "flex", fontSize: 18, color: BRAND_COLORS.muted }}>{CURVE[i]}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", fontSize: 28, color: BRAND_COLORS.muted }}>
              Pick a commander · swipe through cards · goldfish it
            </div>
          )}
        </div>
      </div>
    ),
    // The code fixes the deck, so the CDN can keep the image instead of rendering it for every crawler.
    { ...size, fonts, headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000" } },
  );
}

/**
 * The card image as a data URL. ImageResponse would fetch it with a generic User-Agent, which
 * Scryfall rejects, so it is fetched here; without it the image simply leaves the card out.
 */
async function imageDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Brewmance/0.1", Accept: "image/*" },
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return null;
    return `data:${res.headers.get("content-type") ?? "image/jpeg"};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
  } catch {
    return null;
  }
}
