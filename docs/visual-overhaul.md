# PokeVault Visual Overhaul Directive

Complete visual overhaul of the app. The current design is too plain. Apply ALL of the following. Do not change any features, data, or layouts — visuals only.

1. **REAL CARD IMAGES:** every card tile and the Home hero must show actual card artwork hotlinked from PokéTCG.io image URLs — no plain colored placeholder boxes anywhere.
2. **HOME HERO:** a dramatic hero with a fan of 3 large real card images tilted in 3D (CSS transform: perspective + rotateY), overlapping each other, with colored glow shadows behind them and a slow floating animation.
3. **3D CARD TILT:** all card tiles tilt in 3D toward the mouse cursor on hover (small perspective transform), with the card image scaling up slightly and a colored glow appearing behind the tile.
4. **GLASS PANELS:** stat tiles, filter bars, and side panels become frosted glass — translucent background, backdrop blur, thin light border.
5. **BACKGROUND:** animated gradient mesh — several large blurred color blobs (red, yellow, teal) drifting slowly behind everything, plus a subtle dot-grid texture, on the Deep Navy base.
6. **HOLO FOIL:** rare and secret rare card tiles get an animated rainbow sheen sweeping across the image.
7. **TYPOGRAPHY:** bigger, bolder headings in Outfit with a yellow-to-red gradient text fill on the main headline.
8. **MICRO-ANIMATIONS:** buttons lift and glow on hover, toasts slide in, page content fades in on load. All animations disabled under `prefers-reduced-motion`.

A working CSS reference demonstrating every technique is in `docs/visual-reference.css` (extracted from the approved graphics mockup). Adapt it to the app's existing design tokens in docs/design-doc.md — same color variables, radius, shadows, and fonts. When done, every page should look like a premium commercial app, not a student project.

**Acceptance checks (all must pass):**
- Real card pictures visible on Home and in the card grid
- Card tiles physically tilt toward the cursor on hover
- Background blobs drift (animated), disabled under prefers-reduced-motion
- Panels are frosted glass, not flat rectangles
- Main headline uses the gradient text fill
- Dark AND light modes both look correct
