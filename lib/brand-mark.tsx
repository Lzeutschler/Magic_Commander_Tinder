/** Colors of the brand mark; CSS variables in the app, hex values in generated images. */
export interface MarkColors {
  brew: string;
  rim: string;
  legs: string;
  heart: string;
}

/**
 * The brand mark: a cauldron with a heart rising from the brew ("brew" + "romance"). Drawn on a
 * 32×32 grid with plain shapes, so the same drawing works in the app, in `ImageResponse` and in
 * `app/icon.svg` (which repeats these shapes by hand). It has no lettering, so a rename only
 * touches `SITE.name`.
 */
export function BrandMarkSvg({ colors, size, className }: { colors: MarkColors; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden="true">
      <path
        d="M16 10.2c-.3 0-4.8-2.9-4.8-6.1 0-1.6 1.2-2.8 2.7-2.8.9 0 1.7.5 2.1 1.3.4-.8 1.2-1.3 2.1-1.3 1.5 0 2.7 1.2 2.7 2.8 0 3.2-4.5 6.1-4.8 6.1Z"
        fill={colors.heart}
      />
      <circle cx="22.6" cy="9.4" r="1.4" fill={colors.heart} opacity="0.7" />
      <circle cx="9.6" cy="10.4" r="1" fill={colors.heart} opacity="0.55" />
      <path d="M9.4 23.6 8.6 28h2.4l.9-3.4Z" fill={colors.legs} />
      <path d="M22.6 23.6l.8 4.4H21l-.9-3.4Z" fill={colors.legs} />
      <path d="M8.2 14.4C3.6 16.6 3.9 26 16 26s12.4-9.4 7.8-11.6Z" fill={colors.brew} />
      <rect x="7" y="12" width="18" height="3.2" rx="1.6" fill={colors.rim} />
    </svg>
  );
}
