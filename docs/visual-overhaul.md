# PokeVault Intelligence — Visual Overhaul Brief

**Purpose:** complete visual redesign of the app. The current design is too plain. Apply ALL of the following. **Do not change any features, data, or layouts — visuals only.** When done, every page should look like a premium commercial app, not a student project.

## 1. Real card images
Every card tile and the Home hero must show actual card artwork hotlinked from PokéTCG.io image URLs — no plain colored placeholder boxes anywhere.

## 2. Home hero
A dramatic hero with a fan of 3 large real card images tilted in 3D (CSS `transform: perspective + rotateY`), overlapping each other, with colored glow shadows behind them and a slow floating animation.

## 3. 3D card tilt
All card tiles tilt in 3D toward the mouse cursor on hover (small perspective transform), with the card image scaling up slightly and a colored glow appearing behind the tile.

## 4. Glass panels
Stat tiles, filter bars, and side panels become frosted glass — translucent background, backdrop blur, thin light border.

## 5. Background
Animated gradient mesh — several large blurred color blobs (red, yellow, teal) drifting slowly behind everything, plus a subtle dot-grid texture, on the Deep Navy base (`--bg: #0A1E3C`).

## 6. Holo foil
Rare and secret rare card tiles get an animated rainbow sheen sweeping across the image.

## 7. Typography
Bigger, bolder headings in Outfit with a yellow-to-red gradient text fill on the main headline.

## 8. Micro-animations
Buttons lift and glow on hover, toasts slide in, page content fades in on load. All animations disabled under `prefers-reduced-motion`.

## Design tokens
Keep using the CSS design tokens in `docs/design-doc.md` (colors, radius, shadows, spacing scale). Deep Navy `#0A1E3C` is the base; Poké Red `#EE1515` and Base Yellow `#FFCB05` are accents.

## Acceptance checks (all must pass)
1. Real card pictures visible on Home and in the grid
2. Cards physically tilt when the mouse moves over them
3. The background moves (blobs drifting), not flat navy
4. Panels look frosted/glassy, not flat rectangles
5. The headline has the gradient fill
6. Dark AND light mode both look intentional
7. No existing feature behavior changed
