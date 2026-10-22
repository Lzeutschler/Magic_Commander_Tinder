# Fonts

`mana.woff2` is the [Mana](https://github.com/andrewgioia/mana) symbol font by Andrew Gioia (from the
`mana-font` npm package, v1.18.0), licensed under the [SIL Open Font License 1.1](https://openfontlicense.org).
The symbols themselves are © Wizards of the Coast. The `mplantin` font that ships in the same package is
a commercial typeface and is deliberately not used.

`og/` holds static WOFF cuts of Alegreya (800) and Archivo (400, 600) from the `@fontsource` packages, also
SIL OFL 1.1. `ImageResponse` cannot read the variable WOFF2 files that `next/font` serves, so the Open Graph
image and the Apple touch icon load these instead (`lib/brand.tsx`).
